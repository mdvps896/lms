'use client';
import React from 'react';

export default function ExamInstructionsModal({ show, onClose, instructions }) {
    if (!show) return null;

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }} tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="feather-info me-2 text-primary"></i>
                            Exam Instructions
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                    </div>
                    <div className="modal-body">
                        {instructions ? (
                            <div className="instruction-content" dangerouslySetInnerHTML={{ __html: instructions }} />
                        ) : (
                            <div className="text-center py-4 text-muted">
                                <i className="feather-file-text d-block mb-2" style={{ fontSize: '2rem' }}></i>
                                <p>No specific instructions provided for this exam.</p>
                            </div>
                        )}

                        <div className="alert alert-light border mt-4">
                            <h6 className="alert-heading fw-bold mb-2">General Rules:</h6>
                            <ul className="mb-0 small text-muted ps-3">
                                <li>Ensure you have a stable internet connection.</li>
                                <li>Do not refresh the page during the exam.</li>
                                <li>Answering all questions is recommended unless there is negative marking.</li>
                                <li>Click 'Submit' only when you have completed your attempt.</li>
                            </ul>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-primary px-4" onClick={onClose}>I Understand</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
