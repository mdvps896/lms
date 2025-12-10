'use client'

import React from 'react'

const UploadProgress = ({ fileName, progress, isChunked, currentChunk, totalChunks }) => {
    if (!fileName) return null

    return (
        <div className="upload-progress-overlay">
            <div className="upload-progress-modal">
                <div className="card shadow">
                    <div className="card-body p-4">
                        <div className="d-flex align-items-center mb-3">
                            <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <h6 className="mb-0">
                                {isChunked ? '📦 Uploading Large File (Chunked)' : '📤 Uploading File'}
                            </h6>
                        </div>
                        
                        <div className="mb-2">
                            <small className="text-muted">File: {fileName}</small>
                        </div>
                        
                        {isChunked && (
                            <div className="mb-2">
                                <small className="text-info">
                                    🔄 Processing chunk {currentChunk} of {totalChunks}
                                </small>
                            </div>
                        )}
                        
                        <div className="progress mb-2" style={{ height: '8px' }}>
                            <div 
                                className="progress-bar progress-bar-striped progress-bar-animated" 
                                role="progressbar" 
                                style={{ width: `${progress}%` }}
                                aria-valuenow={progress} 
                                aria-valuemin="0" 
                                aria-valuemax="100"
                            ></div>
                        </div>
                        
                        <div className="text-center">
                            <small className="text-muted">{Math.round(progress)}% Complete</small>
                        </div>
                        
                        {isChunked && (
                            <div className="mt-2">
                                <small className="text-success">
                                    ✨ Enhanced upload system - no size limits!
                                </small>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                .upload-progress-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                }
                
                .upload-progress-modal {
                    min-width: 400px;
                    max-width: 500px;
                }
                
                @media (max-width: 576px) {
                    .upload-progress-modal {
                        min-width: 90%;
                        margin: 0 20px;
                    }
                }
            `}</style>
        </div>
    )
}

export default UploadProgress