'use client'

import React from 'react'
import Swal from 'sweetalert2'
import { Eye, Copy, Trash2, Image as ImageIcon, Video, Music, FileText, File } from 'feather-icons-react'

const FileListItem = ({ file, onDelete, onRefresh }) => {
    
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
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getSecureUrl = (filePath) => {
        // If it's a Cloudinary URL, return as-is
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
                    await onDelete(file.path)
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'File has been deleted.',
                        timer: 1500,
                        showConfirmButton: false
                    })
                } catch (error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Failed to delete file'
                    })
                }
            }
        })
    }

    const IconComponent = getFileIcon(file.type)

    return (
        <tr className="file-list-item">
            <td>
                <IconComponent size={20} color="#6c757d" />
            </td>
            <td>
                <div className="d-flex align-items-center">
                    {file.type === 'image' && (
                        <img 
                            src={getSecureUrl(file.path)} 
                            alt={file.name}
                            style={{ 
                                width: '40px', 
                                height: '40px', 
                                objectFit: 'cover', 
                                borderRadius: '4px',
                                marginRight: '10px'
                            }}
                            onError={(e) => e.target.style.display = 'none'}
                        />
                    )}
                    <div>
                        <div className="text-truncate" style={{ maxWidth: '300px' }} title={file.name}>
                            {file.name}
                        </div>
                        {/* Exam recording metadata */}
                        {file.category === 'exam-recording' && (
                            <div className="small text-muted">
                                {file.recordingType && (
                                    <span className="badge bg-primary me-1" style={{ fontSize: '0.65rem' }}>
                                        {file.recordingType === 'camera' ? '📹 Camera' : '🖥️ Screen'}
                                    </span>
                                )}
                                {file.examName && (
                                    <span className="me-2">📚 {file.examName}</span>
                                )}
                                {file.studentName && (
                                    <span>👤 {file.studentName}</span>
                                )}
                            </div>
                        )}
                        {/* Source badge */}
                        <div className="mt-1">
                            {file.source === 'cloudinary' && (
                                <span className="badge bg-info text-white me-1" style={{ fontSize: '0.65rem' }}>
                                    ☁️ Cloud
                                </span>
                            )}
                            {file.category === 'exam-recording' && (
                                <span className="badge bg-success text-white" style={{ fontSize: '0.65rem' }}>
                                    📹 Recording
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </td>
            <td>{formatFileSize(file.size)}</td>
            <td className="text-muted">{formatDate(file.createdAt)}</td>
            <td>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={handleView}
                        title="View File"
                    >
                        <Eye size={14} />
                    </button>
                    <button
                        className="btn btn-sm btn-outline-info"
                        onClick={handleCopyLink}
                        title="Copy Link"
                    >
                        <Copy size={14} />
                    </button>
                    <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={handleDelete}
                        title="Delete File"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </td>

            <style jsx>{`
                .file-list-item {
                    transition: background-color 0.2s ease;
                }
                .file-list-item:hover {
                    background-color: #f8f9fa;
                }
            `}</style>
        </tr>
    )
}

export default FileListItem
