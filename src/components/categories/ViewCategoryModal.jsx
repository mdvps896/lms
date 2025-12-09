'use client'

import React from 'react'
import { FiCalendar, FiFileText } from 'react-icons/fi'

const ViewCategoryModal = ({ show, category, onClose }) => {
    if (!show || !category) return null

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Category Details</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <div className="text-center mb-4">
                            <div className="avatar avatar-xl bg-soft-primary text-primary mx-auto mb-3">
                                <span style={{ fontSize: '36px', fontWeight: 'bold' }}>
                                    {category.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <h5 className="mb-1">{category.name}</h5>
                            <span className={`badge ${
                                category.status === 'active' ? 'bg-success' : 'bg-secondary'
                            }`}>
                                {category.status}
                            </span>
                        </div>

                        <div className="list-group list-group-flush">
                            <div className="list-group-item d-flex align-items-start">
                                <FiFileText className="me-3 text-muted mt-1" />
                                <div className="flex-grow-1">
                                    <small className="text-muted d-block">Description</small>
                                    <p className="mb-0">{category.description || 'No description available'}</p>
                                </div>
                            </div>

                            <div className="list-group-item d-flex align-items-center">
                                <FiCalendar className="me-3 text-muted" />
                                <div>
                                    <small className="text-muted d-block">Created Date</small>
                                    <span>{category.createdDate}</span>
                                </div>
                            </div>

                            <div className="list-group-item d-flex align-items-center">
                                <div className="me-3 text-muted">🆔</div>
                                <div>
                                    <small className="text-muted d-block">Category ID</small>
                                    <code className="text-muted">{category.id}</code>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ViewCategoryModal
