'use client'
import React, { useState, useEffect } from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import MediaGrid from '@/components/storage/MediaGrid'
import FileUpload from '@/components/storage/FileUpload'
import FileFilter from '@/components/storage/FileFilter'
import RecordingStats from '@/components/storage/RecordingStats'
import StorageSidebar from '@/components/storage/StorageSidebar'
import Header from '@/components/shared/header/Header'
import NavigationManu from '@/components/shared/navigationMenu/NavigationMenu'
import SupportDetails from '@/components/supportDetails'
import ProtectedRoute from '@/components/shared/ProtectedRoute'
import UserMediaGrid from '@/components/storage/UserMediaGrid'

const StoragePage = () => {
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [filteredFiles, setFilteredFiles] = useState([])
    const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(24) // 24 items per page for grid, adjustable
    const [filters, setFilters] = useState({
        type: 'all',
        search: '',
        dateRange: null,
        sort: 'date-new'
    })
    const [deleting, setDeleting] = useState(false)
    const [storageMode, setStorageMode] = useState('files') // 'files' or 'users'

    // Fetch files from API
    const fetchFiles = async () => {
        setLoading(true)
        try {
            // Add timestamp and headers to prevent caching
            const response = await fetch(`/api/storage/files?t=${Date.now()}`, {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            })
            const data = await response.json()
            if (data.success) {
                setFiles(data.files)
                setFilteredFiles(data.files)
            }
        } catch (error) {
            console.error('Error fetching files:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (storageMode === 'files') {
            fetchFiles()
        }
    }, [storageMode])

    // Apply filters
    useEffect(() => {
        let filtered = [...files]

        // Filter by type
        if (filters.type !== 'all') {
            filtered = filtered.filter(file => {
                // For exam recordings, check category first
                if (filters.type === 'exam-recording') {
                    return file.category === 'exam-recording'
                }

                const fileType = file.type || getFileType(file.name)
                return fileType === filters.type
            })
        }

        // Filter by search
        if (filters.search) {
            filtered = filtered.filter(file => {
                const searchTerm = filters.search.toLowerCase()
                return (
                    file.name.toLowerCase().includes(searchTerm) ||
                    (file.examName && file.examName.toLowerCase().includes(searchTerm)) ||
                    (file.studentName && file.studentName.toLowerCase().includes(searchTerm)) ||
                    (file.recordingType && file.recordingType.toLowerCase().includes(searchTerm)) ||
                    (file.recordingId && file.recordingId.toLowerCase().includes(searchTerm)) ||
                    (file.cameraRecordingId && file.cameraRecordingId.toLowerCase().includes(searchTerm)) ||
                    (file.screenRecordingId && file.screenRecordingId.toLowerCase().includes(searchTerm))
                )
            })
        }

        // Filter by date range
        if (filters.dateRange) {
            filtered = filtered.filter(file => {
                const fileDate = new Date(file.createdAt)
                return fileDate >= filters.dateRange.start && fileDate <= filters.dateRange.end
            })
        }

        // Sort files
        if (filters.sort) {
            filtered = [...filtered].sort((a, b) => {
                switch (filters.sort) {
                    case 'name-asc':
                        return a.name.localeCompare(b.name)
                    case 'name-desc':
                        return b.name.localeCompare(a.name)
                    case 'date-new':
                        return new Date(b.createdAt) - new Date(a.createdAt)
                    case 'date-old':
                        return new Date(a.createdAt) - new Date(b.createdAt)
                    case 'size-large':
                        return (b.size || 0) - (a.size || 0)
                    case 'size-small':
                        return (a.size || 0) - (b.size || 0)
                    default:
                        return 0
                }
            })
        }

        setFilteredFiles(filtered)
        setCurrentPage(1) // Reset to first page when filters change
    }, [filters, files])

    const getFileType = (filename) => {
        const ext = filename.split('.').pop().toLowerCase()
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image'
        if (['mp4', 'webm', 'avi', 'mov'].includes(ext)) return 'video'
        if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio'
        if (['pdf'].includes(ext)) return 'pdf'
        return 'other'
    }

    const handleDelete = async (filePathOrPublicId, resourceType = null, source = null) => {
        try {
            setDeleting(true)
            const isCloudinary = source === 'cloudinary'

            const response = await fetch('/api/storage/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filePath: filePathOrPublicId,
                    publicId: isCloudinary || resourceType ? filePathOrPublicId : undefined,
                    resourceType: resourceType,
                    local: isCloudinary ? false : undefined
                })
            })

            const data = await response.json()

            if (!data.success) {
                throw new Error(data.message || 'Failed to delete file')
            }

            // Refresh file list on success
            await fetchFiles()
            return data
        } catch (error) {
            console.error('Error deleting file:', error)
            throw error // Re-throw to let FileCard handle the error display
        } finally {
            setDeleting(false)
        }
    }

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const currentFiles = filteredFiles.slice(indexOfFirstItem, indexOfLastItem)
    const totalPages = Math.ceil(filteredFiles.length / itemsPerPage)

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <ProtectedRoute>
            <Header />
            <NavigationManu />
            <main className="nxl-container">
                {/* Deleting Overlay */}
                {deleting && (
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
                )}
                <div className="nxl-content">
                    <PageHeader
                        title="Media & Storage"
                        breadcrumb={[
                            { name: 'Dashboard', path: '/' },
                            { name: 'Media & Storage' }
                        ]}
                    >
                        <div className="d-flex gap-2">
                            <div className="btn-group" role="group">
                                <button
                                    type="button"
                                    className={`btn ${storageMode === 'files' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setStorageMode('files')}
                                >
                                    <i className="fas fa-folder me-2"></i>All Files
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${storageMode === 'users' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setStorageMode('users')}
                                >
                                    <i className="fas fa-users me-2"></i>User View
                                </button>
                            </div>

                            {storageMode === 'files' && (
                                <button
                                    className="btn btn-light d-flex align-items-center gap-2"
                                    onClick={fetchFiles}
                                    disabled={loading}
                                >
                                    <i className={`fas fa-sync ${loading ? 'fa-spin' : ''}`}></i>
                                </button>
                            )}
                        </div>
                    </PageHeader>

                    {storageMode === 'files' ? (
                        <div className="row">
                            {/* Sidebar Column */}
                            <div className="col-lg-3 col-xl-2 d-none d-lg-block">
                                <StorageSidebar
                                    filters={filters}
                                    setFilters={setFilters}
                                    totalFiles={files.length}
                                />
                            </div>

                            {/* Main Content Column */}
                            <div className="col-lg-9 col-xl-10">
                                <div className="card">
                                    <div className="card-body">
                                        <FileUpload onUploadComplete={fetchFiles} />

                                        {/* Exam Recording Info Banner - Only show if not filtering or specific exam recording filter */}
                                        {(filters.type === 'all' || filters.type === 'exam-recording') && files.some(file => file.category?.includes('exam')) && (
                                            <div className="alert alert-info border-0 mb-4">
                                                <div className="d-flex align-items-start">
                                                    <div className="me-3">
                                                        <i className="fas fa-info-circle fa-lg text-primary"></i>
                                                    </div>
                                                    <div>
                                                        <h6 className="alert-heading mb-2">📹 Exam Recording Information</h6>
                                                        <p className="mb-2">
                                                            Each exam creates <strong>2 separate recordings</strong> for comprehensive proctoring:
                                                        </p>
                                                        <ul className="mb-2 ps-3">
                                                            <li><strong>📹 Camera Recording</strong> - Records your face and voice for identity verification</li>
                                                            <li><strong>🖥️ Screen Recording</strong> - Records your screen activity during the exam</li>
                                                        </ul>
                                                        <small className="text-muted">
                                                            This dual recording system ensures exam integrity and security. Both recordings are automatically saved to local storage.
                                                        </small>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <RecordingStats files={files} />

                                        <FileFilter
                                            filters={filters}
                                            setFilters={setFilters}
                                            totalFiles={files.length}
                                            filteredCount={filteredFiles.length}
                                            viewMode={viewMode}
                                            setViewMode={setViewMode}
                                        />

                                        <MediaGrid
                                            files={currentFiles}
                                            loading={loading}
                                            onDelete={handleDelete}
                                            onRefresh={fetchFiles}
                                            viewMode={viewMode}
                                        />

                                        {/* Pagination */}
                                        {!loading && filteredFiles.length > itemsPerPage && (
                                            <div className="d-flex justify-content-between align-items-center mt-4">
                                                <div className="text-muted">
                                                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredFiles.length)} of {filteredFiles.length} files
                                                </div>
                                                <nav>
                                                    <ul className="pagination mb-0">
                                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                                            <button
                                                                className="page-link"
                                                                onClick={() => handlePageChange(currentPage - 1)}
                                                                disabled={currentPage === 1}
                                                            >
                                                                Previous
                                                            </button>
                                                        </li>

                                                        {[...Array(totalPages)].map((_, index) => {
                                                            const pageNumber = index + 1
                                                            if (
                                                                pageNumber === 1 ||
                                                                pageNumber === totalPages ||
                                                                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                                                            ) {
                                                                return (
                                                                    <li key={pageNumber} className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}>
                                                                        <button
                                                                            className="page-link"
                                                                            onClick={() => handlePageChange(pageNumber)}
                                                                        >
                                                                            {pageNumber}
                                                                        </button>
                                                                    </li>
                                                                )
                                                            } else if (
                                                                pageNumber === currentPage - 2 ||
                                                                pageNumber === currentPage + 2
                                                            ) {
                                                                return <li key={pageNumber} className="page-item disabled"><span className="page-link">...</span></li>
                                                            }
                                                            return null
                                                        })}

                                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                                            <button
                                                                className="page-link"
                                                                onClick={() => handlePageChange(currentPage + 1)}
                                                                disabled={currentPage === totalPages}
                                                            >
                                                                Next
                                                            </button>
                                                        </li>
                                                    </ul>
                                                </nav>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <UserMediaGrid />
                    )}
                </div>
            </main>
            <SupportDetails />
        </ProtectedRoute>
    )
}

export default StoragePage

