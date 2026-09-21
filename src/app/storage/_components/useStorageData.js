'use client'
import { useState, useEffect } from 'react'
import { filterAndSortFiles } from './storageUtils'

// Encapsulates all state, data fetching, filtering and pagination logic
// for the storage page's "files" mode.
export default function useStorageData(storageMode) {
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [filteredFiles, setFilteredFiles] = useState([])
    const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(50) // Default to 50 items per page
    const [filters, setFilters] = useState({
        type: 'all',
        search: '',
        dateRange: null,
        sort: 'date-new'
    })
    const [deleting, setDeleting] = useState(false)
    const [storageStatus, setStorageStatus] = useState(null)

    // Fetch storage status
    const fetchStorageStatus = async () => {
        try {
            const response = await fetch('/api/storage/status')
            const data = await response.json()
            if (data.success) {
                setStorageStatus(data.data)
            }
        } catch (error) {
            console.error('Error fetching storage status:', error)
        }
    }

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
            fetchStorageStatus()
        }
    }, [storageMode])

    // Apply filters
    useEffect(() => {
        const filtered = filterAndSortFiles(files, filters)
        setFilteredFiles(filtered)
        setCurrentPage(1) // Reset to first page when filters change
    }, [filters, files])

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
            await fetchStorageStatus()
            return data
        } catch (error) {
            console.error('Error deleting file:', error)
            throw error // Re-throw to let FileCard handle the error display
        } finally {
            setDeleting(false)
        }
    }

    const handleBulkDelete = async (items) => {
        try {
            setDeleting(true)
            const payloadItems = items.map(({ path, publicId, resourceType, source }) => ({
                path,
                publicId: source === 'cloudinary' || resourceType ? (publicId || path) : publicId,
                isCloudinary: source === 'cloudinary'
            }))

            const response = await fetch('/api/storage/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: payloadItems })
            })

            const data = await response.json()

            await fetchFiles()
            await fetchStorageStatus()

            return data
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

    const handleItemsPerPageChange = (count) => {
        setItemsPerPage(parseInt(count))
        setCurrentPage(1) // Reset to first page
    }

    return {
        files,
        loading,
        filteredFiles,
        viewMode,
        setViewMode,
        currentPage,
        itemsPerPage,
        filters,
        setFilters,
        deleting,
        storageStatus,
        fetchFiles,
        fetchStorageStatus,
        handleDelete,
        handleBulkDelete,
        indexOfLastItem,
        indexOfFirstItem,
        currentFiles,
        totalPages,
        handlePageChange,
        handleItemsPerPageChange
    }
}
