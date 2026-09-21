'use client'
import React from 'react'

const DeletingOverlay = ({ deleting }) => {
    if (!deleting) return null

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backdropFilter: 'blur(5px)'
        }}>
            <div className="spinner-border text-danger mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
            <h4 className="text-danger fw-bold">Deleting File...</h4>
            <p className="text-muted">Please wait while we remove the file permanently.</p>
        </div>
    )
}

export default DeletingOverlay
