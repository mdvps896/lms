'use client'
import React from 'react'

const StoragePagination = ({
    loading,
    filteredFiles,
    itemsPerPage,
    indexOfFirstItem,
    indexOfLastItem,
    currentPage,
    totalPages,
    onPageChange
}) => {
    if (loading || filteredFiles.length <= itemsPerPage) return null

    return (
        <div className="d-flex justify-content-between align-items-center mt-4">
            <div className="text-muted">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredFiles.length)} of {filteredFiles.length} files
            </div>
            <nav>
                <ul className="pagination mb-0">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button
                            className="page-link"
                            onClick={() => onPageChange(currentPage - 1)}
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
                                        onClick={() => onPageChange(pageNumber)}
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
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    )
}

export default StoragePagination
