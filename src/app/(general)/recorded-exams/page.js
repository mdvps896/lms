'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export default function RecordedExamsPage() {
    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState(null);
    const [attempts, setAttempts] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userAttempts, setUserAttempts] = useState([]);
    const [selectedAttempt, setSelectedAttempt] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCompletedExams();
    }, []);

    const fetchCompletedExams = async () => {
        try {
            const response = await fetch('/api/exams/completed');
            const data = await response.json();

            console.log('Completed exams API response:', data);
            console.log('Exams array:', data.exams);

            if (response.ok) {
                setExams(data.exams || []);
                console.log('Set exams state to:', data.exams?.length || 0, 'exams');
            } else {
                console.error('API error:', data);
            }
        } catch (error) {
            console.error('Error fetching completed exams:', error);
            toast.error('Failed to load completed exams');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectExam = async (exam) => {
        setSelectedExam(exam);
        setLoading(true);

        try {
            const response = await fetch(`/api/exams/${exam._id}/attempts`);
            const data = await response.json();

            if (response.ok) {
                setAttempts(data.attempts || []);
            }
        } catch (error) {
            console.error('Error fetching attempts:', error);
            toast.error('Failed to load exam attempts');
        } finally {
            setLoading(false);
        }
    };

    const handleViewRecording = (attempt) => {
        setSelectedAttempt(attempt);
        setShowVideoModal(true);
    };

    const handleViewUserAttempts = (user, userAttemptsData) => {
        setSelectedUser(user);
        setUserAttempts(userAttemptsData);
        setShowUserModal(true);
    };

    if (loading && !selectedExam) {
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

    console.log('=== RENDER DEBUG ===');
    console.log('Loading:', loading);
    console.log('Selected Exam:', selectedExam);
    console.log('Exams length:', exams.length);
    console.log('Exams data:', exams);

    return (
        <div className="container-fluid p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">
                    <i className="bi bi-camera-reels me-2"></i>
                    Recorded Exams
                </h2>
                {selectedExam && (
                    <button
                        className="btn btn-secondary"
                        onClick={() => {
                            setSelectedExam(null);
                            setAttempts([]);
                        }}
                    >
                        <i className="bi bi-arrow-left me-2"></i>
                        Back to Exams
                    </button>
                )}
            </div>

            {!selectedExam ? (
                // Exam List
                <div className="row g-4">
                    {exams.length === 0 ? (
                        <div className="col-12">
                            <div className="alert alert-info">
                                <i className="bi bi-info-circle me-2"></i>
                                No completed exams found
                            </div>
                        </div>
                    ) : (
                        exams.map((exam) => (
                            <div key={exam._id} className="col-md-6 col-lg-4">
                                <div className="card h-100 shadow-sm hover-shadow">
                                    <div className="card-body">
                                        <h5 className="card-title">
                                            <i className="bi bi-file-earmark-text me-2 text-primary"></i>
                                            {exam.name}
                                        </h5>
                                        <div className="mb-3">
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted">Total Attempts:</span>
                                                <span className="badge bg-primary">{exam.totalAttempts}</span>
                                            </div>
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted">With Recordings:</span>
                                                <span className="badge bg-success">{exam.recordedAttempts}</span>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted">Completed:</span>
                                                <span className="text-muted">{new Date(exam.lastAttempt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <button
                                            className="btn btn-primary w-100"
                                            onClick={() => handleSelectExam(exam)}
                                        >
                                            <i className="bi bi-play-circle me-2"></i>
                                            View Recordings
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                // Attempts List - User Cards
                <div>
                    <div className="mb-4">
                        <h4 className="mb-3">
                            <i className="bi bi-people-fill me-2 text-primary"></i>
                            {selectedExam.name} - Student Attempts
                        </h4>
                    </div>
                    
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : attempts.length === 0 ? (
                        <div className="alert alert-info">
                            <i className="bi bi-info-circle me-2"></i>
                            No recorded attempts found for this exam
                        </div>
                    ) : (
                        <div className="row g-4">
                            {(() => {
                                // Group attempts by user
                                const userGroups = {};
                                attempts.forEach(attempt => {
                                    const userId = attempt.user?._id || 'unknown';
                                    if (!userGroups[userId]) {
                                        userGroups[userId] = {
                                            user: attempt.user,
                                            attempts: []
                                        };
                                    }
                                    userGroups[userId].attempts.push(attempt);
                                });

                                return Object.values(userGroups).map((group, idx) => (
                                    <div key={idx} className="col-md-6 col-lg-4">
                                        <div 
                                            className="card h-100 shadow-sm hover-shadow cursor-pointer" 
                                            onClick={() => handleViewUserAttempts(group.user, group.attempts)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="card-body">
                                                {/* User Header */}
                                                <div className="d-flex align-items-center mb-3 pb-3 border-bottom">
                                                    <img
                                                        src={group.user?.profileImage || group.user?.photo || '/images/profile/default-avatar.png'}
                                                        alt={group.user?.name}
                                                        className="rounded-circle me-3"
                                                        style={{ 
                                                            width: '80px', 
                                                            height: '80px', 
                                                            objectFit: 'cover',
                                                            border: '4px solid #e9ecef'
                                                        }}
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(group.user?.name || 'User') + '&background=4361ee&color=fff';
                                                        }}
                                                    />
                                                    <div className="flex-grow-1">
                                                        <h5 className="mb-1">{group.user?.name || 'Unknown Student'}</h5>
                                                        <p className="text-muted mb-0 small">
                                                            <i className="bi bi-envelope me-1"></i>
                                                            {group.user?.email || 'N/A'}
                                                        </p>
                                                        <span className="badge bg-primary mt-2">
                                                            {group.attempts.length} {group.attempts.length === 1 ? 'Attempt' : 'Attempts'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Quick Stats */}
                                                <div className="text-center">
                                                    <div className="row">
                                                        <div className="col-6">
                                                            <div className="p-2 bg-light rounded">
                                                                <div className="text-muted small">Best Score</div>
                                                                <h5 className="mb-0 text-success">
                                                                    {Math.max(...group.attempts.map(a => a.score || 0)).toFixed(2)}%
                                                                </h5>
                                                            </div>
                                                        </div>
                                                        <div className="col-6">
                                                            <div className="p-2 bg-light rounded">
                                                                <div className="text-muted small">Latest</div>
                                                                <h6 className="mb-0">
                                                                    {new Date(Math.max(...group.attempts.map(a => new Date(a.submittedAt)))).toLocaleDateString()}
                                                                </h6>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button className="btn btn-primary w-100 mt-3">
                                                        <i className="bi bi-eye me-2"></i>
                                                        View All Attempts
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    )}
                </div>
            )}

            {/* User Attempts Modal */}
            {showUserModal && selectedUser && (
                <>
                    <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                            <div className="modal-content">
                                <div className="modal-header bg-primary text-white">
                                    <div className="d-flex align-items-center">
                                        <img
                                            src={selectedUser?.photo || '/images/profile/default-avatar.png'}
                                            alt={selectedUser?.name}
                                            className="rounded-circle me-3"
                                            style={{ 
                                                width: '50px', 
                                                height: '50px', 
                                                objectFit: 'cover',
                                                border: '3px solid white'
                                            }}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(selectedUser?.name || 'User') + '&background=4361ee&color=fff';
                                            }}
                                        />
                                        <div>
                                            <h5 className="mb-0">{selectedUser?.name}'s Attempts</h5>
                                            <small>{selectedUser?.email}</small>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn-close btn-close-white"
                                        onClick={() => setShowUserModal(false)}
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <span className="badge bg-info me-2">
                                            Total Attempts: {userAttempts.length}
                                        </span>
                                        <span className="badge bg-success">
                                            Best Score: {Math.max(...userAttempts.map(a => a.score || 0)).toFixed(2)}%
                                        </span>
                                    </div>

                                    {/* Attempts List */}
                                    <div className="attempts-timeline">
                                        {userAttempts
                                            .sort((a, b) => {
                                                const dateA = new Date(a.submittedAt || a.startTime);
                                                const dateB = new Date(b.submittedAt || b.startTime);
                                                return dateB - dateA; // Latest first
                                            })
                                            .map((attempt, idx) => (
                                            <div key={attempt._id} className="card mb-3 shadow-sm">
                                                <div className="card-body">
                                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                                        <div>
                                                            <h5 className="mb-1">
                                                                <span className="badge bg-secondary me-2">
                                                                    Attempt #{userAttempts.length - idx}
                                                                </span>
                                                                <span className={`badge ${attempt.status === 'submitted' ? 'bg-success' : attempt.status === 'active' ? 'bg-warning' : 'bg-danger'} me-2`}>
                                                                    {attempt.status === 'submitted' ? 'Submitted' : attempt.status === 'active' ? 'Active' : 'Expired'}
                                                                </span>
                                                                {attempt.status === 'submitted' && (
                                                                    <span className="badge bg-success">
                                                                        Score: {attempt.score?.toFixed(2)}%
                                                                    </span>
                                                                )}
                                                            </h5>
                                                        </div>
                                                        {(attempt.recordings?.cameraVideo || attempt.recordings?.screenVideo) && (
                                                            <span className="badge bg-danger">
                                                                <i className="bi bi-camera-video-fill me-1"></i>
                                                                Recorded
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="row mb-3">
                                                        <div className="col-md-4">
                                                            <small className="text-muted d-block">Duration</small>
                                                            <strong><i className="bi bi-clock me-1"></i>{attempt.duration}</strong>
                                                        </div>
                                                        <div className="col-md-4">
                                                            <small className="text-muted d-block">Date</small>
                                                            <strong><i className="bi bi-calendar-check me-1"></i>{new Date(attempt.submittedAt).toLocaleDateString()}</strong>
                                                        </div>
                                                        <div className="col-md-4">
                                                            <small className="text-muted d-block">Time</small>
                                                            <strong><i className="bi bi-clock-fill me-1"></i>{new Date(attempt.submittedAt).toLocaleTimeString()}</strong>
                                                        </div>
                                                    </div>



                                                    {/* Show recording options if we have IDs or video files */}
                                                    {(attempt.recordings?.cameraRecordingId || attempt.recordings?.screenRecordingId || attempt.recordings?.cameraVideo || attempt.recordings?.screenVideo) ? (
                                                        <div className="alert alert-success">
                                                            <i className="bi bi-check-circle me-2"></i>
                                                            Recording Files Available
                                                            
                                                            {/* Download Buttons */}
                                                            <div className="mt-3">
                                                                <div className="row g-2">
                                                                    {(attempt.recordings?.cameraVideo || attempt.recordings?.cameraRecordingId) && (
                                                                        <div className="col-md-6">
                                                                            <a
                                                                                href={attempt.recordings?.cameraVideo || '#'}
                                                                                className="btn btn-outline-primary btn-sm w-100"
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                onClick={!attempt.recordings?.cameraVideo ? (e) => {
                                                                                    e.preventDefault();
                                                                                    alert(`Camera Recording ID: ${attempt.recordings?.cameraRecordingId}\n\nVideo will be available for download once processed.`);
                                                                                } : undefined}
                                                                            >
                                                                                <i className="bi bi-camera-video me-2"></i>
                                                                                {attempt.recordings?.cameraVideo ? 'Download' : 'Processing'} Camera Recording
                                                                            </a>
                                                                        </div>
                                                                    )}
                                                                    
                                                                    {(attempt.recordings?.screenVideo || attempt.recordings?.screenRecordingId) && (
                                                                        <div className="col-md-6">
                                                                            <a
                                                                                href={attempt.recordings?.screenVideo || '#'}
                                                                                className="btn btn-outline-success btn-sm w-100"
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                onClick={!attempt.recordings?.screenVideo ? (e) => {
                                                                                    e.preventDefault();
                                                                                    alert(`Screen Recording ID: ${attempt.recordings?.screenRecordingId}\n\nVideo will be available for download once processed.`);
                                                                                } : undefined}
                                                                            >
                                                                                <i className="bi bi-display me-2"></i>
                                                                                {attempt.recordings?.screenVideo ? 'Download' : 'Processing'} Screen Recording
                                                                            </a>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Show Recording IDs if available */}
                                                            {(attempt.recordings?.cameraRecordingId || attempt.recordings?.screenRecordingId) && (
                                                                <div className="mt-3">
                                                                    <h6 className="mb-2">📋 Recording IDs:</h6>
                                                                    
                                                                    {attempt.recordings?.cameraRecordingId && (
                                                                        <div className="mb-2">
                                                                            <strong>📹 Camera Recording ID:</strong>
                                                                            <div className="input-group mt-1">
                                                                                <input
                                                                                    type="text"
                                                                                    className="form-control form-control-sm"
                                                                                    value={attempt.recordings.cameraRecordingId}
                                                                                    readOnly
                                                                                    style={{ fontSize: '0.85rem' }}
                                                                                />
                                                                                <button
                                                                                    className="btn btn-outline-primary btn-sm"
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        navigator.clipboard.writeText(attempt.recordings.cameraRecordingId);
                                                                                        alert('Camera Recording ID copied to clipboard!');
                                                                                    }}
                                                                                    title="Copy Camera Recording ID"
                                                                                >
                                                                                    <i className="bi bi-clipboard"></i>
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    
                                                                    {attempt.recordings?.screenRecordingId && (
                                                                        <div className="mb-2">
                                                                            <strong>🖥️ Screen Recording ID:</strong>
                                                                            <div className="input-group mt-1">
                                                                                <input
                                                                                    type="text"
                                                                                    className="form-control form-control-sm"
                                                                                    value={attempt.recordings.screenRecordingId}
                                                                                    readOnly
                                                                                    style={{ fontSize: '0.85rem' }}
                                                                                />
                                                                                <button
                                                                                    className="btn btn-outline-primary btn-sm"
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        navigator.clipboard.writeText(attempt.recordings.screenRecordingId);
                                                                                        alert('Screen Recording ID copied to clipboard!');
                                                                                    }}
                                                                                    title="Copy Screen Recording ID"
                                                                                >
                                                                                    <i className="bi bi-clipboard"></i>
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    
                                                                    <small className="text-muted">
                                                                        <i className="bi bi-lightbulb me-1"></i>
                                                                        Use these IDs to search recordings in Storage section
                                                                    </small>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="alert alert-info">
                                                            <i className="bi bi-info-circle me-2"></i>
                                                            No Recording Files Available
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </>
            )}

            {/* Video Modal */}
            {showVideoModal && selectedAttempt && (
                <>
                    <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                        <div className="modal-dialog modal-xl modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header bg-dark text-white">
                                    <h5 className="modal-title">
                                        <i className="bi bi-camera-reels me-2"></i>
                                        Exam Recording: {selectedAttempt.user?.name}
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close btn-close-white"
                                        onClick={() => setShowVideoModal(false)}
                                    ></button>
                                </div>
                                <div className="modal-body p-0">
                                    <div className="row g-0">
                                        {/* Camera Video */}
                                        <div className="col-md-6 bg-dark p-3">
                                            <div className="text-white mb-2">
                                                <i className="bi bi-camera-video me-2"></i>
                                                Camera Recording
                                            </div>
                                            {selectedAttempt.recordings?.cameraVideo ? (
                                                <video
                                                    controls
                                                    className="w-100 rounded"
                                                    style={{ maxHeight: '400px' }}
                                                >
                                                    <source src={selectedAttempt.recordings.cameraVideo} type="video/webm" />
                                                    Your browser does not support the video tag.
                                                </video>
                                            ) : (
                                                <div className="ratio ratio-16x9 bg-secondary rounded d-flex align-items-center justify-content-center">
                                                    <div className="text-white text-center">
                                                        <i className="bi bi-camera-video-off fs-1"></i>
                                                        <p className="mt-2">No camera recording available</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Screen Video */}
                                        <div className="col-md-6 bg-dark p-3">
                                            <div className="text-white mb-2">
                                                <i className="bi bi-display me-2"></i>
                                                Screen Recording
                                            </div>
                                            {selectedAttempt.recordings?.screenVideo ? (
                                                <video
                                                    controls
                                                    className="w-100 rounded"
                                                    style={{ maxHeight: '400px' }}
                                                >
                                                    <source src={selectedAttempt.recordings.screenVideo} type="video/webm" />
                                                    Your browser does not support the video tag.
                                                </video>
                                            ) : (
                                                <div className="ratio ratio-16x9 bg-secondary rounded d-flex align-items-center justify-content-center">
                                                    <div className="text-white text-center">
                                                        <i className="bi bi-display fs-1"></i>
                                                        <p className="mt-2">No screen recording available</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Exam Info */}
                                    <div className="p-3 bg-light border-top">
                                        <div className="row">
                                            <div className="col-md-3">
                                                <strong>Score:</strong>
                                                <p className="mb-0">{selectedAttempt.score?.toFixed(2)}%</p>
                                            </div>
                                            <div className="col-md-3">
                                                <strong>Duration:</strong>
                                                <p className="mb-0">{selectedAttempt.duration}</p>
                                            </div>
                                            <div className="col-md-3">
                                                <strong>Submitted:</strong>
                                                <p className="mb-0">{new Date(selectedAttempt.submittedAt).toLocaleString()}</p>
                                            </div>
                                            <div className="col-md-3">
                                                <strong>Status:</strong>
                                                <p className="mb-0">
                                                    <span className="badge bg-success">Completed</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </>
            )}

            <style jsx>{`
                .hover-shadow {
                    transition: box-shadow 0.3s ease;
                }
                .hover-shadow:hover {
                    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
                }
                .cursor-pointer {
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .cursor-pointer:hover {
                    background-color: #e9ecef !important;
                    transform: scale(1.02);
                }
            `}</style>
        </div>
    );
}
