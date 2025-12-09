'use client';
import React from 'react';

export default function PermissionModal({ show, onAllow, onCancel }) {
    if (!show) return null;

    return (
        <>
            <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header bg-primary text-white">
                            <h5 className="modal-title">
                                <i className="bi bi-camera-video me-2"></i>
                                Exam Permissions Required
                            </h5>
                        </div>
                        <div className="modal-body">
                            <div className="alert alert-info">
                                <i className="bi bi-info-circle me-2"></i>
                                This exam requires proctoring for security purposes.
                            </div>

                            <h6 className="fw-bold mb-3">Required Permissions:</h6>

                            <div className="permission-list">
                                <div className="permission-item d-flex align-items-start mb-3">
                                    <div className="permission-icon me-3">
                                        <i className="bi bi-camera-video-fill text-primary fs-4"></i>
                                    </div>
                                    <div>
                                        <h6 className="mb-1">Camera Access</h6>
                                        <p className="text-muted small mb-0">
                                            Your camera will record during the exam to ensure exam integrity.
                                        </p>
                                    </div>
                                </div>

                                <div className="permission-item d-flex align-items-start mb-3">
                                    <div className="permission-icon me-3">
                                        <i className="bi bi-mic-fill text-primary fs-4"></i>
                                    </div>
                                    <div>
                                        <h6 className="mb-1">Microphone Access</h6>
                                        <p className="text-muted small mb-0">
                                            Audio will be recorded along with video.
                                        </p>
                                    </div>
                                </div>

                                <div className="permission-item d-flex align-items-start mb-3">
                                    <div className="permission-icon me-3">
                                        <i className="bi bi-display-fill text-primary fs-4"></i>
                                    </div>
                                    <div>
                                        <h6 className="mb-1">Screen Recording</h6>
                                        <p className="text-muted small mb-0">
                                            Your screen will be recorded to prevent cheating.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="alert alert-warning mt-3">
                                <i className="bi bi-exclamation-triangle me-2"></i>
                                <strong>Important:</strong> If you cancel or deny these permissions, you will not be able to start the exam.
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={onCancel}
                            >
                                <i className="bi bi-x-circle me-2"></i>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={onAllow}
                            >
                                <i className="bi bi-check-circle me-2"></i>
                                Allow & Start Exam
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show"></div>
        </>
    );
}
