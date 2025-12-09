'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';

export default function ExamResultPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState(null);

    useEffect(() => {
        if (params.attemptId) {
            fetchResult();
        }
    }, [params.attemptId]);

    const fetchResult = async () => {
        try {
            const response = await fetch(`/api/exams/result/${params.attemptId}`);
            const data = await response.json();

            if (response.ok) {
                setResult(data);
            } else {
                toast.error(data.message || 'Failed to load result');
                router.push('/dashboards');
            }
        } catch (error) {
            console.error('Error loading result:', error);
            toast.error('Error loading result');
            router.push('/dashboards');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container-fluid">
                <div className="row justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
                    <div className="col-auto text-center">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-3">Loading result...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!result) return null;

    const percentage = result.percentage || 0;
    const passed = percentage >= (result.exam?.passingPercentage || 40);

    return (
        <div className="container-fluid py-5">
            <div className="row justify-content-center">
                <div className="col-lg-8 col-xl-6">
                    <div className="card border-0 shadow-lg">
                        <div className="card-body p-5">
                            {/* Result Header */}
                            <div className="text-center mb-4">
                                <div className={`mb-3 ${passed ? 'text-success' : 'text-danger'}`}>
                                    <i className={`feather-${passed ? 'check-circle' : 'x-circle'}`} style={{ fontSize: '4rem' }}></i>
                                </div>
                                <h2 className={`fw-bold ${passed ? 'text-success' : 'text-danger'}`}>
                                    {passed ? 'Congratulations!' : 'Better Luck Next Time!'}
                                </h2>
                                <p className="text-muted">{result.exam?.name}</p>
                            </div>

                            {/* Score Card */}
                            <div className="score-card text-center mb-4 p-4" style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                borderRadius: '12px',
                                color: 'white'
                            }}>
                                <h3 className="mb-2">Your Score</h3>
                                <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>
                                    {result.score} / {result.totalMarks}
                                </div>
                                <div style={{ fontSize: '1.5rem' }}>
                                    {percentage.toFixed(2)}%
                                </div>
                            </div>

                            {/* Details */}
                            <div className="row mb-4">
                                <div className="col-6 mb-3">
                                    <div className="p-3 bg-light rounded">
                                        <small className="text-muted d-block">Total Questions</small>
                                        <strong className="fs-5">{result.totalQuestions || 0}</strong>
                                    </div>
                                </div>
                                <div className="col-6 mb-3">
                                    <div className="p-3 bg-light rounded">
                                        <small className="text-muted d-block">Answered</small>
                                        <strong className="fs-5">{result.answeredCount || 0}</strong>
                                    </div>
                                </div>
                                <div className="col-6 mb-3">
                                    <div className="p-3 bg-light rounded">
                                        <small className="text-muted d-block">Submitted At</small>
                                        <strong className="fs-6">
                                            {new Date(result.submittedAt).toLocaleString()}
                                        </strong>
                                    </div>
                                </div>
                                <div className="col-6 mb-3">
                                    <div className="p-3 bg-light rounded">
                                        <small className="text-muted d-block">Status</small>
                                        <strong className={`fs-5 ${passed ? 'text-success' : 'text-danger'}`}>
                                            {passed ? 'PASSED' : 'FAILED'}
                                        </strong>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="d-grid gap-2">
                                <button 
                                    className="btn btn-primary btn-lg"
                                    onClick={() => router.push('/dashboards')}
                                >
                                    Go to Dashboard
                                </button>
                                <button 
                                    className="btn btn-outline-secondary btn-lg"
                                    onClick={() => router.push('/my-exams')}
                                >
                                    View My Exams
                                </button>
                                {result.exam?.maxAttempts === -1 || 
                                 (result.attemptNumber < result.exam?.maxAttempts) ? (
                                    <button 
                                        className="btn btn-outline-primary btn-lg"
                                        onClick={() => router.push(`/exams/${result.exam._id}/start`)}
                                    >
                                        Retake Exam
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
