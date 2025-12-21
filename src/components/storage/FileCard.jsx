'use client'

import React, { useState } from 'react'
import Swal from 'sweetalert2'
import Image from 'next/image'
import { Eye, Copy, Trash2, PlayCircle, Image as ImageIcon, Video, Music, FileText, File } from 'feather-icons-react'

const FileCard = ({ file, onDelete, onRefresh, ...props }) => {
    const [imageError, setImageError] = useState(false)

    const getFileIcon = (type) => {
        switch (type) {
            case 'image':
                return ImageIcon
            case 'video':
                return Video
            case 'audio':
                return Music
            case 'pdf':
                return FileText
            case 'document':
                return File
            default:
                return File
        }
    }

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const getSecureUrl = (filePath) => {
        // Return the URL as-is
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
            return filePath
        }
        // Ensure path starts with /
        const normalizedPath = filePath.startsWith('/') ? filePath : '/' + filePath
        return `/api/storage/secure-file?path=${encodeURIComponent(normalizedPath)}`
    }

    const handleCopyLink = () => {
        const fullUrl = `${window.location.origin}${getSecureUrl(file.path)}`
        navigator.clipboard.writeText(fullUrl)
        Swal.fire({
            icon: 'success',
            title: 'Link Copied!',
            text: 'Secure file link copied to clipboard',
            timer: 1500,
            showConfirmButton: false
        })
    }

    const handleView = () => {
        if (file.type === 'image' || file.type === 'video' || file.type === 'pdf') {
            window.open(getSecureUrl(file.path), '_blank')
        } else {
            handleCopyLink()
        }
    }

    const handleDelete = () => {
        Swal.fire({
            title: 'Delete File?',
            text: `Are you sure you want to delete "${file.name}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    // Special handling for exam recordings
                    if (file.category === 'exam-recording' && file.attemptId && file.recordingType) {
                        console.log('Deleting exam recording:', file)

                        const response = await fetch('/api/exams/delete-recording', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                attemptId: file.attemptId,
                                recordingType: file.recordingType
                            })
                        })

                        const result = await response.json()

                        if (!result.success) {
                            throw new Error(result.message || 'Failed to delete recording')
                        }
                    } else {
                        // For regular files, use the standard delete method
                        // Use publicId if available (for Cloudinary), otherwise path/url
                        const deleteIdentifier = file.publicId || file.path || file.url

                        console.log('Deleting file:', { deleteIdentifier, file })

                        await onDelete(deleteIdentifier, file.resourceType || null, file.source || null)
                    }

                    // Refresh the file list
                    if (onRefresh) {
                        await onRefresh()
                    }

                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'File has been deleted successfully.',
                        timer: 1500,
                        showConfirmButton: false
                    })
                } catch (error) {
                    console.error('Delete error:', error)
                    Swal.fire({
                        icon: 'error',
                        title: 'Failed to delete file',
                        text: error.message || 'An error occurred while deleting the file',
                        footer: 'Check console for more details'
                    })
                }
            }
        })
    }

    const renderThumbnail = () => {
        if (file.type === 'image' && !imageError) {
            // If fluidHeight is enabled, render standard img tag for natural aspect ratio
            if (props.fluidHeight) {
                return (
                    <div style={{ position: 'relative', width: '100%' }}>
                        <img
                            src={getSecureUrl(file.path)}
                            alt={file.name}
                            style={{
                                width: '100%',
                                height: 'auto',
                                display: 'block',
                                objectFit: 'cover'
                            }}
                            onError={() => setImageError(true)}
                        />
                    </div>
                )
            }
            // Default fixed height behavior
            return (
                <div style={{ position: 'relative', width: '100%', height: '150px' }}>
                    <Image
                        src={getSecureUrl(file.path)}
                        alt={file.name}
                        fill
                        style={{ objectFit: 'cover' }}
                        onError={() => setImageError(true)}
                        loader={({ src }) => src}
                        unoptimized
                    />
                </div>
            )
        }

        if (file.type === 'video') {
            return (
                <div style={{ position: 'relative', width: '100%', height: '150px', background: '#000' }}>
                    <video
                        src={getSecureUrl(file.path)}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        muted
                    />
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: 'white'
                    }}>
                        <PlayCircle size={32} />
                    </div>
                </div>
            )
        }

        const IconComponent = getFileIcon(file.type)
        return (
            <div
                className="d-flex align-items-center justify-content-center"
                style={{ height: '150px', background: '#f8f9fa' }}
            >
                <IconComponent size={40} color="#6c757d" />
            </div>
        )
    }

    return (
        <div className={`card file-card ${!props.fluidHeight ? 'h-100' : ''}`}>
            <div className="position-relative thumbnail-container" style={{ cursor: 'pointer' }}>
                {renderThumbnail()}

                {/* Overlay with action buttons */}
                <div className="overlay-actions">
                    <div className="d-flex justify-content-center gap-2">
                        <button
                            className="btn btn-primary btn-sm action-btn"
                            onClick={(e) => { e.stopPropagation(); handleView(); }}
                            title="View File"
                        >
                            <Eye size={16} />
                        </button>
                        <button
                            className="btn btn-info btn-sm action-btn"
                            onClick={(e) => { e.stopPropagation(); handleCopyLink(); }}
                            title="Copy Link"
                        >
                            <Copy size={16} />
                        </button>
                        <button
                            className="btn btn-danger btn-sm action-btn"
                            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                            title="Delete File"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
            <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0 text-truncate flex-grow-1" title={file.name}>
                        {file.name}
                    </h6>
                    <div className="d-flex gap-1">
                        <span className="badge bg-success text-white" style={{ fontSize: '0.7rem' }}>
                            📁 Local
                        </span>
                        {file.category === 'exam-recording' && (
                            <span className="badge bg-primary text-white" style={{ fontSize: '0.7rem' }}>
                                📹 Recording
                            </span>
                        )}
                    </div>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-muted">{formatFileSize(file.size)}</small>
                    <small className="text-muted">{formatDate(file.createdAt)}</small>
                </div>
                {/* Folder and recording metadata */}
                <div className="mb-2">
                    {file.folder && file.folder !== 'root' && (
                        <small className="badge bg-secondary me-2" style={{ fontSize: '0.65rem' }}>
                            📁 {file.folder}
                        </small>
                    )}
                    {file.recordingType && (
                        <small className="badge bg-success me-2" style={{ fontSize: '0.65rem' }}>
                            {file.recordingType === 'camera' ? '📹 Camera' : '🖥️ Screen'}
                        </small>
                    )}
                </div>

                {/* Exam recording details */}
                {file.category === 'exam-recording' && (
                    <div className="mb-2">
                        {file.examName && (
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                <strong>Exam:</strong> {file.examName}
                            </div>
                        )}
                        {file.studentName && (
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                <strong>Student:</strong> {file.studentName}
                            </div>
                        )}
                        {(file.recordingId || file.cameraRecordingId || file.screenRecordingId) && (
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                <strong>Recording ID:</strong>
                                <span className="badge bg-info text-white ms-1" style={{ fontSize: '0.65rem' }}>
                                    {file.recordingId || file.cameraRecordingId || file.screenRecordingId}
                                </span>
                            </div>
                        )}
                    </div>
                )}

            </div>

            <style jsx>{`
                .file-card {
                    transition: all 0.3s ease;
                }
                .file-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                }
                
                .thumbnail-container {
                    position: relative;
                    overflow: hidden;
                }
                
                .overlay-actions {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                    backdrop-filter: blur(2px);
                }
                
                .thumbnail-container:hover .overlay-actions {
                    opacity: 1;
                    visibility: visible;
                }
                
                .action-btn {
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    padding: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    backdrop-filter: blur(10px);
                    transition: all 0.2s ease;
                }
                
                .action-btn:hover {
                    transform: scale(1.1);
                    border-color: rgba(255, 255, 255, 0.6);
                }
                
                .action-btn:active {
                    transform: scale(0.95);
                }
            `}</style>
        </div>
    )
}

export default FileCard
