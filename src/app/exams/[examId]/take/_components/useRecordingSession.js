'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import RecordingManager from '@/utils/recordingManager';
import ServerSideLiveStream from '@/utils/serverSideLiveStream';
import ExamAttendanceTracker from '@/utils/examAttendanceTracker';

// Handles proctoring permission grant/deny, recording manager setup,
// server-side live streaming, and the attendance tracker.
// Extracted verbatim (no logic changes) from the take exam page.
export default function useRecordingSession({
    exam,
    attemptId,
    examId,
    user,
    router,
    recordingManagerRef,
    liveStreamManagerRef,
    attendanceTrackerRef,
    setShowPermissionModal,
    setRecordingStarted,
}) {
    const [permissionDenied, setPermissionDenied] = useState(false);

    // Handle permission allow
    const handlePermissionAllow = async () => {
        setShowPermissionModal(false);

        // Initialize recording manager
        recordingManagerRef.current = new RecordingManager();

        // Pass exam settings to recording manager
        const recordingSettings = {
            allowCam: exam?.settings?.allowCam || false,
            allowMic: exam?.settings?.allowMic || false,
            allowScreenShare: exam?.settings?.allowScreenShare || false
        };

        const result = await recordingManagerRef.current.startRecording(attemptId, examId, recordingSettings);

        if (result.success) {
            setRecordingStarted(true);
            toast.success('Recording started successfully!');

            // Note: Stream preview disabled for students during exam
            // Students should not see their own recording preview to avoid distraction
            try {
                const streams = recordingManagerRef.current.getLiveStreams();
                // setCameraStream(streams.camera);  // Hidden for student
                // setScreenStream(streams.screen);   // Hidden for student
            } catch (streamError) {
                // Ignore stream info error
            }

            // Setup screen share stop handler only if screen recording is enabled
            if (exam?.settings?.allowScreenShare) {
                window.onScreenShareStopped = () => {
                    toast.error('Screen sharing stopped! Please share your screen again.');
                    // Note: Screen stream preview already disabled for students
                };
            }

            // Start server-side live streaming
            try {
                liveStreamManagerRef.current = new ServerSideLiveStream();
                const streams = recordingManagerRef.current.getLiveStreams();


                await liveStreamManagerRef.current.startStreaming(
                    attemptId,
                    streams.camera,
                    streams.screen
                );
            } catch (error) {
                toast.warn('Live streaming failed, but recording continues');
                // Don't fail exam if streaming fails
            }
            // Start Attendance Tracker
            const courseId = exam?.courseId || (exam?.category?.name === 'Free Material' ? 'free_material' : 'unknown');
            attendanceTrackerRef.current = new ExamAttendanceTracker({
                attemptId,
                examId: examId,
                userId: user._id || user.id,
                courseId: courseId,
                interval: exam?.settings?.faceVerification?.intervalCheck * 60000 || 300000 // use exam setting or 5m
            });
            attendanceTrackerRef.current.start(streams.camera);
        } else {
            toast.error('Failed to start recording: ' + result.error);
            setPermissionDenied(true);
            setTimeout(() => {
                router.push('/my-exams');
            }, 2000);
        }
    };

    // Handle permission cancel
    const handlePermissionCancel = () => {
        setShowPermissionModal(false);
        setPermissionDenied(true);
        toast.error('Recording permissions are required to take this exam.');
        setTimeout(() => {
            router.push('/my-exams');
        }, 2000);
    };

    // Cleanup streams on component unmount - streams handled by recording manager
    useEffect(() => {
        return () => {
            // Note: Stream cleanup now handled by recording manager
            // Recording manager will handle proper cleanup of streams

            // Stop live streaming
            if (liveStreamManagerRef.current) {
                liveStreamManagerRef.current.stopStreaming();
            }

            // Stop attendance tracker
            if (attendanceTrackerRef.current) {
                attendanceTrackerRef.current.stop();
            }
        };
    }, []);

    return {
        permissionDenied,
        handlePermissionAllow,
        handlePermissionCancel,
    };
}
