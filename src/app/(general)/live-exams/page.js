'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

// Inline styles for profile images
const profileImageStyles = `
.profile-image-container {
    position: relative;
    display: inline-block;
}

.profile-image {
    border: 2px solid #dee2e6;
    transition: all 0.3s ease;
    background-color: #f8f9fa;
}

.profile-image:hover {
    border-color: #0d6efd;
    transform: scale(1.05);
}

.online-indicator {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 12px;
    height: 12px;
    background-color: #198754;
    border: 2px solid white;
    border-radius: 50%;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
}

.student-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.student-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}
`;

export default function LiveExamsPage() {
    const router = useRouter();
    const [liveExams, setLiveExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        fetchLiveExams();
        const interval = setInterval(fetchLiveExams, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchLiveExams = async () => {
        try {
            const response = await fetch('/api/exams/live');
            const data = await response.json();

            if (response.ok) {
                setLiveExams(data.liveExams || []);
            }
        } catch (error) {
            console.error('Error fetching live exams:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container-fluid p-4">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: profileImageStyles }} />
            <div className="container-fluid p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">
                    <i className="bi bi-broadcast me-2"></i>
                    Live Exam Monitoring
                </h2>
                <div className="badge bg-success fs-6">
                    <i className="bi bi-circle-fill me-2" style={{ fontSize: '8px' }}></i>
                    {liveExams.length} Active Exams
                </div>
            </div>

            {liveExams.length === 0 ? (
                <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    No live exams at the moment
                </div>
            ) : (
                <>
                    {/* Exam Tabs */}
                    <ul className="nav nav-tabs mb-4">
                        {liveExams.map((exam, index) => (
                            <li className="nav-item" key={exam._id}>
                                <button
                                    className={`nav-link ${activeTab === index ? 'active' : ''}`}
                                    onClick={() => setActiveTab(index)}
                                >
                                    <i className="bi bi-file-earmark-text me-2"></i>
                                    {exam.examName}
                                    <span className="badge bg-primary ms-2">
                                        {exam.activeUsers?.length || 0}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>

                    {/* Active Exam Content */}
                    {liveExams[activeTab] && (
                        <div className="card">
                            <div className="card-header bg-primary text-white">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">
                                        <i className="bi bi-people me-2"></i>
                                        Active Students
                                    </h5>
                                    <span className="badge bg-light text-dark">
                                        {liveExams[activeTab].activeUsers?.length || 0} Students
                                    </span>
                                </div>
                            </div>
                            <div className="card-body">
                                {liveExams[activeTab].activeUsers?.length === 0 ? (
                                    <div className="text-center text-muted py-5">
                                        <i className="bi bi-person-x fs-1 mb-3 d-block"></i>
                                        <p>No active students in this exam</p>
                                    </div>
                                ) : (
                                    <div className="row g-3">
                                        {liveExams[activeTab].activeUsers.map((student, index) => (
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
                                                                onClick={() => router.push(`/live-exams/${liveExams[activeTab]._id}`)}
                                                            >
                                                                <i className="bi bi-camera-video me-2"></i>
                                                                Monitor Exam
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
            </div>
        </>
    );
}
