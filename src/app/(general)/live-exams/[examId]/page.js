'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import LiveStreamView from '@/components/admin/LiveStreamView';
import ChatBox from '@/components/admin/ChatBox';
import VerificationPanel from '@/components/admin/VerificationPanel';
import ExamMonitoringSkeleton from '@/components/admin/ExamMonitoringSkeleton';

// Profile image styles
const profileImageStyles = `
.profile-image {
    border: 2px solid #dee2e6;
    transition: all 0.3s ease;
    background-color: #f8f9fa;
}

.profile-image:hover {
    border-color: #0d6efd;
    transform: scale(1.05);
}

.student-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.student-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}
`;

export default function ExamMonitoringPage() {
    const params = useParams();
    const router = useRouter();
    const [examData, setExamData] = useState(null);
    const [activeStudents, setActiveStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchExamData();
        const interval = setInterval(fetchExamData, 5000);
        return () => clearInterval(interval);
    }, [params.examId]);

    const fetchExamData = async () => {
        try {
            const response = await fetch('/api/exams/live');
            const data = await response.json();

            if (response.ok) {
                const exam = data.liveExams.find(e => e._id === params.examId);
                if (exam) {
                    setExamData(exam);
                    setActiveStudents(exam.activeUsers || []);
                } else {
                    toast.error('Exam not found');
                    router.push('/live-exams');
                }
            }
        } catch (error) {
            console.error('Error fetching exam data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleForceSubmit = async (attemptId) => {
        if (!confirm('Are you sure you want to force submit this exam?')) {
            return;
        }

        try {
            const response = await fetch('/api/exams/force-submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ attemptId })
            });

            if (response.ok) {
                toast.success('Exam force submitted successfully!');
                setSelectedStudent(null);
                fetchExamData();
            } else {
                toast.error('Failed to force submit exam');
            }
        } catch (error) {
            console.error('Error force submitting:', error);
            toast.error('Error force submitting exam');
        }
    };

    if (loading) {
        return <ExamMonitoringSkeleton />;
    }

    if (!examData) {
        return (
            <div className="container-fluid p-4">
                <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Exam not found or no longer active
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid p-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <button
                        className="btn btn-outline-secondary mb-2"
                        onClick={() => router.push('/live-exams')}
                    >
                        <i className="bi bi-arrow-left me-2"></i>
                        Back to All Exams
                    </button>
                    <h2 className="mb-0">
                        <i className="bi bi-broadcast me-2"></i>
                        {examData.examName}
                    </h2>
                </div>
                <div className="badge bg-success fs-6">
                    <i className="bi bi-circle-fill me-2" style={{ fontSize: '8px' }}></i>
                    {activeStudents.length} Active Students
                </div>
            </div>

            {/* Students Grid */}
            {!selectedStudent ? (
                <div className="row g-4">
                    {activeStudents.length === 0 ? (
                        <div className="col-12">
                            <div className="alert alert-info">
                                <i className="bi bi-info-circle me-2"></i>
                                No active students in this exam
                            </div>
                        </div>
                    ) : (
                        activeStudents.map((student, index) => (
                            <div key={student.attemptId} className="col-md-6 col-lg-4 col-xl-3">
                                <div className="card h-100 border-primary">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center mb-3">
                                            <div className="position-relative">
                                                <img
                                                    src={student.userPhoto || '/images/profile/default-avatar.svg'}
                                                    alt={student.userName}
                                                    className="rounded-circle border"
                                                    style={{ 
                                                        width: '50px', 
                                                        height: '50px', 
                                                        objectFit: 'cover',
                                                        backgroundColor: '#f8f9fa'
                                                    }}
                                                    onError={(e) => {
                                                        e.target.src = '/images/profile/default-avatar.svg';
                                                    }}
                                                />
                                                <span
                                                    className="position-absolute bottom-0 end-0 badge rounded-pill bg-success"
                                                    style={{ fontSize: '8px' }}
                                                >
                                                    <i className="bi bi-circle-fill"></i>
                                                </span>
                                            </div>
                                            <div className="ms-3 flex-grow-1">
                                                <h6 className="mb-0">{student.userName}</h6>
                                                <small className="text-muted">Student {index + 1}</small>
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <div className="d-flex justify-content-between mb-1">
                                                <small className="text-muted">Time Remaining</small>
                                                <small className="fw-bold">{student.timeRemaining}</small>
                                            </div>
                                            <div className="progress" style={{ height: '5px' }}>
                                                <div
                                                    className="progress-bar bg-warning"
                                                    style={{ width: `${student.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="d-grid">
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() => setSelectedStudent({ ...student, examId: examData._id })}
                                            >
                                                <i className="bi bi-camera-video me-2"></i>
                                                Monitor Student
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                /* Monitoring View */
                <div>
                    <div className="mb-3">
                        <button
                            className="btn btn-outline-secondary"
                            onClick={() => setSelectedStudent(null)}
                        >
                            <i className="bi bi-arrow-left me-2"></i>
                            Back to Students
                        </button>
                    </div>

                    <div className="card">
                        <div className="card-header bg-dark text-white">
                            <h5 className="mb-0">
                                <i className="bi bi-camera-video me-2"></i>
                                Monitoring: {selectedStudent.userName}
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="row g-4">
                                {/* Live Stream - 6 columns */}
                                <div className="col-lg-6">
                                    <LiveStreamView attemptId={selectedStudent.attemptId} />
                                </div>

                                {/* Verification Panel - 3 columns */}
                                <div className="col-lg-3">
                                    <VerificationPanel 
                                        attemptId={selectedStudent.attemptId}
                                        studentData={{
                                            profileImage: selectedStudent.userPhoto,
                                            name: selectedStudent.userName
                                        }}
                                    />
                                </div>

                                {/* Chat - 3 columns */}
                                <div className="col-lg-3">
                                    <ChatBox
                                        attemptId={selectedStudent.attemptId}
                                        examId={selectedStudent.examId}
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="row mt-4">
                                <div className="col-12">
                                    <div className="d-flex justify-content-end gap-2">
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => handleForceSubmit(selectedStudent.attemptId)}
                                        >
                                            <i className="bi bi-x-circle me-2"></i>
                                            Force Submit Exam
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
