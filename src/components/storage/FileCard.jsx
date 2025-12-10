'use client'

import React, { useState } from 'react'
import Swal from 'sweetalert2'
import Image from 'next/image'
import { Eye, Copy, Trash2, PlayCircle, Image as ImageIcon, Video, Music, FileText, File } from 'feather-icons-react'

const FileCard = ({ file, onDelete, onRefresh }) => {
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
            text: `Are you sure you want to delete "${file.name}"?${file.source === 'cloudinary' ? ' (from Cloudinary)' : ''}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    // Pass publicId for Cloudinary files
                    await onDelete(file.source === 'cloudinary' ? file.publicId : file.path, file.source === 'cloudinary' ? file.resourceType : null)
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

    const renderThumbnail = () => {
        if (file.type === 'image' && !imageError) {
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
        <div className="card h-100 file-card">
            <div style={{ cursor: 'pointer' }} onClick={handleView}>
                {renderThumbnail()}
            </div>
            <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0 text-truncate flex-grow-1" title={file.name}>
                        {file.name}
                    </h6>
                    {file.source === 'cloudinary' && (
                        <span className="badge bg-info text-white ms-2" style={{ fontSize: '0.7rem' }}>
                            ☁️ Cloud
                        </span>
                    )}
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-muted">{formatFileSize(file.size)}</small>
                    <small className="text-muted">{formatDate(file.createdAt)}</small>
                </div>
                {file.folder && file.folder !== 'root' && (
                    <div className="mb-2">
                        <small className="badge bg-secondary" style={{ fontSize: '0.65rem' }}>
                            📁 {file.folder}
                        </small>
                    </div>
                )}
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-sm btn-outline-primary flex-fill"
                        onClick={handleView}
                        title="View File"
                    >
                        <Eye size={14} />
                    </button>
                    <button
                        className="btn btn-sm btn-outline-info flex-fill"
                        onClick={handleCopyLink}
                        title="Copy Link"
                    >
                        <Copy size={14} />
                    </button>
                    <button
                        className="btn btn-sm btn-outline-danger flex-fill"
                        onClick={handleDelete}
                        title="Delete File"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <style jsx>{`
                .file-card {
                    transition: all 0.3s ease;
                }
                .file-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                }
            `}</style>
        </div>
    )
}

export default FileCard
