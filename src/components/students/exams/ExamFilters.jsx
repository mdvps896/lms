'use client'
import React from 'react'

const ExamFilters = ({ filters, subjects, onFilterChange }) => {

    const handleInputChange = (field, value) => {
        onFilterChange({ [field]: value })
    }

    return (
        <div className="row mb-4">
            <div className="col-12">
                <div className="card">
                    <div className="card-header">
                        <h5 className="card-title mb-0">Filter Exams</h5>
                    </div>
                    <div className="card-body">
                        <div className="row g-3">
                            {/* Status Filter */}
                            <div className="col-md-3">
                                <label className="form-label">Status</label>
                                <select
                                    className="form-select"
                                    value={filters.status}
                                    onChange={(e) => handleInputChange('status', e.target.value)}
                                >
                                    <option value="all">All Status</option>
                                    <option value="current">Current Exams</option>
                                    <option value="upcoming">Upcoming Exams</option>
                                    <option value="completed">Completed Exams</option>
                                    <option value="live">Live Exams</option>
                                </select>
                            </div>

                            {/* Type Filter */}
                            <div className="col-md-3">
                                <label className="form-label">Type</label>
                                <select
                                    className="form-select"
                                    value={filters.type}
                                    onChange={(e) => handleInputChange('type', e.target.value)}
                                >
                                    <option value="all">All Types</option>
                                    <option value="regular">Regular Exams</option>
                                    <option value="live">Live Exams</option>
                                </select>
                            </div>

                            {/* Subject Filter */}
                            <div className="col-md-3">
                                <label className="form-label">Subject</label>
                                <select
                                    className="form-select"
                                    value={filters.subject}
                                    onChange={(e) => handleInputChange('subject', e.target.value)}
                                >
                                    <option value="">All Subjects</option>
                                    {subjects.map((subject) => (
                                        <option key={subject._id} value={subject._id}>
                                            {subject.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Date Range Filter */}
                            <div className="col-md-3">
                                <label className="form-label">Date Range</label>
                                <select
                                    className="form-select"
                                    value={filters.dateRange}
                                    onChange={(e) => handleInputChange('dateRange', e.target.value)}
                                >
                                    <option value="all">All Dates</option>
                                    <option value="today">Today</option>
                                    <option value="week">Next 7 Days</option>
                                    <option value="month">Next 30 Days</option>
                                </select>
                            </div>

                            {/* Search Term */}
                            <div className="col-md-12">
                                <label className="form-label">Search Exams</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search by exam title or description..."
                                    value={filters.searchTerm}
                                    onChange={(e) => handleInputChange('searchTerm', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ExamFilters