'use client';
import React, { useEffect } from 'react';

export default function AdminWarningModal({ show, message, onClose }) {
    useEffect(() => {
        if (show) {
            // Auto-close after 10 seconds
            const timer = setTimeout(() => {
                onClose();
            }, 10000);

            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    if (!show) return null;

    return (
        <>
            <div className="modal fade show" style={{ display: 'block', zIndex: 9999 }} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content border-warning border-3">
                        <div className="modal-header bg-warning text-dark">
                            <h5 className="modal-title fw-bold">
                                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                Warning from Proctor
                            </h5>
                        </div>
                        <div className="modal-body">
                            <div className="alert alert-warning mb-0">
                                <i className="bi bi-megaphone me-2"></i>
                                <strong>Message:</strong>
                                <p className="mb-0 mt-2">{message}</p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-warning"
                                onClick={onClose}
                            >
                                <i className="bi bi-check-circle me-2"></i>
                                I Understand
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show" style={{ zIndex: 9998 }}></div>

            <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
                    20%, 40%, 60%, 80% { transform: translateX(10px); }
                }

                .modal-content {
                    animation: shake 0.5s;
                }
            `}</style>
        </>
    );
}
