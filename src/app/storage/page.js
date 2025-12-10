'use client'

import React, { useState, useEffect } from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import MediaGrid from '@/components/storage/MediaGrid'
import FileUpload from '@/components/storage/FileUpload'
import FileFilter from '@/components/storage/FileFilter'
import Header from '@/components/shared/header/Header'
import NavigationManu from '@/components/shared/navigationMenu/NavigationMenu'
import SupportDetails from '@/components/supportDetails'
import ProtectedRoute from '@/components/shared/ProtectedRoute'

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
        dateRange: null
    })

    // Fetch files from API
    const fetchFiles = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/storage/files')
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
        fetchFiles()
    }, [])

    // Apply filters
    useEffect(() => {
        let filtered = [...files]

        // Filter by type
        if (filters.type !== 'all') {
            filtered = filtered.filter(file => {
                const fileType = file.type || getFileType(file.name)
                return fileType === filters.type
            })
        }

        // Filter by search
        if (filters.search) {
            filtered = filtered.filter(file =>
                file.name.toLowerCase().includes(filters.search.toLowerCase())
            )
        }

        // Filter by date range
        if (filters.dateRange) {
            filtered = filtered.filter(file => {
                const fileDate = new Date(file.createdAt)
                return fileDate >= filters.dateRange.start && fileDate <= filters.dateRange.end
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

    const handleDelete = async (filePathOrPublicId, resourceType = null) => {
        try {
            const response = await fetch('/api/storage/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    filePath: filePathOrPublicId,
                    publicId: resourceType ? filePathOrPublicId : undefined,
                    resourceType: resourceType 
                })
            })
            const data = await response.json()
            if (data.success) {
                fetchFiles()
                alert('File deleted successfully')
            } else {
                alert(data.message || 'Failed to delete file')
            }
        } catch (error) {
            console.error('Error deleting file:', error)
            alert('Error deleting file')
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
                <div className="nxl-content">
                    <PageHeader
                        title="Media & Storage"
                        breadcrumb={[
                            { name: 'Dashboard', path: '/' },
                            { name: 'Media & Storage' }
                        ]}
                    />

                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-body">
                                    <FileUpload onUploadComplete={fetchFiles} />
                                    
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
                                                        // Show first page, last page, current page, and pages around current
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
                </div>
            </main>
            <SupportDetails />
        </ProtectedRoute>
    )
}

export default StoragePage
