'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import ExamHeader from '@/components/exams/take/ExamHeader';
import ExamSidebar from '@/components/exams/take/ExamSidebar';
import QuestionDisplay from '@/components/exams/take/QuestionDisplay';
import ExamControls from '@/components/exams/take/ExamControls';
import LoadingSkeleton from '@/components/exams/take/LoadingSkeleton';
import { useAuth } from '@/contexts/AuthContext';
import SubmitConfirmationModal from '@/components/exams/take/SubmitConfirmationModal';
import TabSwitchWarningModal from '@/components/exams/take/TabSwitchWarningModal';
import ScreenshotWarningModal from '@/components/exams/take/ScreenshotWarningModal';
import PermissionModal from '@/components/exams/take/PermissionModal';
import RecordingManager from '@/utils/recordingManager';
import ServerSideLiveStream from '@/utils/serverSideLiveStream';
import ExamChatBox from '@/components/exams/ExamChatBox';
// import LocalStreamView from '@/components/exams/take/LocalStreamView';  // Disabled for student exam

export default function TakeExamPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();

    const attemptId = searchParams.get('attemptId');
    const sessionToken = searchParams.get('sessionToken');

    const [loading, setLoading] = useState(true);
    const [exam, setExam] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [markedForReview, setMarkedForReview] = useState({});
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [attemptInfo, setAttemptInfo] = useState(null);
    const [activeSection, setActiveSection] = useState(null);
    const [activeGroup, setActiveGroup] = useState(null);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showTabWarning, setShowTabWarning] = useState(false);
    const [showScreenshotWarning, setShowScreenshotWarning] = useState(false);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [recordingStarted, setRecordingStarted] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [savingRecordings, setSavingRecordings] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    // const [cameraStream, setCameraStream] = useState(null);  // Disabled for student exam
    // const [screenStream, setScreenStream] = useState(null);   // Disabled for student exam
    const tabSwitchCountRef = useRef(null);
    const recordingManagerRef = useRef(null);
    const liveStreamManagerRef = useRef(null);

    // Handle permission allow
    const handlePermissionAllow = async () => {
        setShowPermissionModal(false);

        // Initialize recording manager
        recordingManagerRef.current = new RecordingManager();

        const result = await recordingManagerRef.current.startRecording(attemptId, params.examId);

        if (result.success) {
            setRecordingStarted(true);
            toast.success('Recording started successfully!');

            // Note: Stream preview disabled for students during exam
            // Students should not see their own recording preview to avoid distraction
            try {
                const streams = recordingManagerRef.current.getLiveStreams();
                console.log('Recording streams active (preview hidden for student)');
                // setCameraStream(streams.camera);  // Hidden for student
                // setScreenStream(streams.screen);   // Hidden for student
            } catch (streamError) {
                console.warn('Failed to get streams info:', streamError);
            }

            // Setup screen share stop handler
            window.onScreenShareStopped = () => {
                toast.error('Screen sharing stopped! Please share your screen again.');
                // Note: Screen stream preview already disabled for students
            };

            // Start server-side live streaming
            try {
                liveStreamManagerRef.current = new ServerSideLiveStream();
                const streams = recordingManagerRef.current.getLiveStreams();

                await liveStreamManagerRef.current.startStreaming(
                    attemptId,
                    streams.camera,
                    streams.screen
                );

                console.log('✅ Live streaming started');
            } catch (error) {
                console.error('❌ Failed to start live streaming:', error);
                toast.warn('Live streaming failed, but recording continues');
                // Don't fail exam if streaming fails
            }
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

    // Fetch chat messages
    const fetchChatMessages = async () => {
        try {
            const response = await fetch(
                `/api/exams/chat?attemptId=${attemptId}&examId=${params.examId}`
            );
            const data = await response.json();

            if (response.ok) {
                const newMessages = data.messages || [];

                // Check if there are new messages from admin
                if (newMessages.length > previousChatCountRef.current) {
                    const latestMessage = newMessages[newMessages.length - 1];

                    // Play sound only if latest message is from admin
                    if (latestMessage && latestMessage.sender === 'admin') {
                        notificationSound.playChatNotification();
                    }
                }

                previousChatCountRef.current = newMessages.length;
                setChatMessages(newMessages);
                setChatBlocked(data.chatBlocked || false);

                // Count unread messages from admin
                const unread = newMessages.filter(
                    msg => msg.sender === 'admin' && !msg.read
                ).length;
                setUnreadCount(unread);
            }
        } catch (error) {
            console.error('Error fetching chat:', error);
        }
    };

    // Send chat message
    const handleSendMessage = async () => {
        if (!newMessage.trim() || chatBlocked) return;

        try {
            const response = await fetch('/api/exams/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    attemptId,
                    examId: params.examId,
                    sender: 'student',
                    message: newMessage
                })
            });

            if (response.ok) {
                setNewMessage('');
                fetchChatMessages();
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        }
    };

    // Open chat modal and mark messages as read
    const handleOpenChat = () => {
        setShowChatModal(true);
        setUnreadCount(0);
        fetchChatMessages();
    };

    // Check if exam was force submitted by admin
    useEffect(() => {
        if (!attemptId || !params.examId) return;

        const checkExamStatus = async () => {
            try {
                const response = await fetch(`/api/exams/${params.examId}/take?attemptId=${attemptId}&sessionToken=${sessionToken}`);
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
                console.error('Error checking exam status:', error);
            }
        };

        // Check every 3 seconds
        const statusInterval = setInterval(checkExamStatus, 3000);

        return () => clearInterval(statusInterval);
    }, [attemptId, params.examId, sessionToken, recordingStarted]);

    // Reset group when section changes
    useEffect(() => {
        setActiveGroup(null);
    }, [activeSection]);

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
                    audio.play().catch(e => console.error("Audio play blocked", e));
                } catch (e) { console.error(e); }

                // Increment switch count
                tabSwitchCountRef.current += 1;

                // Check limit
                if (tabSwitchCountRef.current > maxSwitches) {
                    toast.error("Maximum tab switches exceeded! The exam is being auto-submitted.", {
                        theme: "colored",
                        autoClose: 5000
                    });
                    handleSubmitExam(true);
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

    // Cleanup streams on component unmount - streams handled by recording manager
    useEffect(() => {
        return () => {
            // Note: Stream cleanup now handled by recording manager
            // Recording manager will handle proper cleanup of streams
            
            // Stop live streaming
            if (liveStreamManagerRef.current) {
                liveStreamManagerRef.current.stopStreaming();
            }
        };
    }, []);

    const handleSubmitClick = () => {
        setShowSubmitModal(true);
    };

    const confirmSubmit = () => {
        setShowSubmitModal(false);
        handleSubmitExam(false);
    };

    const getSubmitSummary = () => {
        const answeredCount = Object.values(answers).filter(val => val !== null && val !== undefined && val !== '').length;
        const markedCount = Object.values(markedForReview).filter(val => val === true).length;
        return {
            answered: answeredCount,
            unanswered: questions.length - answeredCount,
            marked: markedCount
        };
    };

    const [saving, setSaving] = useState(false);
    const hasFetchedRef = useRef(false);



    useEffect(() => {
        // Wait for search params to be ready
        if (!attemptId || !sessionToken) {
            return;
        }

        if (!hasFetchedRef.current) {
            hasFetchedRef.current = true;
            fetchExamData();
        }
    }, [attemptId, sessionToken]);

    // Timer countdown
    useEffect(() => {
        if (timeRemaining <= 0) return;

        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    handleAutoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining]);

    // Auto-submit on window close/refresh/tab close
    useEffect(() => {
        if (!attemptId || !sessionToken) return;

        const handleBeforeUnload = (e) => {
            // Just show warning - don't submit yet
            e.preventDefault();
            e.returnValue = 'Your exam progress will be lost. Are you sure you want to leave?';
            return e.returnValue;
        };

        const handlePageHide = () => {
            // Page is actually being unloaded - submit exam using sendBeacon
            const submitData = {
                attemptId,
                sessionToken,
                examId: params.examId,
                answers
            };
            
            const blob = new Blob([JSON.stringify(submitData)], { type: 'application/json' });
            navigator.sendBeacon('/api/exams/submit', blob);
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handlePageHide);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handlePageHide);
        };
    }, [answers, attemptId, sessionToken, params.examId]);

    const fetchExamData = async () => {
        try {
            const response = await fetch(
                `/api/exams/${params.examId}/take?attemptId=${attemptId}&sessionToken=${sessionToken}`
            );

            const data = await response.json();

            if (response.ok) {
                setExam(data.exam);
                setQuestions(data.questions);
                setAnswers(data.answers || {});
                setTimeRemaining(data.timeRemaining);
                setAttemptInfo(data.attemptInfo);

                // Set first section as active
                if (data.exam?.subjects?.length > 0) {
                    // Sort subjects by question count (descending)
                    const subjectsWithCount = data.exam.subjects.map(subject => ({
                        ...subject,
                        questionCount: data.questions.filter(q => q.subject?._id === subject._id).length
                    })).sort((a, b) => b.questionCount - a.questionCount);

                    data.exam.subjects = subjectsWithCount;
                    setActiveSection(subjectsWithCount[0]._id);
                }

                // Show permission modal if any proctoring features are enabled
                const requiresPermissions = data.exam?.settings?.allowCam || 
                                          data.exam?.settings?.allowScreen || 
                                          data.exam?.settings?.allowMic ||
                                          data.exam?.settings?.proctoring?.enabled;

                if (requiresPermissions) {
                    setShowPermissionModal(true);
                } else {
                    // If proctoring is disabled, mark recording as "started" to show exam
                    setRecordingStarted(true);
                }
            } else {
                toast.error(data.message || 'Failed to load exam');
                router.push('/my-exams');
            }
        } catch (error) {
            console.error('Error loading exam:', error);
            toast.error('Error loading exam');
            router.push('/my-exams');
        } finally {
            setLoading(false);
        }
    };

    const saveAnswer = async (questionId, answer) => {
        if (!params.examId) {
            console.error('examId is missing!');
            return false;
        }

        setSaving(true);
        try {
            const response = await fetch('/api/exams/save-answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    attemptId,
                    sessionToken,
                    examId: params.examId,
                    questionId,
                    answer
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Save answer error:', data);
                // Only show toast for critical errors, not for every save
                if (response.status === 403 || response.status === 400) {
                    toast.error(data.message || 'Failed to save answer');
                }
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error saving answer:', error);
            // Silent fail for network errors - don't spam user
            return false;
        } finally {
            setSaving(false);
        }
    };

    const handleAnswerChange = (questionId, answer) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));

        // Auto-save answer
        saveAnswer(questionId, answer);
    };

    const handleMarkForReview = (questionId) => {
        setMarkedForReview(prev => ({
            ...prev,
            [questionId]: !prev[questionId]
        }));
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleQuestionSelect = (index) => {
        setCurrentQuestionIndex(index);
    };

    const handleAutoSubmit = async () => {
        toast.warning('Submitting exam...');
        await handleSubmitExam(true);
    };

    const handleSubmitExam = async (isAutoSubmit = false, silent = false) => {
        try {
            // Set submitting state
            if (!silent) {
                setSubmitting(true);
            }

            // Stop recording before submitting
            if (recordingManagerRef.current && recordingManagerRef.current.isActive()) {
                if (!silent) {
                    setSavingRecordings(true);
                    toast.info('Saving recordings...');
                }
                await recordingManagerRef.current.stopRecording();
                if (!silent) {
                    setSavingRecordings(false);
                }
            }

            const submitData = {
                attemptId,
                sessionToken,
                examId: params.examId,
                answers
            };

            // Use sendBeacon for reliable submission on page unload
            if (silent) {
                const blob = new Blob([JSON.stringify(submitData)], { type: 'application/json' });
                navigator.sendBeacon('/api/exams/submit', blob);
                return; // Don't wait for response
            }

            const response = await fetch('/api/exams/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitData),
                keepalive: true // Keep request alive even if page closes
            });

            const data = await response.json();

            if (response.ok) {
                if (isAutoSubmit) {
                    toast.success('Exam auto-submitted due to security violation!', {
                        theme: 'colored',
                        autoClose: 2000
                    });
                } else {
                    toast.success('Exam submitted successfully!');
                }

                // Clear the beforeunload handler before navigation
                window.onbeforeunload = null;

                // Redirect to dashboard
                setTimeout(() => {
                    router.push('/');
                }, isAutoSubmit ? 2000 : 500);
            } else {
                setSubmitting(false);
                toast.error(data.message || 'Failed to submit exam');
            }
        } catch (error) {
            console.error('Error submitting exam:', error);
            setSubmitting(false);
            if (!isAutoSubmit) {
                toast.error('Error submitting exam');
            }
        }
    };

    // Get groups for active section
    const activeSectionGroups = activeSection
        ? [...new Set(questions
            .filter(q => q.subject?._id === activeSection && (q.groupInfo || q.questionGroup))
            .map(q => {
                const g = q.groupInfo || q.questionGroup;
                return JSON.stringify({
                    _id: g._id || g,
                    name: g.name || g.title || 'Group'
                });
            }))].map(s => JSON.parse(s))
        : [];

    // Derived state for display
    const filteredQuestions = questions.filter(q => {
        if (activeSection && q.subject?._id !== activeSection) return false;

        if (activeGroup) {
            const g = q.groupInfo || q.questionGroup;
            const gId = g?._id || g;
            if (gId !== activeGroup) return false;
        }
        return true;
    });

    const currentQuestion = questions[currentQuestionIndex];

    // Check if current question is visible in current filter
    const isCurrentQuestionVisible = filteredQuestions.some(q => q._id === currentQuestion?._id);

    // If current question is not visible in filter, switch to first question of filter
    useEffect(() => {
        if (!isCurrentQuestionVisible && filteredQuestions.length > 0) {
            const firstVisibleIndex = questions.findIndex(q => q._id === filteredQuestions[0]._id);
            if (firstVisibleIndex !== -1) {
                setCurrentQuestionIndex(firstVisibleIndex);
            }
        }
    }, [activeSection, activeGroup, isCurrentQuestionVisible]);

    if (loading || permissionDenied) {
        return <LoadingSkeleton />;
    }

    // Don't show exam until recording is started
    if (!recordingStarted) {
        return (
            <>
                <LoadingSkeleton />
                <PermissionModal
                    show={showPermissionModal}
                    onAllow={handlePermissionAllow}
                    onCancel={handlePermissionCancel}
                />
            </>
        );
    }

    // Show submitting screen
    if (submitting) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 9999
            }}>
                <div className="spinner-border text-light" role="status" style={{ width: '4rem', height: '4rem' }}>
                    <span className="visually-hidden">Loading...</span>
                </div>
                <h3 className="text-white mt-4">Submitting Exam...</h3>
                <p className="text-white-50 mt-2">Please wait while we save your answers</p>
            </div>
        );
    }

    return (
        <div className="exam-container" style={{
            height: '100vh',
            overflow: 'hidden',
            background: '#f5f5f5'
        }}>
            <ExamHeader
                examName={exam?.name}
                timeRemaining={timeRemaining}
                onSubmit={handleSubmitClick}
                user={user}
                instructions={exam?.instructions}
            />

            <SubmitConfirmationModal
                show={showSubmitModal}
                onClose={() => setShowSubmitModal(false)}
                onConfirm={confirmSubmit}
                summary={getSubmitSummary()}
            />

            <TabSwitchWarningModal
                show={showTabWarning}
                onClose={() => setShowTabWarning(false)}
                remainingAttempts={(exam?.settings?.maxTabSwitches ?? 3) - tabSwitchCountRef.current}
                totalAttempts={exam?.settings?.maxTabSwitches ?? 3}
            />

            <ScreenshotWarningModal
                show={showScreenshotWarning}
                onClose={() => setShowScreenshotWarning(false)}
            />

            <div className="exam-body" style={{
                display: 'flex',
                height: 'calc(100vh - 60px)',
                overflow: 'hidden'
            }}>
                <div className="exam-main" style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: '20px'
                }}>
                    {/* Subject Tabs */}
                    {exam?.subjects?.length > 0 && (
                        <div className="mb-3">
                            <div className="subject-tabs mb-2">
                                <div className="btn-group" role="group">
                                    {exam.subjects.map(subject => (
                                        <button
                                            key={subject._id}
                                            type="button"
                                            className={`btn ${activeSection === subject._id ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => setActiveSection(subject._id)}
                                        >
                                            {subject.name}
                                            <span className="badge bg-white text-primary ms-2 rounded-pill">
                                                {subject.questionCount}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <QuestionDisplay
                        question={currentQuestion}
                        questionNumber={filteredQuestions.findIndex(q => q._id === currentQuestion?._id) + 1}
                        totalQuestions={filteredQuestions.length}
                        answer={answers[currentQuestion?._id]}
                        onAnswerChange={(answer) => handleAnswerChange(currentQuestion._id, answer)}
                        isMarkedForReview={markedForReview[currentQuestion?._id]}
                        saving={saving}
                        watermarkSettings={exam?.settings?.watermark}
                        userName={user?.name}
                    />

                    <ExamControls
                        currentIndex={currentQuestionIndex}
                        totalQuestions={questions.length}
                        onPrevious={handlePreviousQuestion}
                        onNext={handleNextQuestion}
                        onMarkReview={() => handleMarkForReview(currentQuestion?._id)}
                        isMarkedForReview={markedForReview[currentQuestion?._id]}
                        onClearResponse={() => handleAnswerChange(currentQuestion?._id, null)}
                    />
                </div>

                <ExamSidebar
                    questions={questions}
                    answers={answers}
                    markedForReview={markedForReview}
                    currentQuestionIndex={currentQuestionIndex}
                    onQuestionSelect={handleQuestionSelect}
                    subjects={exam?.subjects}
                    activeSection={activeSection}
                    onSectionChange={setActiveSection}
                    activeGroup={activeGroup}
                    onGroupChange={setActiveGroup}
                />
            </div>

            {/* Chat Component */}
            <ExamChatBox
                attemptId={attemptId}
                examId={params.examId}
                recordingStarted={recordingStarted}
            />

            {/* Local Stream View - Disabled for students to avoid distraction during exam */}
            {/* Note: Recording is still active in background, preview is just hidden */}
            {/* Stream preview completely disabled for students during exam */}

            {/* Saving Recordings Overlay */}
            {savingRecordings && (
                <div 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 9999
                    }}
                >
                    <div className="spinner-border text-light" role="status" style={{ width: '4rem', height: '4rem' }}>
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <h3 className="text-white mt-4">Saving Recordings...</h3>
                    <p className="text-white-50 mt-2">Please wait while we save your exam recordings</p>
                </div>
            )}
        </div>
    );
}
