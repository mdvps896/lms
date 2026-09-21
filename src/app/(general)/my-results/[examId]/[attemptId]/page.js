'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';

import LoadingSkeleton from './_components/LoadingSkeleton';
import DraftStatusBanner from './_components/DraftStatusBanner';
import ResultHeader from './_components/ResultHeader';
import { StatsCards, QuestionSummaryCard } from './_components/ResultStats';
import QuestionReviewList from './_components/QuestionReviewList';

const AttemptDetailPage = () => {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { examId, attemptId } = params;

    const [attempt, setAttempt] = useState(null);
    const [exam, setExam] = useState(null);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [editedMarks, setEditedMarks] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user) {
            router.push('/authentication/login');
            return;
        }

        // Allow students, teachers, and admins to view results
        if (!['student', 'teacher', 'admin'].includes(user.role)) {
            router.push('/');
            return;
        }

        fetchAttemptDetails();
        fetchSettings();
    }, [user, examId, attemptId]);

    const fetchAttemptDetails = async () => {
        try {
            const response = await fetch(`/api/student/attempt-details/${attemptId}`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                setLoading(false);
                return;
            }

            const data = await response.json();
            if (data.success) {
                setAttempt(data.attempt);
                setExam(data.exam);
            } else {
                console.error('API returned success: false', data);
            }
        } catch (error) {
            console.error('Error fetching attempt details:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/settings');
            const data = await response.json();
            if (data.success) {
                setSettings(data.data);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const getResultDisplayFormat = () => {
        return settings?.resultDisplay?.resultDisplayFormat || 'Detailed';
    };

    const shouldShowCorrectAnswers = () => {
        return settings?.resultDisplay?.showCorrectAnswers !== false;
    };

    const shouldShowQuestionwiseScores = () => {
        return settings?.resultDisplay?.showQuestionwiseScores !== false;
    };

    const shouldShowTimeTaken = () => {
        return settings?.resultDisplay?.showTimeTaken !== false;
    };

    const handleEditToggle = () => {
        if (editMode) {
            // Cancel editing - reset editedMarks
            setEditedMarks({});
        }
        setEditMode(!editMode);
    };

    const handleMarksChange = (answerId, value, maxMarks) => {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0) {
            return; // Invalid input
        }
        if (numValue > maxMarks) {
            toast.error(`Marks cannot exceed ${maxMarks}`);
            return;
        }
        setEditedMarks(prev => ({
            ...prev,
            [answerId]: numValue
        }));
    };

    const handleUpdateMarks = async () => {
        if (Object.keys(editedMarks).length === 0) {
            toast.error('No changes to save');
            return;
        }

        setSaving(true);
        try {
            const response = await fetch(`/api/admin/update-marks/${params.attemptId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ updatedMarks: editedMarks })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update marks');
            }

            toast.success('Marks updated successfully');
            setEditMode(false);
            setEditedMarks({});
            // Refresh attempt data
            await fetchAttemptDetails();
        } catch (error) {
            console.error('Error updating marks:', error);
            toast.error(error.message || 'Failed to update marks');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <LoadingSkeleton />;
    }

    if (!attempt || !exam) {
        return (
            <div className="container-fluid">
                <div className="alert alert-warning">
                    Attempt details not found.
                </div>
            </div>
        );
    }

    const correctAnswers = attempt.answers?.filter(a => a.isCorrect).length || 0;
    const incorrectAnswers = attempt.answers?.filter(a => !a.isCorrect).length || 0;
    const totalQuestions = attempt.answers?.length || 0;

    // Check if result is in draft status (for students only)
    const isResultDraft = attempt.resultStatus === 'draft' && user?.role === 'student';

    return (
        <div className="container-fluid">
            {/* Draft Status Banner for Students */}
            {isResultDraft && <DraftStatusBanner />}

            {/* Header */}
            <ResultHeader
                exam={exam}
                examId={examId}
                user={user}
                attempt={attempt}
                settings={settings}
                editMode={editMode}
                saving={saving}
                isResultDraft={isResultDraft}
                handleEditToggle={handleEditToggle}
                handleUpdateMarks={handleUpdateMarks}
            />

            {/* Stats Cards - Only show for published results or teachers/admins */}
            {!isResultDraft && (
                <>
                    <StatsCards
                        attempt={attempt}
                        shouldShowTimeTaken={shouldShowTimeTaken}
                        totalQuestions={totalQuestions}
                    />

                    {/* Question Summary */}
                    <QuestionSummaryCard
                        correctAnswers={correctAnswers}
                        incorrectAnswers={incorrectAnswers}
                        totalQuestions={totalQuestions}
                    />

                    {/* Questions */}
                    <div className="row">
                        <div className="col-12">
                            <QuestionReviewList
                                attempt={attempt}
                                format={getResultDisplayFormat()}
                                showCorrectAnswers={shouldShowCorrectAnswers()}
                                showScores={shouldShowQuestionwiseScores()}
                                editMode={editMode}
                                editedMarks={editedMarks}
                                handleMarksChange={handleMarksChange}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AttemptDetailPage;
