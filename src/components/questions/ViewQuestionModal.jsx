'use client';
import React from 'react';
import { FiCheck, FiX } from 'react-icons/fi';

const ViewQuestionModal = ({ show, onClose, question }) => {
    if (!show || !question) return null;

    const renderOptions = () => {
        if (['short_answer', 'long_answer'].includes(question.type)) {
            return (
                <div className="alert alert-info">
                    {question.type === 'short_answer' ? 'Short Answer' : 'Long Answer'} Question. 
                    {question.wordLimit > 0 && ` Word Limit: ${question.wordLimit}`}
                </div>
            );
        }

        return (
            <div className="list-group">
                {question.options.map((opt, idx) => (
                    <div key={idx} className={`list-group-item ${opt.isCorrect ? 'list-group-item-success' : ''}`}>
                        <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-2">
                                <span className="badge bg-secondary rounded-pill">{idx + 1}</span>
                                {question.hasImageOptions ? (
                                    <img src={opt.image} alt={`Option ${idx + 1}`} style={{ maxHeight: '50px', maxWidth: '100px' }} />
                                ) : (
                                    <span>{opt.text}</span>
                                )}
                            </div>
                            {opt.isCorrect && <span className="badge bg-success"><FiCheck /> Correct</span>}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', overflowY: 'auto' }}>
            <div className="modal-dialog modal-dialog-centered modal-xl">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Question Details</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                        <div className="row g-3">
                            <div className="col-md-4">
                                <label className="fw-bold text-muted small">Category</label>
                                <div>{question.category?.name || 'N/A'}</div>
                            </div>
                            <div className="col-md-4">
                                <label className="fw-bold text-muted small">Subject</label>
                                <div>{question.subject?.name || 'N/A'}</div>
                            </div>
                            <div className="col-md-4">
                                <label className="fw-bold text-muted small">Group</label>
                                <div>{question.questionGroup?.name || 'N/A'}</div>
                            </div>
                            
                            <div className="col-md-4">
                                <label className="fw-bold text-muted small">Type</label>
                                <div><span className="badge bg-info text-uppercase">{question.type?.replace('_', ' ')}</span></div>
                            </div>
                            <div className="col-md-4">
                                <label className="fw-bold text-muted small">Marks</label>
                                <div>{question.marks}</div>
                            </div>
                            <div className="col-md-4">
                                <label className="fw-bold text-muted small">Status</label>
                                <div>
                                    <span className={`badge bg-${question.status === 'active' ? 'success' : 'secondary'}`}>
                                        {question.status}
                                    </span>
                                </div>
                            </div>

                            <div className="col-12">
                                <label className="fw-bold text-muted small">Question Text</label>
                                <div className="p-3 border rounded bg-light" dangerouslySetInnerHTML={{ __html: question.questionText }}></div>
                            </div>

                            <div className="col-12">
                                <label className="fw-bold text-muted small mb-2">Options / Answer</label>
                                {renderOptions()}
                            </div>

                            {question.tips && (
                                <div className="col-12">
                                    <label className="fw-bold text-muted small">Tips / Explanation</label>
                                    <div className="alert alert-warning mb-0">{question.tips}</div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewQuestionModal;
