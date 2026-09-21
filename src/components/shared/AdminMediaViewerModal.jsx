'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { FiX } from 'react-icons/fi'

// Videos are token-gated exactly like PDFs (see /api/storage/pdf-token +
// /api/storage/secure-file) — a bare fileUrl with no token always 404s. This
// mirrors AdminPdfViewerModal's resolveSecurePdfUrl.
async function resolveSecureVideoUrl(filePath) {
    const res = await fetch('/api/storage/pdf-token', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath }),
    })
    if (!res.ok) throw new Error('Not authorized to view this file')
    const data = await res.json()
    if (!data?.success || !data?.token) throw new Error('Not authorized to view this file')
    return `/api/storage/secure-file?path=${encodeURIComponent('/' + data.path)}&token=${encodeURIComponent(data.token)}`
}

// View-only modal for images/videos in the admin Media Storage panel — used
// instead of opening the secure file URL in a new tab, so nothing is ever
// handed to the browser as a directly navigable/downloadable link.
const AdminMediaViewerModal = ({ isOpen, onClose, fileUrl, filePath, fileTitle, mediaType }) => {
    const [resolvedUrl, setResolvedUrl] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!isOpen) return
        setError(null)

        if (mediaType === 'video' && filePath) {
            let cancelled = false
            setResolvedUrl(null)
            resolveSecureVideoUrl(filePath)
                .then((url) => { if (!cancelled) setResolvedUrl(url) })
                .catch((err) => { if (!cancelled) setError(err.message || 'Failed to load video') })
            return () => { cancelled = true }
        }

        setResolvedUrl(fileUrl)
    }, [isOpen, mediaType, filePath, fileUrl])

    if (!isOpen) return null
    if (typeof document === 'undefined') return null

    return createPortal(
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 2000,
                display: 'flex', flexDirection: 'column',
                background: 'rgba(0,0,0,0.92)'
            }}
        >
            <div style={{
                background: '#323639', color: '#e8eaed', height: '48px', flexShrink: 0,
                display: 'flex', alignItems: 'center', padding: '0 12px', gap: '8px',
                fontSize: '14px', userSelect: 'none'
            }}>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {fileTitle || 'Preview'}
                </span>
                <button
                    onClick={onClose}
                    title="Close"
                    style={{
                        background: 'transparent', border: 'none', color: '#e8eaed',
                        width: '32px', height: '32px', borderRadius: '4px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', flexShrink: 0
                    }}
                >
                    <FiX size={20} />
                </button>
            </div>

            <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                {error ? (
                    <p style={{ color: '#e8eaed' }}>{error}</p>
                ) : mediaType === 'video' ? (
                    resolvedUrl && (
                        <video
                            src={resolvedUrl}
                            controls
                            autoPlay
                            controlsList="nodownload noremoteplayback"
                            onContextMenu={(e) => e.preventDefault()}
                            style={{ maxWidth: '100%', maxHeight: '100%' }}
                        />
                    )
                ) : (
                    <img
                        src={resolvedUrl}
                        alt={fileTitle || 'Preview'}
                        onContextMenu={(e) => e.preventDefault()}
                        draggable={false}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', userSelect: 'none' }}
                    />
                )}
            </div>
        </div>,
        document.body
    )
}

export default AdminMediaViewerModal
