'use client';
import React from 'react';
import { groupAttemptsByUser } from './helpers';

// The per-student attempt cards shown after an exam is selected.
export default function AttemptsByUserGrid({ selectedExam, loading, attempts, onViewUserAttempts }) {
    return (
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
                    {groupAttemptsByUser(attempts).map((group, idx) => (
                        <div key={idx} className="col-md-6 col-lg-4">
                            <div
                                className="card h-100 shadow-sm hover-shadow cursor-pointer"
                                onClick={() => onViewUserAttempts(group.user, group.attempts)}
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
                    ))}
                </div>
            )}
        </div>
    );
}
