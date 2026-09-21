'use client';
import React, { useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
import ExamInstructionsModal from '@/components/exams/take/ExamInstructionsModal';
import ExamChatBox from '@/components/exams/ExamChatBox';
import useExamAttempt from './_components/useExamAttempt';
import useRecordingSession from './_components/useRecordingSession';
import useExamSecurity from './_components/useExamSecurity';
import ExamStyles from './_components/ExamStyles';
import SubjectTabs from './_components/SubjectTabs';
import FullScreenOverlay from './_components/FullScreenOverlay';
// import LocalStreamView from '@/components/exams/take/LocalStreamView';  // Disabled for student exam

export default function TakeExamPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();

    const attemptId = searchParams.get('attemptId');
    const sessionToken = searchParams.get('sessionToken');

    // Shared across hooks: refs/state written from more than one hook must
    // live here so every hook shares the same instance.
    const recordingManagerRef = useRef(null);
    const liveStreamManagerRef = useRef(null);
    const attendanceTrackerRef = useRef(null);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [recordingStarted, setRecordingStarted] = useState(false);

    const attempt = useExamAttempt({
        params,
        attemptId,
        sessionToken,
        router,
        recordingManagerRef,
        setShowPermissionModal,
        setRecordingStarted,
    });

    const recording = useRecordingSession({
        exam: attempt.exam,
        attemptId,
        examId: params.examId,
        user,
        router,
        recordingManagerRef,
        liveStreamManagerRef,
        attendanceTrackerRef,
        setShowPermissionModal,
        setRecordingStarted,
    });

    const security = useExamSecurity({
        exam: attempt.exam,
        attemptId,
        examId: params.examId,
        sessionToken,
        recordingStarted,
        recordingManagerRef,
        router,
        onAutoSubmit: () => attempt.handleSubmitExam(true),
    });

    const {
        loading,
        exam,
        questions,
        currentQuestionIndex,
        answers,
        markedForReview,
        timeRemaining,
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
        filteredQuestions,
        currentQuestion,
    } = attempt;

    const { permissionDenied, handlePermissionAllow, handlePermissionCancel } = recording;

    const {
        showTabWarning,
        setShowTabWarning,
        showScreenshotWarning,
        setShowScreenshotWarning,
        tabSwitchCountRef,
    } = security;

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
            <FullScreenOverlay
                title="Submitting Exam..."
                message="Please wait while we save your answers"
            />
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
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                onShowInstructions={() => setShowInstructions(true)}
            />

            <ExamInstructionsModal
                show={showInstructions}
                onClose={() => setShowInstructions(false)}
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

            <div className="exam-body-container" style={{ position: 'relative' }}>
                <ExamStyles />

                <div className="exam-body">
                    <div className="exam-main">
                        <SubjectTabs
                            subjects={exam?.subjects}
                            activeSection={activeSection}
                            onSectionChange={setActiveSection}
                        />

                        {isNavigating ? (
                            <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                                <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : (
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
                        )}

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

                    <div className={`sidebar-container ${isSidebarOpen ? 'open' : ''}`}>
                        {/* Mobile Close Button Header */}
                        <div className="sidebar-header-mobile d-md-none">
                            <h6 className="m-0 fw-bold">Question Palette</h6>
                            <button
                                className="btn btn-sm btn-close"
                                onClick={() => setIsSidebarOpen(false)}
                                aria-label="Close"
                            ></button>
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
                            user={user}
                            onShowInstructions={() => setShowInstructions(true)}
                        />
                    </div>
                </div>

                {/* Mobile Overlay */}
                {isSidebarOpen && (
                    <div className="sidebar-overlay d-md-none" onClick={() => setIsSidebarOpen(false)}></div>
                )}
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
                <FullScreenOverlay
                    title="Saving Recordings..."
                    message="Please wait while we save your exam recordings"
                />
            )}
        </div>
    );
}
