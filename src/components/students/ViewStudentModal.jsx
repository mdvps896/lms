'use client'

import React from 'react'
import { FiMail, FiPhone, FiCalendar, FiCheckCircle, FiXCircle } from 'react-icons/fi'

const ViewStudentModal = ({ show, student, onClose }) => {
    if (!show || !student) return null

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Student Details</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <div className="text-center mb-4">
                            <div className="avatar avatar-xl bg-soft-primary text-primary mx-auto mb-3">
                                <span style={{ fontSize: '36px', fontWeight: 'bold' }}>
                                    {student.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <h5 className="mb-1">{student.name}</h5>
                            <span className={`badge ${
                                student.status === 'active' ? 'bg-success' :
                                student.status === 'inactive' ? 'bg-secondary' :
                                'bg-danger'
                            }`}>
                                {student.status}
                            </span>
                        </div>

                        <div className="list-group list-group-flush">
                            <div className="list-group-item d-flex align-items-center">
                                <FiMail className="me-3 text-muted" />
                                <div className="flex-grow-1">
                                    <small className="text-muted d-block">Email</small>
                                    <div className="d-flex align-items-center">
                                        <span>{student.email}</span>
                                        {student.emailVerified && (
                                            <FiCheckCircle className="ms-2 text-success" title="Verified" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="list-group-item d-flex align-items-center">
                                <FiPhone className="me-3 text-muted" />
                                <div>
                                    <small className="text-muted d-block">Phone</small>
                                    <span>{student.phone}</span>
                                </div>
                            </div>

                            <div className="list-group-item d-flex align-items-center">
                                <FiCalendar className="me-3 text-muted" />
                                <div>
                                    <small className="text-muted d-block">Enrollment Date</small>
                                    <span>{student.enrollmentDate}</span>
                                </div>
                            </div>

                            <div className="list-group-item d-flex align-items-center">
                                <div className="me-3 text-muted">🔐</div>
                                <div>
                                    <small className="text-muted d-block">Authentication</small>
                                    <span>
                                        {student.isGoogleAuth ? (
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
                                    <small className="text-muted d-block">Student ID</small>
                                    <code className="text-muted">{student.id}</code>
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

export default ViewStudentModal