'use client';
import React from 'react';

// Modal listing every attempt for a single user, with recording download
// links/IDs when available.
export default function UserAttemptsModal({ selectedUser, userAttempts, onClose }) {
    return (
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
                                onClick={onClose}
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
                                                                        href={attempt.recordings?.cameraVideo ? `/api/storage/secure-file?path=${encodeURIComponent(attempt.recordings.cameraVideo)}` : '#'}
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
                                                                        href={attempt.recordings?.screenVideo ? `/api/storage/secure-file?path=${encodeURIComponent(attempt.recordings.screenVideo)}` : '#'}
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
    );
}
