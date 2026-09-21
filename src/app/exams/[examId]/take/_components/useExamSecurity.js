'use client';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

// Anti-cheating measures: force-submit polling, tab-switch detection,
// screenshot/devtools shortcut blocking, and context-menu blocking.
// Extracted verbatim (no logic changes) from the take exam page.
export default function useExamSecurity({
    exam,
    attemptId,
    examId,
    sessionToken,
    recordingStarted,
    recordingManagerRef,
    router,
    onAutoSubmit,
}) {
    const [showTabWarning, setShowTabWarning] = useState(false);
    const [showScreenshotWarning, setShowScreenshotWarning] = useState(false);
    const tabSwitchCountRef = useRef(null);

    // Check if exam was force submitted by admin
    useEffect(() => {
        if (!attemptId || !examId) return;

        const checkExamStatus = async () => {
            try {
                const response = await fetch(`/api/exams/${examId}/take?attemptId=${attemptId}&sessionToken=${sessionToken}`);
                const data = await response.json();

                if (data.success && data.attempt) {
                    // If exam was force submitted, close it
                    if (data.attempt.status === 'submitted' && data.attempt.isActive === false) {
                        toast.warning('Your exam has been force submitted by admin!');

                        // Stop recording
                        if (recordingManagerRef.current) {
                            await recordingManagerRef.current.stopRecording();
                        }

                        // Redirect to my-exams
                        setTimeout(() => {
                            router.push('/my-exams');
                        }, 2000);
                    }
                }
            } catch (error) {
                // exam status check error
            }
        };

        // Check every 3 seconds
        const statusInterval = setInterval(checkExamStatus, 3000);

        return () => clearInterval(statusInterval);
    }, [attemptId, examId, sessionToken, recordingStarted]);

    // Exam Security & Tab Switch Sound
    useEffect(() => {
        if (!exam) return;

        const handleVisibilityChange = () => {
            const allowTabSwitch = exam?.settings?.allowTabSwitch ?? false;
            const maxSwitches = exam?.settings?.maxTabSwitches ?? 3;

            // If tab switching is allowed, do nothing
            if (allowTabSwitch) {
                return;
            }

            if (document.hidden) {
                // Tab switch not allowed - play warning sound and increment count
                try {
                    const audio = new Audio('/sound/warnig.mp3');
                    audio.play().catch(e => { });
                } catch (e) { }

                // Increment switch count
                tabSwitchCountRef.current += 1;

                // Check limit
                if (tabSwitchCountRef.current > maxSwitches) {
                    toast.error("Maximum tab switches exceeded! The exam is being auto-submitted.", {
                        theme: "colored",
                        autoClose: 5000
                    });
                    onAutoSubmit();
                }
            } else {
                // User returned to tab - show warning only if switches exceeded but not max yet
                if (tabSwitchCountRef.current > 0 && tabSwitchCountRef.current <= maxSwitches) {
                    setShowTabWarning(true);
                }
            }
        };

        const handleContextMenu = (e) => {
            // Allow context menu if copy/paste is allowed
            const allowCopyPaste = exam?.settings?.allowCopyPaste ?? false;
            if (!allowCopyPaste) {
                e.preventDefault();
            }
        };

        const handleKeyDown = (e) => {
            // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
            if (e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) ||
                (e.ctrlKey && (e.key === 'U' || e.key === 'u'))) {
                e.preventDefault();
                return false;
            }

            // Detect Ctrl+Shift+S (Screenshot shortcut in some browsers/tools)
            if (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) {
                e.preventDefault();
                setShowScreenshotWarning(true);
                return false;
            }

            // Detect Print Screen / PrtSc / SysRq (all variations)
            if (e.key === 'PrintScreen' ||
                e.key === 'Print' ||
                e.key === 'PrtSc' ||
                e.key === 'PrtScr' ||
                e.key === 'SysRq' ||
                e.code === 'PrintScreen' ||
                e.code === 'PrtSc' ||
                e.keyCode === 44 ||
                e.keyCode === 124 ||
                e.which === 44) {
                e.preventDefault();
                setShowScreenshotWarning(true);
                return false;
            }

            // Detect Windows key combinations (Win+Shift+S for Snipping Tool)
            if (e.metaKey || e.key === 'Meta') {
                e.preventDefault();
                setShowScreenshotWarning(true);
                return false;
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [exam]);

    return {
        showTabWarning,
        setShowTabWarning,
        showScreenshotWarning,
        setShowScreenshotWarning,
        tabSwitchCountRef,
    };
}
