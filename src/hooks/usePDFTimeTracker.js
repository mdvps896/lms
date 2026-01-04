'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to track PDF viewing time
 * Usage: const { startTracking, stopTracking, duration } = usePDFTimeTracker({ userId, courseId, lectureId, lectureName, pdfUrl, pdfName });
 */
export function usePDFTimeTracker({ userId, courseId, lectureId, lectureName, pdfUrl, pdfName }) {
    const [sessionId, setSessionId] = useState(null);
    const [duration, setDuration] = useState(0);
    const [isTracking, setIsTracking] = useState(false);
    const intervalRef = useRef(null);
    const currentPageRef = useRef(1);

    // Start tracking
    const startTracking = async (currentPage = 1, totalPages = 0) => {
        try {
            currentPageRef.current = currentPage;

            const response = await fetch('/api/courses/track-pdf-view', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'start',
                    userId,
                    courseId,
                    lectureId,
                    lectureName,
                    pdfUrl,
                    pdfName,
                    currentPage,
                    totalPages
                })
            });

            const data = await response.json();

            if (data.success) {
                setSessionId(data.sessionId);
                setIsTracking(true);
                console.log('📊 Started tracking PDF:', data.sessionId);

                // Start heartbeat to update session every 10 seconds
                intervalRef.current = setInterval(() => {
                    updateSession(currentPageRef.current);
                }, 10000); // Update every 10 seconds
            }
        } catch (error) {
            console.error('Error starting PDF tracking:', error);
        }
    };

    // Update session (heartbeat)
    const updateSession = async (currentPage) => {
        if (!sessionId) return;

        try {
            const response = await fetch('/api/courses/track-pdf-view', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update',
                    sessionId,
                    userId,
                    courseId,
                    lectureId,
                    currentPage
                })
            });

            const data = await response.json();

            if (data.success) {
                setDuration(data.duration);
            }
        } catch (error) {
            console.error('Error updating PDF session:', error);
        }
    };

    // Update current page
    const updateCurrentPage = (pageNumber) => {
        currentPageRef.current = pageNumber;
    };

    // Stop tracking
    const stopTracking = async () => {
        if (!sessionId) return;

        try {
            // Clear interval
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }

            const response = await fetch('/api/courses/track-pdf-view', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'end',
                    sessionId,
                    userId,
                    courseId,
                    lectureId
                })
            });

            const data = await response.json();

            if (data.success) {
                setDuration(data.duration);
                setIsTracking(false);
                console.log('⏹️ Stopped tracking PDF. Total time:', data.formattedDuration);
            }

            setSessionId(null);
        } catch (error) {
            console.error('Error stopping PDF tracking:', error);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isTracking && sessionId) {
                stopTracking();
            }
        };
    }, [isTracking, sessionId]);

    // Format duration for display
    const formatDuration = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    };

    return {
        startTracking,
        stopTracking,
        updateCurrentPage,
        duration,
        formattedDuration: formatDuration(duration),
        isTracking,
        sessionId
    };
}

/**
 * Hook to get PDF viewing statistics
 */
export function usePDFStats({ userId, courseId, lectureId }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchStats = async () => {
        if (!userId) return;

        setLoading(true);
        try {
            const params = new URLSearchParams({ userId });
            if (courseId) params.append('courseId', courseId);
            if (lectureId) params.append('lectureId', lectureId);

            const response = await fetch(`/api/courses/track-pdf-view?${params}`);
            const data = await response.json();

            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching PDF stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [userId, courseId, lectureId]);

    return {
        stats,
        loading,
        refetch: fetchStats
    };
}
