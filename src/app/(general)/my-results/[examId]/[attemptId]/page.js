'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiClock, FiDownload, FiCheckCircle, FiXCircle, FiHelpCircle, FiEdit2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import CertificateGenerator from '@/components/certificates/CertificateGenerator';

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

    const formatDuration = (seconds) => {
        if (!seconds || seconds === 0) return 'N/A';
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes} min ${secs} sec`;
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

    // Helper function to render question text with HTML support
    const renderQuestionText = (text) => {
        if (!text) return null;
        
        const htmlPattern = /<[^>]+>/;
        if (htmlPattern.test(text)) {
            return (
                <div 
                    dangerouslySetInnerHTML={{ __html: text }}
                    style={{ lineHeight: '1.8' }}
                />
            );
        }
        
        return <span>{text}</span>;
    };

    // Helper function to check if answer contains HTML and render it
    const renderAnswer = (answer) => {
        if (!answer) return 'Not answered';
        
        // Check if answer contains HTML tags
        const htmlPattern = /<[^>]+>/;
        if (htmlPattern.test(answer)) {
            // Render as HTML
            return (
                <div 
                    dangerouslySetInnerHTML={{ __html: answer }}
                    style={{
                        padding: '10px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '6px',
                        border: '1px solid #dee2e6',
                        lineHeight: '1.8'
                    }}
                />
            );
        }
        
        // Render as plain text
        return <strong>{answer}</strong>;
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

    const renderQuestionReview = () => {
        const format = getResultDisplayFormat();
        const showCorrectAnswers = shouldShowCorrectAnswers();
        const showScores = shouldShowQuestionwiseScores();

        if (!attempt?.answers || attempt.answers.length === 0) {
            return (
                <div className="alert alert-info">
                    <h5>No questions answered</h5>
                    <p className="mb-0">
                        This exam attempt has no recorded answers. This could mean:
                    </p>
                    <ul className="mb-0 mt-2">
                        <li>The exam was submitted without answering any questions</li>
                        <li>There was an issue saving the answers</li>
                        <li>The exam had no questions</li>
                    </ul>
                    <div className="mt-3">
                        <strong>Debug Info:</strong>
                        <pre className="mt-2 p-2 bg-light rounded">
                            {JSON.stringify({
                                hasAttempt: !!attempt,
                                hasAnswers: !!attempt?.answers,
                                answersType: typeof attempt?.answers,
                                answersLength: attempt?.answers?.length,
                                answersIsArray: Array.isArray(attempt?.answers)
                            }, null, 2)}
                        </pre>
                    </div>
                </div>
            );
        }

        return attempt.answers.map((answer, index) => {
            const question = answer.question;
            if (!question) return null;

            const isCorrect = answer.isCorrect;
            const userAnswer = answer.selectedOption;
            const correctAnswer = question.correctAnswer;

            // Default Format - Don't show any questions, return null
            if (format === 'Default') {
                return null;
            }

            // Minimal Format - Only show if incorrect
            if (format === 'Minimal') {
                return (
                    <div key={answer._id || index} className="card mb-3 border">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start">
                                <h6 className="mb-0">Question {index + 1}</h6>
                                {showScores && (
                                    editMode ? (
                                        <div className="d-flex align-items-center gap-2 bg-light p-2 rounded border">
                                            <label className="mb-0 text-muted small">Marks:</label>
                                            <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                style={{ width: '80px' }}
                                                value={editedMarks[answer._id] !== undefined ? editedMarks[answer._id] : answer.marksObtained || 0}
                                                onChange={(e) => handleMarksChange(answer._id, e.target.value, question.marks || 1)}
                                                min="0"
                                                max={question.marks || 1}
                                                step="0.5"
                                                placeholder="0"
                                            />
                                            <span className="text-muted">/ {question.marks || 1}</span>
                                        </div>
                                    ) : (
                                        <span className={`badge ${isCorrect ? 'bg-success' : 'bg-danger'}`}>
                                            {answer.marksObtained || 0}/{question.marks || 1} points
                                        </span>
                                    )
                                )}
                            </div>
                            {!isCorrect && (
                                <div className="alert alert-danger mt-3 mb-0 d-flex align-items-center">
                                    <FiXCircle className="me-2" />
                                    <span>Incorrect - {answer.marksObtained || 0}/{question.marks || 1}</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            }

            // Summary Format - Show question text and result
            if (format === 'Summary') {
                return (
                    <div key={answer._id || index} className="card mb-3 border">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <h6 className="mb-0">Question {index + 1}</h6>
                                {showScores && (
                                    editMode ? (
                                        <div className="d-flex align-items-center gap-2 bg-light p-2 rounded border">
                                            <label className="mb-0 text-muted small">Marks:</label>
                                            <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                style={{ width: '80px' }}
                                                value={editedMarks[answer._id] !== undefined ? editedMarks[answer._id] : answer.marksObtained || 0}
                                                onChange={(e) => handleMarksChange(answer._id, e.target.value, question.marks || 1)}
                                                min="0"
                                                max={question.marks || 1}
                                                step="0.5"
                                                placeholder="0"
                                            />
                                            <span className="text-muted">/ {question.marks || 1}</span>
                                        </div>
                                    ) : (
                                        <span className={`badge ${isCorrect ? 'bg-success' : 'bg-danger'}`}>
                                            {answer.marksObtained || 0}/{question.marks || 1} points
                                        </span>
                                    )
                                )}
                            </div>

                            <div className="mb-3">
                                <div className="fw-medium mb-2">
                                    Q{index + 1}. {question.questionText}
                                </div>
                                <div className="text-muted small">
                                    Score: {answer.marksObtained || 0}/{question.marks || 1}
                                </div>
                            </div>

                            <div className={`alert ${isCorrect ? 'alert-success' : 'alert-danger'} mb-0 d-flex align-items-center`}>
                                {isCorrect ? <FiCheckCircle className="me-2" /> : <FiXCircle className="me-2" />}
                                <span>{isCorrect ? 'Correct' : 'Incorrect'} - {answer.marksObtained || 0}/{question.marks || 1} points</span>
                            </div>
                        </div>
                    </div>
                );
            }

            // Detailed Format - Show everything
            return (
                <div key={answer._id || index} className="card mb-3 border">
                    <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <h6 className="mb-0">Question {index + 1}</h6>
                            {showScores && (
                                editMode ? (
                                    <div className="d-flex align-items-center gap-2 bg-light p-2 rounded border">
                                        <label className="mb-0 text-muted small fw-semibold">Marks:</label>
                                        <input
                                            type="number"
                                            className="form-control form-control-sm"
                                            style={{ width: '80px' }}
                                            value={editedMarks[answer._id] !== undefined ? editedMarks[answer._id] : answer.marksObtained || 0}
                                            onChange={(e) => handleMarksChange(answer._id, e.target.value, question.marks || 1)}
                                            min="0"
                                            max={question.marks || 1}
                                            step="0.5"
                                            placeholder="0"
                                        />
                                        <span className="text-muted">/ {question.marks || 1}</span>
                                    </div>
                                ) : (
                                    <span className={`badge ${isCorrect ? 'bg-success' : 'bg-danger'}`}>
                                        {answer.marksObtained || 0}/{question.marks || 1} points
                                    </span>
                                )
                            )}
                        </div>

                        <div className="mb-3">
                            <div className="fw-medium mb-3">
                                Q{index + 1}. {renderQuestionText(question.questionText)}
                            </div>
                            <div className="text-muted small mb-2">
                                Score: {answer.marksObtained || 0}/{question.marks || 1}
                            </div>
                        </div>

                        {/* Options */}
                        {question.options && question.options.length > 0 && (
                            <div className="mb-3">
                                {question.options.map((option, optIndex) => {
                                    // Handle both single and multiple choice answers
                                    const isUserAnswer = Array.isArray(userAnswer) 
                                        ? userAnswer.includes(option) 
                                        : userAnswer === option;
                                    const isCorrectOption = showCorrectAnswers && (
                                        Array.isArray(correctAnswer) 
                                            ? correctAnswer.includes(option)
                                            : correctAnswer === option
                                    );

                                    let bgClass = '';
                                    let icon = null;

                                    if (isCorrectOption) {
                                        bgClass = 'bg-success bg-opacity-10 border-success';
                                        icon = <FiCheckCircle className="text-success me-2" />;
                                    } else if (isUserAnswer && !isCorrect) {
                                        bgClass = 'bg-danger bg-opacity-10 border-danger';
                                        icon = <FiXCircle className="text-danger me-2" />;
                                    }

                                    return (
                                        <div
                                            key={optIndex}
                                            className={`p-3 mb-2 border rounded d-flex align-items-center ${bgClass}`}
                                        >
                                            <input
                                                type="radio"
                                                className="form-check-input me-2"
                                                checked={isUserAnswer}
                                                disabled
                                                readOnly
                                            />
                                            <span className="flex-grow-1">{option}</span>
                                            {icon}
                                            {isCorrectOption && showCorrectAnswers && (
                                                <span className="badge bg-success ms-2">Correct</span>
                                            )}
                                            {isUserAnswer && !isCorrectOption && (
                                                <span className="badge bg-primary ms-2">Selected</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Result */}
                        {showCorrectAnswers && (
                            <div className={`alert ${isCorrect ? 'alert-success' : 'alert-danger'} mb-0`}>
                                <div className="d-flex align-items-start">
                                    {isCorrect ? <FiCheckCircle className="me-2 mt-1" /> : <FiXCircle className="me-2 mt-1" />}
                                    <div className="flex-grow-1">
                                        <strong>
                                            {isCorrect ? 'Correct answer' : 'Incorrect answer'}:
                                        </strong>
                                        <div className="mt-2">
                                            <div className="mb-2">Your answer:</div>
                                            {renderAnswer(userAnswer)}
                                        </div>
                                        {!isCorrect && correctAnswer && (
                                            <div className="mt-2">
                                                Correct answer: <strong>{correctAnswer}</strong>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        });
    };

    if (loading) {
        return (
            <div className="container-fluid">
                {/* Header Skeleton */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="bg-primary text-white p-4 rounded">
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center flex-grow-1">
                                    <div className="bg-white bg-opacity-25 rounded" style={{ width: '80px', height: '36px' }}></div>
                                    <div className="ms-3">
                                        <div className="bg-white bg-opacity-50 rounded mb-2" style={{ width: '200px', height: '24px' }}></div>
                                        <div className="bg-white bg-opacity-25 rounded" style={{ width: '150px', height: '16px' }}></div>
                                    </div>
                                </div>
                                <div className="bg-white bg-opacity-25 rounded" style={{ width: '140px', height: '38px' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards Skeleton */}
                <div className="row mb-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="col-md-3">
                            <div className="card border-0 shadow-sm bg-light">
                                <div className="card-body text-center">
                                    <div className="bg-secondary bg-opacity-25 rounded mx-auto mb-2" style={{ width: '60px', height: '14px' }}></div>
                                    <div className="bg-secondary bg-opacity-50 rounded mx-auto" style={{ width: '80px', height: '28px' }}></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Question Summary Skeleton */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white">
                                <div className="bg-secondary bg-opacity-25 rounded" style={{ width: '150px', height: '20px' }}></div>
                            </div>
                            <div className="card-body">
                                <div className="d-flex gap-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="bg-secondary bg-opacity-25 rounded" style={{ width: '100px', height: '32px' }}></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Questions Skeleton */}
                <div className="row">
                    <div className="col-12">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="card mb-3 border">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between mb-3">
                                        <div className="bg-secondary bg-opacity-25 rounded" style={{ width: '100px', height: '20px' }}></div>
                                        <div className="bg-secondary bg-opacity-25 rounded" style={{ width: '80px', height: '24px' }}></div>
                                    </div>
                                    <div className="bg-secondary bg-opacity-25 rounded mb-3" style={{ width: '100%', height: '60px' }}></div>
                                    <div className="space-y-2">
                                        {[1, 2, 3, 4].map(j => (
                                            <div key={j} className="bg-secondary bg-opacity-10 rounded p-3 mb-2" style={{ height: '48px' }}></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
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
            {isResultDraft && (
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="alert alert-warning border-0 shadow-sm" style={{ backgroundColor: '#fff3cd', borderLeft: '5px solid #ffc107' }}>
                            <div className="d-flex align-items-start">
                                <div className="me-3" style={{ fontSize: '3rem', color: '#ff9800' }}>
                                    <FiClock />
                                </div>
                                <div className="flex-grow-1">
                                    <h4 className="alert-heading mb-3" style={{ color: '#856404', fontWeight: 600 }}>
                                        <FiHelpCircle className="me-2" size={24} />
                                        Result is Coming - Under Checking
                                    </h4>
                                    <p className="mb-2" style={{ fontSize: '1.05rem', lineHeight: '1.7' }}>
                                        Your exam contains <strong>subjective questions</strong> (Short Answer / Long Answer) that require manual evaluation by the teacher.
                                    </p>
                                    <p className="mb-2" style={{ fontSize: '1.05rem', lineHeight: '1.7' }}>
                                        📋 <strong>Current Status:</strong> Under Review by Teacher
                                    </p>
                                    <p className="mb-0" style={{ fontSize: '1.05rem', lineHeight: '1.7' }}>
                                        🔔 You will be <strong>notified</strong> once the evaluation is complete and your final result is published.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex align-items-center justify-content-between bg-primary text-white p-4 rounded">
                        <div className="d-flex align-items-center">
                            <Link href={`/my-results/${examId}`} className="btn btn-light btn-sm me-3">
                                <FiArrowLeft className="me-2" />
                                Back to Results
                            </Link>
                            <div>
                                <h4 className="mb-1">{exam.title}</h4>
                                <p className="mb-0 opacity-75">Exam Result Details</p>
                            </div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            {(user?.role === 'admin' || user?.role === 'teacher') && (
                                <>
                                    {attempt.resultStatus === 'draft' && (
                                        <span className="badge bg-warning text-dark px-3 py-2">
                                            <i className="feather-clock me-1"></i>
                                            Draft - Needs Evaluation
                                        </span>
                                    )}
                                    {attempt.resultStatus === 'published' && (
                                        <span className="badge bg-success px-3 py-2">
                                            <i className="feather-check-circle me-1"></i>
                                            Published
                                        </span>
                                    )}
                                    {!editMode ? (
                                        <button 
                                            onClick={handleEditToggle} 
                                            className="btn btn-light btn-sm"
                                        >
                                            <FiEdit2 className="me-2" />
                                            {attempt.resultStatus === 'draft' ? 'Evaluate & Publish' : 'Edit Marks'}
                                        </button>
                                    ) : (
                                        <>
                                            <button 
                                                onClick={handleUpdateMarks} 
                                                className="btn btn-success btn-sm"
                                                disabled={saving}
                                            >
                                                {saving ? 'Publishing...' : 'Update & Publish'}
                                            </button>
                                            <button 
                                                onClick={handleEditToggle} 
                                                className="btn btn-secondary btn-sm"
                                                disabled={saving}
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    )}
                                </>
                            )}
                            {/* Hide certificate download for students with draft results */}
                            {!isResultDraft && (
                                <CertificateGenerator
                                    attempt={attempt}
                                    exam={exam}
                                    user={user}
                                    settings={settings}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards - Only show for published results or teachers/admins */}
            {!isResultDraft && (
                <>
                    <div className="row mb-4">
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm bg-light">
                                <div className="card-body text-center">
                                    <div className="text-muted small mb-2">SCORE</div>
                                    <h3 className="mb-0 fw-bold">{attempt.score?.toFixed(2)}%</h3>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm bg-light">
                                <div className="card-body text-center">
                                    <div className="text-muted small mb-2">STATUS</div>
                                    <h5 className={`mb-0 fw-bold ${attempt.passed ? 'text-success' : 'text-danger'}`}>
                                        {attempt.passed ? 'PASSED' : 'FAILED'}
                                    </h5>
                                </div>
                            </div>
                        </div>
                        {shouldShowTimeTaken() && (
                            <div className="col-md-3">
                                <div className="card border-0 shadow-sm bg-light">
                                    <div className="card-body text-center">
                                        <div className="text-muted small mb-2">TIME TAKEN</div>
                                        <div className="fw-bold">
                                            <FiClock className="me-2" />
                                            {formatDuration(attempt.timeTaken)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm bg-light">
                                <div className="card-body text-center">
                                    <div className="text-muted small mb-2">QUESTIONS</div>
                                    <h5 className="mb-0 fw-bold">{totalQuestions}</h5>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Question Summary */}
                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="card border-0 shadow-sm">
                                <div className="card-header bg-white">
                                    <h5 className="mb-0 text-primary">Question Review</h5>
                                </div>
                                <div className="card-body">
                                    <div className="d-flex gap-3 mb-4">
                                        <span className="badge bg-success px-3 py-2">
                                            <FiCheckCircle className="me-2" />
                                            Correct: {correctAnswers}
                                        </span>
                                        <span className="badge bg-danger px-3 py-2">
                                            <FiXCircle className="me-2" />
                                            Incorrect: {incorrectAnswers}
                                        </span>
                                        <span className="badge bg-info px-3 py-2">
                                            <FiHelpCircle className="me-2" />
                                            Total: {totalQuestions}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Questions */}
                    <div className="row">
                        <div className="col-12">
                            {renderQuestionReview()}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AttemptDetailPage;
