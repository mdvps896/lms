'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiUser, FiMail, FiHash, FiCalendar, FiEye, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const StudentResultsPage = () => {
    const params = useParams();
    const router = useRouter();
    const { id: examId, studentId } = params;

    const [exam, setExam] = useState(null);
    const [student, setStudent] = useState(null);
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [examId, studentId]);

    const fetchData = async () => {
        try {
            // Fetch exam details
            const examRes = await fetch(`/api/exams/${examId}`);
            const examData = await examRes.json();
            if (examData.success) {
                setExam(examData.data);
            }

            // Fetch student attempts
            const attemptsRes = await fetch(`/api/exams/${examId}/student/${studentId}/attempts`);
            const attemptsData = await attemptsRes.json();
            if (attemptsData.success) {
                setStudent(attemptsData.student);
                setAttempts(attemptsData.attempts);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDuration = (seconds) => {
        if (!seconds) return 'N/A';
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}m ${secs}s`;
    };

    if (loading) {
        return (
            <div className="container-fluid p-4">
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid p-4">
            {/* Header */}
            <div className="d-flex align-items-center mb-4">
                <Link href="/exam" className="btn btn-light me-3">
                    <FiArrowLeft className="me-2" />
                    Back to Exams
                </Link>
                <div>
                    <h4 className="mb-0 fw-bold">{exam?.name}</h4>
                    <p className="text-muted mb-0">Student Result Details</p>
                </div>
            </div>

            {/* Student Info Card */}
            <div className="card mb-4">
                <div className="card-body">
                    <h5 className="fw-bold mb-3">
                        <FiUser className="me-2" />
                        Student Information
                    </h5>
                    <div className="row">
                        <div className="col-md-4">
                            <div className="d-flex align-items-center mb-3">
                                <FiUser className="text-muted me-2" />
                                <div>
                                    <small className="text-muted d-block">Name</small>
                                    <strong>{student?.name}</strong>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="d-flex align-items-center mb-3">
                                <FiHash className="text-muted me-2" />
                                <div>
                                    <small className="text-muted d-block">Roll No</small>
                                    <strong>{student?.rollNo}</strong>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="d-flex align-items-center mb-3">
                                <FiMail className="text-muted me-2" />
                                <div>
                                    <small className="text-muted d-block">Email</small>
                                    <strong>{student?.email}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Attempts Table */}
            <div className="card">
                <div className="card-header bg-white">
                    <h5 className="mb-0 fw-bold">
                        All Attempts ({attempts.length})
                    </h5>
                </div>
                <div className="card-body p-0">
                    {attempts.length === 0 ? (
                        <div className="text-center py-5">
                            <p className="text-muted">No attempts found for this student.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>#</th>
                                        <th>
                                            <FiCalendar className="me-2" />
                                            Date & Time
                                        </th>
                                        <th className="text-center">
                                            <FiClock className="me-2" />
                                            Duration
                                        </th>
                                        <th className="text-center">Score</th>
                                        <th className="text-center">Status</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attempts.map((attempt, index) => (
                                        <tr key={attempt._id}>
                                            <td>
                                                <span className="badge bg-light text-dark">
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td>{formatDate(attempt.submittedAt)}</td>
                                            <td className="text-center">
                                                <span className="text-muted">
                                                    {formatDuration(attempt.timeTaken)}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <div>
                                                    <strong>{attempt.percentage?.toFixed(2)}%</strong>
                                                    <div className="small text-muted">
                                                        {attempt.score}/{attempt.totalMarks}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                {attempt.resultStatus === 'draft' ? (
                                                    <span className="badge bg-warning text-dark">
                                                        <FiClock className="me-1" size={12} />
                                                        Under Review
                                                    </span>
                                                ) : attempt.passed ? (
                                                    <span className="badge bg-success">
                                                        <FiCheckCircle className="me-1" size={12} />
                                                        Passed
                                                    </span>
                                                ) : (
                                                    <span className="badge bg-danger">
                                                        <FiXCircle className="me-1" size={12} />
                                                        Failed
                                                    </span>
                                                )}
                                            </td>
                                            <td className="text-center">
                                                <Link
                                                    href={`/my-results/${examId}/${attempt._id}`}
                                                    className="btn btn-sm btn-primary"
                                                >
                                                    <FiEye className="me-1" size={14} />
                                                    View Details
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentResultsPage;
