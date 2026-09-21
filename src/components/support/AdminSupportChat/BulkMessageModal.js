'use client'

import React from 'react'

const BulkMessageModal = ({
    showBulkModal,
    setShowBulkModal,
    bulkMode,
    setBulkMode,
    allStudents,
    fetchAllStudents,
    isStudentDropdownOpen,
    setIsStudentDropdownOpen,
    selectedBulkUsers,
    setSelectedBulkUsers,
    searchQuery,
    setSearchQuery,
    loadingStudents,
    searchResults,
    bulkMessageText,
    setBulkMessageText,
    handleBulkSend,
    uploading
}) => {
    if (!showBulkModal) return null

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Bulk Message</h5>
                        <button type="button" className="btn-close" onClick={() => setShowBulkModal(false)}></button>
                    </div>
                    <div className="modal-body">
                        <div className="mb-3">
                            <label className="form-label">Recipients</label>
                            <div className="d-flex gap-3 mb-2">
                                <div className="form-check">
                                    <input
                                        className="form-check-input" type="radio"
                                        checked={bulkMode === 'specific'} onChange={() => setBulkMode('specific')}
                                    />
                                    <label className="form-check-label">Specific Students</label>
                                </div>
                                <div className="form-check">
                                    <input
                                        className="form-check-input" type="radio"
                                        checked={bulkMode === 'all'} onChange={() => setBulkMode('all')}
                                    />
                                    <label className="form-check-label">All Students</label>
                                </div>
                            </div>

                            {bulkMode === 'specific' && (
                                <div className="mb-3">
                                    <div className="dropdown w-100 position-relative">
                                        <button
                                            className="btn btn-outline-secondary w-100 d-flex justify-content-between align-items-center"
                                            type="button"
                                            onClick={() => {
                                                if (!allStudents.length) fetchAllStudents();
                                                setIsStudentDropdownOpen(!isStudentDropdownOpen);
                                            }}
                                        >
                                            {selectedBulkUsers.length === 0
                                                ? 'Select Students...'
                                                : `${selectedBulkUsers.length} Students Selected`}
                                        </button>

                                        {isStudentDropdownOpen && (
                                            <div className="card position-absolute w-100 mt-1 shadow-sm border p-2" style={{ zIndex: 1050, maxHeight: '300px', overflowY: 'auto' }}>
                                                <div className="d-flex justify-content-end mb-1">
                                                    <button type="button" className="btn-close btn-sm" aria-label="Close" onClick={() => setIsStudentDropdownOpen(false)}></button>
                                                </div>
                                                <input
                                                    type="text"
                                                    className="form-control mb-2"
                                                    placeholder="Search students..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    autoFocus
                                                />

                                                {loadingStudents ? (
                                                    <div className="text-center py-2"><small>Loading...</small></div>
                                                ) : (
                                                    <>
                                                        <div className="form-check border-bottom pb-2 mb-2">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                id="selectAll"
                                                                checked={
                                                                    searchResults.length > 0 &&
                                                                    searchResults.every(u => selectedBulkUsers.some(sel => sel._id === u._id))
                                                                }
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        // Select all visible
                                                                        const newSelected = [...selectedBulkUsers];
                                                                        searchResults.forEach(u => {
                                                                            if (!newSelected.some(sel => sel._id === u._id)) {
                                                                                newSelected.push(u);
                                                                            }
                                                                        });
                                                                        setSelectedBulkUsers(newSelected);
                                                                    } else {
                                                                        // Deselect all visible
                                                                        const visibleIds = searchResults.map(u => u._id);
                                                                        setSelectedBulkUsers(selectedBulkUsers.filter(u => !visibleIds.includes(u._id)));
                                                                    }
                                                                }}
                                                            />
                                                            <label className="form-check-label fw-bold" htmlFor="selectAll">
                                                                Select All ({searchResults.length})
                                                            </label>
                                                        </div>

                                                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                            {searchResults.length === 0 ? (
                                                                <div className="text-muted text-center"><small>No students found</small></div>
                                                            ) : (
                                                                searchResults.map(user => (
                                                                    <div key={user._id} className="form-check mb-1">
                                                                        <input
                                                                            className="form-check-input"
                                                                            type="checkbox"
                                                                            id={`user-${user._id}`}
                                                                            checked={selectedBulkUsers.some(u => u._id === user._id)}
                                                                            onChange={(e) => {
                                                                                if (e.target.checked) {
                                                                                    setSelectedBulkUsers([...selectedBulkUsers, user]);
                                                                                } else {
                                                                                    setSelectedBulkUsers(selectedBulkUsers.filter(u => u._id !== user._id));
                                                                                }
                                                                            }}
                                                                        />
                                                                        <label className="form-check-label text-truncate d-block" htmlFor={`user-${user._id}`}>
                                                                            {user.name} <small className="text-muted">({user.email})</small>
                                                                        </label>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {selectedBulkUsers.length > 0 && (
                                        <div className="mt-2 text-muted small">
                                            Selected: {selectedBulkUsers.map(u => u.name).join(', ')}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Message</label>
                            <textarea
                                className="form-control" rows="4"
                                value={bulkMessageText} onChange={(e) => setBulkMessageText(e.target.value)}
                                placeholder="Type your message here..."
                            ></textarea>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowBulkModal(false)}>Cancel</button>
                        <button
                            type="button" className="btn btn-primary"
                            onClick={handleBulkSend}
                            disabled={!bulkMessageText || (bulkMode === 'specific' && selectedBulkUsers.length === 0)}
                        >
                            {uploading ? 'Sending...' : 'Send Message'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BulkMessageModal
