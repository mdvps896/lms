'use client'

import React, { useState } from 'react'
import FileCard from './FileCard'
import FileListItem from './FileListItem'
import StorageSkeleton from './StorageSkeleton'
import { Folder, Trash2 } from 'feather-icons-react'
import Swal from 'sweetalert2'

const MediaGrid = ({ files, loading, onDelete, onRefresh, viewMode = 'grid' }) => {
    const [selectedFiles, setSelectedFiles] = useState(new Set())
    const [isDeleting, setIsDeleting] = useState(false)

    const handleSelectFile = (fileId) => {
        const newSelected = new Set(selectedFiles)
        if (newSelected.has(fileId)) {
            newSelected.delete(fileId)
        } else {
            newSelected.add(fileId)
        }
        setSelectedFiles(newSelected)
    }

    const handleSelectAll = () => {
        if (selectedFiles.size === files.length) {
            setSelectedFiles(new Set())
        } else {
            setSelectedFiles(new Set(files.map(f => f.path || f.publicId || f.url || f._id)))
        }
    }

    const handleBulkDelete = async () => {
        if (selectedFiles.size === 0) return

        const result = await Swal.fire({
            title: 'Delete Selected Files?',
            text: `Are you sure you want to delete ${selectedFiles.size} file(s)?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete them!'
        })

        if (result.isConfirmed) {
            setIsDeleting(true)
            let successCount = 0
            let errorCount = 0

            for (const fileId of selectedFiles) {
                try {
                    const file = files.find(f => (f.path || f.publicId || f.url || f._id) === fileId)
                    if (file) {
                        const deleteIdentifier = file.publicId || file.path || file.url
                        await onDelete(deleteIdentifier, file.resourceType || null, file.source || null)
                        successCount++
                    }
                } catch (error) {
                    errorCount++
                }
            }

            setIsDeleting(false)
            setSelectedFiles(new Set())

            if (onRefresh) {
                await onRefresh()
            }

            if (errorCount === 0) {
                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: `${successCount} file(s) deleted successfully.`,
                    timer: 1500,
                    showConfirmButton: false
                })
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'Partially Completed',
                    text: `${successCount} file(s) deleted, ${errorCount} failed.`,
                })
            }
        }
    }
    if (loading) {
        return <StorageSkeleton viewMode={viewMode} />
    }

    if (!files || files.length === 0) {
        return (
            <div className="text-center py-5">
                <div className="mb-3">
                    <Folder size={48} color="#ccc" />
                </div>
                <h5 className="text-muted">No files found</h5>
                <p className="text-muted">Upload files or add files from URL to get started</p>
            </div>
        )
    }

    if (viewMode === 'list') {
        return (
            <div className="table-responsive mt-3">
                <table className="table table-hover">
                    <thead>
                        <tr>
                            <th style={{ width: '50px' }}>Type</th>
                            <th>Name</th>
                            <th style={{ width: '120px' }}>Size</th>
                            <th style={{ width: '150px' }}>Date</th>
                            <th style={{ width: '150px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {files.map((file) => (
                            <FileListItem
                                key={file.path || file.publicId || file.url || file._id}
                                file={file}
                                onDelete={onDelete}
                                onRefresh={onRefresh}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        )
    }

    return (
        <>
            {/* Bulk Actions Bar */}
            {selectedFiles.size > 0 && (
                <div className="alert alert-info d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <strong>{selectedFiles.size}</strong> file(s) selected
                    </div>
                    <button
                        className="btn btn-danger btn-sm d-flex align-items-center gap-2"
                        onClick={handleBulkDelete}
                        disabled={isDeleting}
                    >
                        <Trash2 size={16} />
                        {isDeleting ? 'Deleting...' : 'Delete Selected'}
                    </button>
                </div>
            )}

            {/* Select All Checkbox for Grid View */}
            {viewMode === 'grid' && files.length > 0 && (
                <div className="mb-3">
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="selectAll"
                            checked={selectedFiles.size === files.length && files.length > 0}
                            onChange={handleSelectAll}
                        />
                        <label className="form-check-label" htmlFor="selectAll">
                            Select All ({files.length} files)
                        </label>
                    </div>
                </div>
            )}

            <div className="row g-3 mt-3">
                {files.map((file) => {
                    const fileId = file.path || file.publicId || file.url || file._id
                    return (
                        <div key={fileId} className="col-home-5 col-xl-3 col-lg-4 col-md-6 mb-3">
                            <FileCard
                                file={file}
                                onDelete={onDelete}
                                onRefresh={onRefresh}
                                isSelected={selectedFiles.has(fileId)}
                                onSelect={() => handleSelectFile(fileId)}
                            />
                        </div>
                    )
                })}
            </div>
        </>
    )
}

export default MediaGrid
