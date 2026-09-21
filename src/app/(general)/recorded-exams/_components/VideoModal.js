'use client';
import React from 'react';

// Modal showing camera/screen video playback plus summary info for one attempt.
export default function VideoModal({ selectedAttempt, onClose }) {
    return (
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
                                onClick={onClose}
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
    );
}
