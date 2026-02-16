'use client'

import React, { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import { FiFile, FiImage, FiVideo, FiSearch, FiCheck } from 'react-icons/fi'

const MediaLibraryModal = ({ isOpen, onClose, onSelect, fileType = 'all' }) => {
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState('all') // 'all', 'image', 'video', 'document'

    useEffect(() => {
        if (isOpen) {
            fetchMedia()
            // Set initial filter based on requested fileType
            if (fileType === 'video') setFilterType('video')
            else if (fileType === 'document') setFilterType('document')
            else setFilterType('all')

            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => { document.body.style.overflow = 'unset' }
    }, [isOpen, fileType])

    const fetchMedia = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/media')
            const data = await res.json()
            if (data.success) {
                setFiles(data.files)
            } else {
                console.error('Failed to load media:', data.message)
            }
        } catch (error) {
            console.error('Error loading media:', error)
            Swal.fire('Error', 'Failed to load media library', 'error')
        } finally {
            setLoading(false)
        }
    }

    const filteredFiles = files.filter(file => {
        const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesType = filterType === 'all' || file.type === filterType
        return matchesSearch && matchesType
    })

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const getIcon = (type) => {
        switch (type) {
            case 'image': return <FiImage size={24} className="text-primary" />
            case 'video': return <FiVideo size={24} className="text-danger" />
            default: return <FiFile size={24} className="text-secondary" />
        }
    }

    if (!isOpen) return null

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }} tabIndex="-1">
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content shadow-lg border-0 h-100">
                    <div className="modal-header bg-light">
                        <h5 className="modal-title fw-bold">Media Library</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>

                    <div className="modal-body p-0 d-flex flex-column" style={{ height: '70vh' }}>
                        {/* Toolbar */}
                        <div className="p-3 border-bottom bg-white d-flex flex-wrap gap-3 align-items-center justify-content-between">
                            <div className="d-flex gap-2">
                                <button className={`btn btn-sm ${filterType === 'all' ? 'btn-dark' : 'btn-outline-secondary'}`} onClick={() => setFilterType('all')}>All</button>
                                <button className={`btn btn-sm ${filterType === 'image' ? 'btn-dark' : 'btn-outline-secondary'}`} onClick={() => setFilterType('image')}>Images</button>
                                <button className={`btn btn-sm ${filterType === 'video' ? 'btn-dark' : 'btn-outline-secondary'}`} onClick={() => setFilterType('video')}>Videos</button>
                                <button className={`btn btn-sm ${filterType === 'document' ? 'btn-dark' : 'btn-outline-secondary'}`} onClick={() => setFilterType('document')}>Docs</button>
                            </div>
                            <div className="input-group input-group-sm" style={{ maxWidth: '300px' }}>
                                <span className="input-group-text bg-light border-end-0"><FiSearch /></span>
                                <input
                                    type="text"
                                    className="form-control border-start-0"
                                    placeholder="Search files..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="flex-grow-1 overflow-auto p-3 bg-light">
                            {loading ? (
                                <div className="text-center p-5">
                                    <div className="spinner-border text-primary" role="status"></div>
                                    <p className="mt-2 text-muted">Loading files...</p>
                                </div>
                            ) : filteredFiles.length === 0 ? (
                                <div className="text-center p-5 text-muted">
                                    <FiFile size={48} className="mb-3 opacity-50" />
                                    <h5>No files found</h5>
                                    <p>Try adjusting your filters or search terms</p>
                                </div>
                            ) : (
                                <div className="row g-3">
                                    {filteredFiles.map((file, index) => (
                                        <div key={index} className="col-6 col-sm-4 col-md-3 col-lg-2">
                                            <div
                                                className="card h-100 border shadow-sm cursor-pointer file-card"
                                                onClick={() => onSelect(file)}
                                                style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                                                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                                onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                                            >
                                                <div className="card-body p-3 text-center d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '120px' }}>
                                                    {file.type === 'image' ? (
                                                        <img src={file.path} alt={file.name} className="img-fluid mb-2 rounded" style={{ maxHeight: '80px', objectFit: 'contain' }} loading="lazy" />
                                                    ) : (
                                                        <div className="mb-2 p-3 bg-light rounded-circle">
                                                            {getIcon(file.type)}
                                                        </div>
                                                    )}
                                                    <p className="card-text small text-truncate w-100 mb-1" title={file.name}>{file.name}</p>
                                                    <span className="badge bg-light text-dark border">{formatSize(file.size)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MediaLibraryModal
