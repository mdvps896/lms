'use client'

import React from 'react'
import { FiMail, FiPhone, FiCalendar, FiCheckCircle, FiXCircle } from 'react-icons/fi'

const ViewTeacherModal = ({ show, teacher, onClose }) => {
    if (!show || !teacher) return null

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Teacher Details</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <div className="text-center mb-4">
                            <div className="avatar avatar-xl bg-soft-primary text-primary mx-auto mb-3">
                                <span style={{ fontSize: '36px', fontWeight: 'bold' }}>
                                    {teacher.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <h5 className="mb-1">{teacher.name}</h5>
                            <span className={`badge ${teacher.status === 'active' ? 'bg-success' :
                                teacher.status === 'inactive' ? 'bg-secondary' :
                                    'bg-danger'
                                }`}>
                                {teacher.status}
                            </span>
                        </div>

                        <div className="list-group list-group-flush">
                            <div className="list-group-item d-flex align-items-center">
                                <FiMail className="me-3 text-muted" />
                                <div className="flex-grow-1">
                                    <small className="text-muted d-block">Email</small>
                                    <div className="d-flex align-items-center">
                                        <span>{teacher.email}</span>
                                        {teacher.emailVerified && (
                                            <FiCheckCircle className="ms-2 text-success" title="Verified" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="list-group-item d-flex align-items-center">
                                <FiPhone className="me-3 text-muted" />
                                <div>
                                    <small className="text-muted d-block">Phone</small>
                                    <span>{teacher.phone}</span>
                                </div>
                            </div>

                            <div className="list-group-item d-flex align-items-center">
                                <FiCalendar className="me-3 text-muted" />
                                <div>
                                    <small className="text-muted d-block">Joining Date</small>
                                    <span>{teacher.joiningDate}</span>
                                </div>
                            </div>

                            <div className="list-group-item d-flex align-items-center">
                                <div className="me-3 text-muted">🔐</div>
                                <div>
                                    <small className="text-muted d-block">Authentication</small>
                                    <span>
                                        {teacher.isGoogleAuth ? (
                                            <span className="badge bg-info">Google OAuth</span>
                                        ) : (
                                            <span className="badge bg-secondary">Email/Password</span>
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className="list-group-item d-flex align-items-center">
                                <div className="me-3 text-muted">🆔</div>
                                <div>
                                    <small className="text-muted d-block">Teacher ID</small>
                                    <code className="text-muted">{teacher.id}</code>
                                </div>
                            </div>
                            <div className="list-group-item">
                                <small className="text-muted d-block mb-1">Permissions</small>
                                <div>
                                    {(teacher.permissions && teacher.permissions.length > 0) ? (
                                        teacher.permissions.map((perm, index) => (
                                            <span key={index} className="badge bg-light text-dark me-1 mb-1 border">
                                                {perm.replace('manage_', 'Manage ').replace('view_', 'View ').replace(/_/g, ' ')}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-muted small">No specific permissions assigned</span>
                                    )}
                                </div>
                            </div>
                            <div className="list-group-item">
                                <small className="text-muted d-block mb-1">Access Scope</small>
                                <div>
                                    <span className={`badge ${teacher.accessScope === 'global' ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                                        {teacher.accessScope === 'global' ? 'Global Access' : 'Manage Own Content'}
                                    </span>
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

export default ViewTeacherModal
