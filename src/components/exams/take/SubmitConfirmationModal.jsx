import React from 'react';

export default function SubmitConfirmationModal({ show, onClose, onConfirm, summary }) {
    if (!show) return null;

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header border-0 pb-0">
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body text-center pt-0">
                        <div className="mb-3 text-warning">
                            <i className="feather-alert-triangle" style={{ fontSize: '3rem' }}></i>
                        </div>
                        <h4 className="modal-title fw-bold mb-3">Submit Exam?</h4>
                        <p className="text-muted mb-4">Are you sure you want to submit? You cannot undo this action.</p>

                        <div className="row g-3 mb-4 text-start justify-content-center">
                            <div className="col-auto">
                                <div className="p-3 border rounded bg-light text-center" style={{ minWidth: '100px' }}>
                                    <h3 className="mb-0 fw-bold text-success">{summary?.answered || 0}</h3>
                                    <small className="text-muted">Answered</small>
                                </div>
                            </div>
                            <div className="col-auto">
                                <div className="p-3 border rounded bg-light text-center" style={{ minWidth: '100px' }}>
                                    <h3 className="mb-0 fw-bold text-danger">{summary?.unanswered || 0}</h3>
                                    <small className="text-muted">Unanswered</small>
                                </div>
                            </div>
                            <div className="col-auto">
                                <div className="p-3 border rounded bg-light text-center" style={{ minWidth: '100px' }}>
                                    <h3 className="mb-0 fw-bold text-info">{summary?.marked || 0}</h3>
                                    <small className="text-muted">Marked</small>
                                </div>
                            </div>
                        </div>

                        <div className="d-flex gap-2 justify-content-center">
                            <button type="button" className="btn btn-outline-secondary px-4" onClick={onClose}>Cancel</button>
                            <button type="button" className="btn btn-primary px-4" onClick={onConfirm}>Yes, Submit</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
