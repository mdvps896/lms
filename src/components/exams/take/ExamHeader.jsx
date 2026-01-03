'use client';
import React, { useState } from 'react';
import { FiMenu } from 'react-icons/fi';
import ExamInstructionsModal from './ExamInstructionsModal';

export default function ExamHeader({ examName, timeRemaining, onSubmit, user, instructions, onToggleSidebar, onShowInstructions }) {

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
                        className="btn btn-sm btn-outline-light me-2 d-md-none"
                        onClick={onToggleSidebar}
                        style={{ border: '1px solid rgba(255,255,255,0.3)' }}
                    >
                        <FiMenu size={18} />
                    </button>
                    <button
                        className="btn btn-sm btn-outline-light me-3 d-flex align-items-center d-none d-md-flex"
                        onClick={onShowInstructions}
                        title="View Instructions"
                        style={{ border: '1px solid rgba(255,255,255,0.3)' }}
                    >
                        <i className="feather-info me-2"></i> Instructions
                    </button>
                    <h5 className="mb-0 text-truncate" style={{ fontSize: 'clamp(14px, 4vw, 18px)', fontWeight: '600', maxWidth: '200px' }}>
                        {examName}
                    </h5>
                </div>

                <div className="exam-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {/* User Info - Desktop Only */}
                    {user && (
                        <div className="d-none d-md-flex align-items-center me-2 user-info-header">
                            <div className="bg-white rounded-circle d-flex align-items-center justify-content-center text-primary fw-bold me-2" style={{ width: '35px', height: '35px', fontSize: '14px', overflow: 'hidden' }}>
                                {user.profileImage ? (
                                    <img src={user.profileImage} alt={user.name} className="w-100 h-100" style={{ objectFit: 'cover' }} />
                                ) : (
                                    (user.name?.charAt(0) || 'U').toUpperCase()
                                )}
                            </div>
                            <span className="fw-medium d-none d-lg-block text-white" style={{ fontSize: '14px' }}>{user.name}</span>
                        </div>
                    )}

                    <div className="timer" style={{
                        background: 'rgba(255,255,255,0.2)',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'white',
                        minWidth: '60px',
                        textAlign: 'center',
                        whiteSpace: 'nowrap'
                    }}>
                        <span className="d-none d-md-inline">Time Left - </span>{formatTime(timeRemaining)}
                    </div>

                    <button
                        className="btn btn-light btn-sm"
                        onClick={onSubmit}
                        style={{
                            fontWeight: '600',
                            fontSize: '12px',
                            padding: '6px 12px'
                        }}
                    >
                        SUBMIT
                    </button>
                </div>
            </div>
        </>
    );
}
