'use client'

import React, { useState } from 'react'
import { Grid, Image, Video, Music, FileText, File, MoreHorizontal, Search, X, ChevronUp, ChevronDown, List } from 'feather-icons-react'

const FileFilter = ({ filters, setFilters, totalFiles, filteredCount, viewMode, setViewMode }) => {
    const [showAdvanced, setShowAdvanced] = useState(false)

    const fileTypes = [
        { value: 'all', label: 'All Files', icon: Grid },
        { value: 'image', label: 'Images', icon: Image },
        { value: 'video', label: 'Videos', icon: Video },
        { value: 'audio', label: 'Audio', icon: Music },
        { value: 'pdf', label: 'PDF', icon: FileText },
        { value: 'document', label: 'Documents', icon: File },
        { value: 'exam-recording', label: 'Exam Recordings', icon: Video },
        { value: 'other', label: 'Other', icon: MoreHorizontal }
    ]

    const sortOptions = [
        { value: 'name-asc', label: 'Name (A-Z)' },
        { value: 'name-desc', label: 'Name (Z-A)' },
        { value: 'date-new', label: 'Newest First' },
        { value: 'date-old', label: 'Oldest First' },
        { value: 'size-large', label: 'Largest First' },
        { value: 'size-small', label: 'Smallest First' }
    ]

    const handleTypeFilter = (type) => {
        setFilters({ ...filters, type })
    }

    const handleSearch = (e) => {
        setFilters({ ...filters, search: e.target.value })
    }

    const handleSortChange = (e) => {
        setFilters({ ...filters, sort: e.target.value })
    }

    const clearFilters = () => {
        setFilters({
            type: 'all',
            search: '',
            sort: 'name-asc'
        })
    }

    return (
        <div className="mt-4">
            {/* Search Bar and View Toggle */}
            <div className="row mb-3">
                <div className="col-md-8">
                    <div className="input-group">
                        <span className="input-group-text">
                            <Search size={16} />
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search by name, exam, student, or recording ID (e.g., sc-3hr-j8e-#@-1)..."
                            value={filters.search}
                            onChange={handleSearch}
                        />
                        {filters.search && (
                            <button
                                className="btn btn-outline-secondary"
                                onClick={() => setFilters({ ...filters, search: '' })}
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
                <div className="col-md-4 d-flex gap-2">
                    <div className="btn-group">
                        <button
                            className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setViewMode('grid')}
                            title="Grid View"
                        >
                            <Grid size={16} />
                        </button>
                        <button
                            className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setViewMode('list')}
                            title="List View"
                        >
                            <List size={16} />
                        </button>
                    </div>
                    <button
                        className="btn btn-outline-primary flex-grow-1"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                        {showAdvanced ? <ChevronUp size={16} className="me-2" /> : <ChevronDown size={16} className="me-2" />}
                        {showAdvanced ? 'Hide' : 'Show'} Filters
                    </button>
                </div>
            </div>

            {/* File Type Filter */}
            <div className="d-flex flex-wrap gap-2 mb-3">
                {fileTypes.map(type => {
                    const IconComponent = type.icon
                    return (
                        <button
                            key={type.value}
                            className={`btn ${filters.type === type.value ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => handleTypeFilter(type.value)}
                        >
                            <IconComponent size={16} className="me-2" />
                            {type.label}
                        </button>
                    )
                })}
            </div>

            {/* Advanced Filters */}
            {showAdvanced && (
                <div className="card mb-3">
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label">Sort By</label>
                                <select
                                    className="form-select"
                                    value={filters.sort || 'name-asc'}
                                    onChange={handleSortChange}
                                >
                                    {sortOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-6 d-flex align-items-end">
                                <button
                                    className="btn btn-outline-danger w-100"
                                    onClick={clearFilters}
                                >
                                    <X size={16} className="me-2" />
                                    Clear All Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Results Count */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <span className="text-muted">
                        Showing {filteredCount} of {totalFiles} files
                    </span>
                </div>
                {(filters.search || filters.type !== 'all') && (
                    <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={clearFilters}
                    >
                        Reset Filters
                    </button>
                )}
            </div>

            <hr />
        </div>
    )
}

export default FileFilter
