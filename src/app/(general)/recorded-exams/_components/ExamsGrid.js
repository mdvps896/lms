'use client';
import React from 'react';

// The initial "pick an exam" grid shown before a specific exam is selected.
export default function ExamsGrid({ exams, onSelectExam }) {
    return (
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
                                    onClick={() => onSelectExam(exam)}
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
    );
}
