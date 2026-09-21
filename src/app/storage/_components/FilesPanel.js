'use client'
import React from 'react'
import MediaGrid from '@/components/storage/MediaGrid'
import FileUpload from '@/components/storage/FileUpload'
import FileFilter from '@/components/storage/FileFilter'
import RecordingStats from '@/components/storage/RecordingStats'
import StorageSidebar from '@/components/storage/StorageSidebar'
import ExamRecordingBanner from './ExamRecordingBanner'
import StoragePagination from './StoragePagination'

// Renders the "files" storage mode: sidebar filters + upload/list/pagination card.
const FilesPanel = ({ data }) => {
    const {
        files,
        loading,
        filteredFiles,
        viewMode,
        setViewMode,
        currentPage,
        itemsPerPage,
        filters,
        setFilters,
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
    } = data

    return (
        <div className="row">
            {/* Sidebar Column */}
            <div className="col-lg-3 col-xl-2 d-none d-lg-block">
                <StorageSidebar
                    filters={filters}
                    setFilters={setFilters}
                    totalFiles={files.length}
                    storageStatus={storageStatus}
                />
            </div>

            {/* Main Content Column */}
            <div className="col-lg-9 col-xl-10">
                <div className="card">
                    <div className="card-body">
                        <FileUpload onUploadComplete={() => { fetchFiles(); fetchStorageStatus(); }} />

                        {/* Exam Recording Info Banner - Only show if not filtering or specific exam recording filter */}
                        <ExamRecordingBanner filters={filters} files={files} />

                        <RecordingStats files={files} />

                        <FileFilter
                            filters={filters}
                            setFilters={setFilters}
                            totalFiles={files.length}
                            filteredCount={filteredFiles.length}
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                            itemsPerPage={itemsPerPage}
                            onItemsPerPageChange={handleItemsPerPageChange}
                        />

                        <MediaGrid
                            files={currentFiles}
                            loading={loading}
                            onDelete={handleDelete}
                            onBulkDelete={handleBulkDelete}
                            onRefresh={fetchFiles}
                            viewMode={viewMode}
                        />

                        <StoragePagination
                            loading={loading}
                            filteredFiles={filteredFiles}
                            itemsPerPage={itemsPerPage}
                            indexOfFirstItem={indexOfFirstItem}
                            indexOfLastItem={indexOfLastItem}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FilesPanel
