'use client'

import React from 'react'
import FileCard from './FileCard'
import FileListItem from './FileListItem'
import StorageSkeleton from './StorageSkeleton'
import { Folder } from 'feather-icons-react'

const MediaGrid = ({ files, loading, onDelete, onRefresh, viewMode = 'grid' }) => {
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
        <div className="row g-3 mt-3">
            {files.map((file) => (
                <div key={file.path || file.publicId || file.url || file._id} className="col-home-5 col-xl-3 col-lg-4 col-md-6 mb-3">
                    <FileCard
                        file={file}
                        onDelete={onDelete}
                        onRefresh={onRefresh}
                    />
                </div>
            ))}
        </div>
    )
}

export default MediaGrid
