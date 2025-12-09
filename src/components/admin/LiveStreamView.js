'use client';
import React, { useEffect, useRef } from 'react';

export default function LiveStreamView({ attemptId }) {
    const cameraVideoRef = useRef(null);
    const screenVideoRef = useRef(null);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (!attemptId) return;

        // Fetch live stream frames every 500ms
        const fetchFrames = async () => {
            try {
                // Fetch camera frame
                const cameraResponse = await fetch(
                    `/api/exams/live-stream?attemptId=${attemptId}&streamType=camera`
                );

                if (cameraResponse.ok) {
                    const cameraBlob = await cameraResponse.blob();
                    const cameraUrl = URL.createObjectURL(cameraBlob);

                    if (cameraVideoRef.current) {
                        cameraVideoRef.current.src = cameraUrl;
                    }
                }

                // Fetch screen frame
                const screenResponse = await fetch(
                    `/api/exams/live-stream?attemptId=${attemptId}&streamType=screen`
                );

                if (screenResponse.ok) {
                    const screenBlob = await screenResponse.blob();
                    const screenUrl = URL.createObjectURL(screenBlob);

                    if (screenVideoRef.current) {
                        screenVideoRef.current.src = screenUrl;
                    }
                }
            } catch (error) {
                // Silently fail
            }
        };

        // Start polling
        fetchFrames();
        intervalRef.current = setInterval(fetchFrames, 500);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [attemptId]);

    return (
        <div className="row g-3">
            {/* Camera Feed */}
            <div className="col-md-6">
                <div className="card">
                    <div className="card-header bg-dark text-white">
                        <i className="bi bi-camera-video me-2"></i>
                        Camera Feed
                    </div>
                    <div className="card-body p-0">
                        <div className="ratio ratio-16x9 bg-secondary">
                            <img
                                ref={cameraVideoRef}
                                alt="Camera Feed"
                                className="w-100 h-100"
                                style={{ objectFit: 'cover' }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Screen Feed */}
            <div className="col-md-6">
                <div className="card">
                    <div className="card-header bg-dark text-white">
                        <i className="bi bi-display me-2"></i>
                        Screen Feed
                    </div>
                    <div className="card-body p-0">
                        <div className="ratio ratio-16x9 bg-secondary">
                            <img
                                ref={screenVideoRef}
                                alt="Screen Feed"
                                className="w-100 h-100"
                                style={{ objectFit: 'contain' }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
