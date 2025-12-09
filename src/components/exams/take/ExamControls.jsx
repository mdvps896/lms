'use client';
import React from 'react';

export default function ExamControls({ 
    currentIndex, 
    totalQuestions, 
    onPrevious, 
    onNext, 
    onMarkReview, 
    isMarkedForReview,
    onClearResponse 
}) {
    return (
        <div className="exam-controls mt-4" style={{
            background: 'white',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap'
        }}>
            <div className="left-controls" style={{ display: 'flex', gap: '10px' }}>
                <button
                    className="btn btn-outline-secondary"
                    onClick={onMarkReview}
                    style={{
                        fontWeight: '600',
                        padding: '8px 16px',
                        background: isMarkedForReview ? '#6f42c1' : 'white',
                        color: isMarkedForReview ? 'white' : '#6f42c1',
                        border: `1px solid #6f42c1`
                    }}
                >
                    {isMarkedForReview ? 'Unmark for Review' : 'Mark for Review & Next'}
                </button>

                <button
                    className="btn btn-outline-danger"
                    onClick={onClearResponse}
                    style={{
                        fontWeight: '600',
                        padding: '8px 16px'
                    }}
                >
                    Clear Response
                </button>
            </div>

            <div className="right-controls" style={{ display: 'flex', gap: '10px' }}>
                <button
                    className="btn btn-primary"
                    onClick={onPrevious}
                    disabled={currentIndex === 0}
                    style={{
                        fontWeight: '600',
                        padding: '8px 24px',
                        background: '#0891b2',
                        border: 'none'
                    }}
                >
                    ← Previous
                </button>

                <button
                    className="btn btn-primary"
                    onClick={onNext}
                    disabled={currentIndex === totalQuestions - 1}
                    style={{
                        fontWeight: '600',
                        padding: '8px 24px',
                        background: '#0891b2',
                        border: 'none'
                    }}
                >
                    Save & Next →
                </button>
            </div>
        </div>
    );
}
