import React from 'react';
import { FiSearch } from 'react-icons/fi';

const AttemptsFilters = ({
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    filteredCount
}) => {
    return (
        <div className="row mb-4">
            <div className="col-12">
                <div className="card border-0 shadow-sm">
                    <div className="card-body">
                        <div className="row g-3 align-items-center">
                            {/* Search */}
                            <div className="col-md-4">
                                <div className="input-group">
                                    <span className="input-group-text bg-white">
                                        <FiSearch size={16} />
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search by date..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div className="col-md-3">
                                <select
                                    className="form-select"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="all">All Status</option>
                                    <option value="passed">Passed Only</option>
                                    <option value="failed">Failed Only</option>
                                </select>
                            </div>

                            {/* Sort By */}
                            <div className="col-md-3">
                                <select
                                    className="form-select"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <option value="recent">Most Recent</option>
                                    <option value="score">Highest Score</option>
                                </select>
                            </div>

                            {/* Results Count */}
                            <div className="col-md-2 text-end">
                                <span className="text-muted">
                                    {filteredCount} {filteredCount === 1 ? 'attempt' : 'attempts'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttemptsFilters;
