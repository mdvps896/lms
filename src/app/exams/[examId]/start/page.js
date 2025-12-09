'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';
import PreExamVerification from '@/components/exams/PreExamVerification';

export default function StartExamPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [startingExam, setStartingExam] = useState(false);
    const [showVerification, setShowVerification] = useState(false);
    const [verificationData, setVerificationData] = useState(null);

    // Check if user came from my-exams page
    useEffect(() => {
        const allowedAccess = sessionStorage.getItem(`exam_access_${params.examId}`);
        
        if (!allowedAccess) {
            toast.error('Please access the exam from My Exams page');
            router.push('/my-exams');
            return;
        }
    }, [params.examId, router]);

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            toast.error('Please login to continue');
            router.push('/authentication/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (params.examId && user) {
            fetchExamDetails();
        }
    }, [params.examId, user]);

    const fetchExamDetails = async () => {
        try {
            const response = await fetch(`/api/exams/${params.examId}`);
            const data = await response.json();

            if (data.success) {
                setExam(data.data);
                // Clear the access token after successfully loading the exam
                sessionStorage.removeItem(`exam_access_${params.examId}`);
            } else {
                toast.error('Failed to load exam details');
                router.push('/my-exams');
            }
        } catch (error) {
            console.error('Error fetching exam:', error);
            toast.error('Error loading exam');
            router.push('/my-exams');
        } finally {
            setLoading(false);
        }
    };

    const handleStartExam = async () => {
        if (!user) {
            toast.error('Please login to continue');
            return;
        }

        // Check if verification is required
        const needsVerification = exam?.settings?.faceVerification?.enabled || 
                                 exam?.settings?.identityVerification?.enabled;

        if (needsVerification) {
            setShowVerification(true);
            return;
        }

        // Proceed with exam start
        proceedToExam();
    };

    const handleVerificationComplete = (data) => {
        setVerificationData(data);
        
        // Check if authorized
        if (data.isAuthorized) {
            proceedToExam(data.verificationId);
        } else {
            toast.error('Verification failed. You are not authorized to take this exam.');
            router.push('/my-exams');
        }
    };

    const handleVerificationCancel = () => {
        setShowVerification(false);
        router.push('/my-exams');
    };

    const proceedToExam = async (verificationId = null) => {
        setStartingExam(true);

        try {
            const response = await fetch('/api/exams/start-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    examId: params.examId,
                    userId: user._id || user.id,
                    verificationId
                }),
            });

            const data = await response.json();

            if (response.ok && data.session) {
                // Store session info
                sessionStorage.setItem('examSession', JSON.stringify({
                    token: data.session.token,
                    examId: params.examId,
                    attemptId: data.attemptId,
                    startTime: data.session.startTime
                }));

                // Redirect to exam take page - use correct UI route
                window.location.href = `/exams/${params.examId}/take?attemptId=${data.attemptId}&sessionToken=${data.session.token}`;
            } else {
                toast.error(data.message || 'Failed to start exam');
            }
        } catch (error) {
            console.error('Error starting exam:', error);
            toast.error('Error starting exam');
        } finally {
            setStartingExam(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="container-fluid">
                <div className="row justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
                    <div className="col-auto text-center">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-3">Loading exam details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!exam) {
        return null;
    }

    // Show verification if required
    if (showVerification) {
        return (
            <div className="container-fluid">
                <div className="row justify-content-center">
                    <div className="col-lg-10 col-xl-8">
                        <div className="mt-4">
                            <PreExamVerification
                                exam={exam}
                                onVerificationComplete={handleVerificationComplete}
                                onCancel={handleVerificationCancel}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <div className="row justify-content-center">
                <div className="col-lg-8 col-xl-6">
                    <div className="card border-0 shadow-lg mt-5">
                        <div className="card-body p-5">
                            {/* Header */}
                            <div className="text-center mb-4">
                                <div className="mb-3">
                                    <i className="feather-file-text text-primary" style={{ fontSize: '3rem' }}></i>
                                </div>
                                <h2 className="fw-bold">{exam.name}</h2>
                                <p className="text-muted">{exam.category?.name}</p>
                            </div>

                            {/* Exam Details */}
                            <div className="row mb-4">
                                <div className="col-6 mb-3">
                                    <div className="d-flex align-items-center">
                                        <i className="feather-clock text-primary me-2"></i>
                                        <div>
                                            <small className="text-muted d-block">Duration</small>
                                            <strong>{exam.duration} minutes</strong>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6 mb-3">
                                    <div className="d-flex align-items-center">
                                        <i className="feather-award text-primary me-2"></i>
                                        <div>
                                            <small className="text-muted d-block">Total Marks</small>
                                            <strong>{exam.totalMarks}</strong>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6 mb-3">
                                    <div className="d-flex align-items-center">
                                        <i className="feather-check-circle text-primary me-2"></i>
                                        <div>
                                            <small className="text-muted d-block">Passing %</small>
                                            <strong>{exam.passingPercentage}%</strong>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6 mb-3">
                                    <div className="d-flex align-items-center">
                                        <i className="feather-repeat text-primary me-2"></i>
                                        <div>
                                            <small className="text-muted d-block">Max Attempts</small>
                                            <strong>{exam.maxAttempts === -1 ? 'Unlimited' : exam.maxAttempts}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Instructions */}
                            {exam.instructions && (
                                <div className="alert alert-info mb-4">
                                    <h6 className="fw-bold mb-2">
                                        <i className="feather-info me-2"></i>
                                        Instructions
                                    </h6>
                                    <div dangerouslySetInnerHTML={{ __html: exam.instructions }} />
                                </div>
                            )}

                            {/* Important Notes */}
                            <div className="alert alert-warning mb-4">
                                <h6 className="fw-bold mb-2">
                                    <i className="feather-alert-triangle me-2"></i>
                                    Important Notes
                                </h6>
                                <ul className="mb-0 ps-3">
                                    <li>Once started, the timer will begin automatically</li>
                                    <li>You cannot pause the exam once started</li>
                                    <li>Make sure you have a stable internet connection</li>
                                    <li>Do not refresh or close the browser during the exam</li>
                                    {exam.settings?.allowTabSwitch === false && (
                                        <li className="text-danger">Tab switching is not allowed</li>
                                    )}
                                </ul>
                            </div>

                            {/* Action Buttons */}
                            <div className="d-flex gap-3">
                                <button
                                    className="btn btn-outline-secondary flex-fill"
                                    onClick={() => router.back()}
                                    disabled={startingExam}
                                >
                                    <i className="feather-arrow-left me-2"></i>
                                    Back
                                </button>
                                <button
                                    className="btn btn-primary flex-fill"
                                    onClick={handleStartExam}
                                    disabled={startingExam}
                                >
                                    {startingExam ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Starting...
                                        </>
                                    ) : (
                                        <>
                                            <i className="feather-play me-2"></i>
                                            Start Exam
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
