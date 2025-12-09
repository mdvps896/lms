'use client';
import React, { useState } from 'react';
import ExamInstructionsModal from './ExamInstructionsModal';

export default function ExamHeader({ examName, timeRemaining, onSubmit, user, instructions }) {
    const [showInstructions, setShowInstructions] = useState(false);

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    return (
        <>
            <div className="exam-header" style={{
                background: '#0891b2',
                color: 'white',
                padding: '10px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <div className="exam-title d-flex align-items-center">
                    <button
                        className="btn btn-sm btn-outline-light me-3 d-flex align-items-center"
                        onClick={() => setShowInstructions(true)}
                        title="View Instructions"
                        style={{ border: '1px solid rgba(255,255,255,0.3)' }}
                    >
                        <i className="feather-info me-2"></i> Instructions
                    </button>
                    <h5 className="mb-0" style={{ fontSize: '18px', fontWeight: '600' }}>
                        {examName}
                    </h5>
                </div>

                <div className="exam-actions" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    {/* User Info */}
                    {user && (
                        <div className="d-flex align-items-center me-2 user-info-header">
                            <div className="bg-white rounded-circle d-flex align-items-center justify-content-center text-primary fw-bold me-2" style={{ width: '35px', height: '35px', fontSize: '14px', overflow: 'hidden' }}>
                                {user.profileImage ? (
                                    <img src={user.profileImage} alt={user.name} className="w-100 h-100" style={{ objectFit: 'cover' }} />
                                ) : (
                                    (user.name?.charAt(0) || 'U').toUpperCase()
                                )}
                            </div>
                            <span className="fw-medium d-none d-md-block text-white" style={{ fontSize: '14px' }}>{user.name}</span>
                        </div>
                    )}

                    <div className="timer" style={{
                        background: 'rgba(255,255,255,0.2)',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        fontSize: '16px',
                        fontWeight: '600',
                        color: 'white',
                        minWidth: '100px',
                        textAlign: 'center'
                    }}>
                        Time Left - {formatTime(timeRemaining)}
                    </div>

                    <button
                        className="btn btn-light"
                        onClick={onSubmit}
                        style={{
                            fontWeight: '600',
                            padding: '8px 24px'
                        }}
                    >
                        SUBMIT
                    </button>
                </div>
            </div>

            <ExamInstructionsModal
                show={showInstructions}
                onClose={() => setShowInstructions(false)}
                instructions={instructions}
            />
        </>
    );
}
