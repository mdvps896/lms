'use client';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

// Core exam-attempt state & lifecycle: fetching exam data, answering/navigating
// questions, saving answers, timer countdown, and submitting the exam.
// Extracted verbatim (no logic changes) from the take exam page.
export default function useExamAttempt({
    params,
    attemptId,
    sessionToken,
    router,
    recordingManagerRef,
    setShowPermissionModal,
    setRecordingStarted,
}) {
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
    const [savingRecordings, setSavingRecordings] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state
    const [isNavigating, setIsNavigating] = useState(false); // Navigation state
    const [saving, setSaving] = useState(false);
    const hasFetchedRef = useRef(false);

    // Reset group when section changes
    useEffect(() => {
        setActiveGroup(null);
    }, [activeSection]);

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
            toast.error('Error loading exam');
            router.push('/my-exams');
        } finally {
            setLoading(false);
        }
    };

    const saveAnswer = async (questionId, answer) => {
        if (!params.examId) {
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
                // Only show toast for critical errors, not for every save
                if (response.status === 403 || response.status === 400) {
                    toast.error(data.message || 'Failed to save answer');
                }
                return false;
            }
            return true;
        } catch (error) {
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

    const handleNextQuestion = async () => {
        if (currentQuestionIndex < questions.length - 1) {
            setIsNavigating(true);
            await new Promise(r => setTimeout(r, 300)); // Small delay for visual feedback
            setCurrentQuestionIndex(prev => prev + 1);
            setIsNavigating(false);
        }
    };

    const handlePreviousQuestion = async () => {
        if (currentQuestionIndex > 0) {
            setIsNavigating(true);
            await new Promise(r => setTimeout(r, 300));
            setCurrentQuestionIndex(prev => prev - 1);
            setIsNavigating(false);
        }
    };

    const handleQuestionSelect = async (index) => {
        if (index === currentQuestionIndex) return;
        setIsNavigating(true);
        setIsSidebarOpen(false); // Close sidebar on mobile
        await new Promise(r => setTimeout(r, 300));
        setCurrentQuestionIndex(index);
        setIsNavigating(false);
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
            setSubmitting(false);
            if (!isAutoSubmit) {
                toast.error('Error submitting exam');
            }
        }
    };

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

    return {
        loading,
        exam,
        questions,
        currentQuestionIndex,
        answers,
        markedForReview,
        timeRemaining,
        attemptInfo,
        activeSection,
        setActiveSection,
        activeGroup,
        setActiveGroup,
        showSubmitModal,
        setShowSubmitModal,
        savingRecordings,
        submitting,
        showInstructions,
        setShowInstructions,
        isSidebarOpen,
        setIsSidebarOpen,
        isNavigating,
        saving,
        handleSubmitClick,
        confirmSubmit,
        getSubmitSummary,
        handleAnswerChange,
        handleMarkForReview,
        handleNextQuestion,
        handlePreviousQuestion,
        handleQuestionSelect,
        handleAutoSubmit,
        handleSubmitExam,
        activeSectionGroups,
        filteredQuestions,
        currentQuestion,
    };
}
