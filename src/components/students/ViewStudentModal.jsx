'use client'

import React, { useState, useEffect } from 'react'
import {
    FiX, FiUser, FiBookOpen, FiFileText, FiActivity,
    FiMail, FiPhone, FiCalendar, FiCheckCircle, FiClock,
    FiAward, FiTrendingUp, FiDownload
} from 'react-icons/fi'

const ViewStudentModal = ({ show, student, onClose }) => {
    const [activeTab, setActiveTab] = useState('overview')
    const [details, setDetails] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (show && student?.id) {
            fetchStudentDetails()
        }
        return () => {
            setDetails(null)
            setActiveTab('overview')
        }
    }, [show, student])

    const fetchStudentDetails = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch(`/api/users/${student.id}/details`)
            const data = await response.json()
            if (data.success) {
                setDetails(data.data)
            } else {
                setError(data.message || 'Failed to fetch details')
            }
        } catch (err) {
            setError('Error connecting to server')
        } finally {
            setLoading(false)
        }
    }

    if (!show || !student) return null

    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            className={`nav-link ${activeTab === id ? 'active' : ''} d-flex align-items-center gap-2`}
            onClick={() => setActiveTab(id)}
            style={{
                cursor: 'pointer',
                borderBottom: activeTab === id ? '2px solid #3454d1' : 'none',
                color: activeTab === id ? '#3454d1' : '#6c757d',
                padding: '1rem 1.5rem',
                fontWeight: 500
            }}
        >
            <Icon size={18} />
            {label}
        </button>
    )

    const StatCard = ({ label, value, icon: Icon, color }) => (
        <div className="col-md-4 mb-4">
            <div className="card h-100 border-0 shadow-sm">
                <div className="card-body p-4">
                    <div className="d-flex align-items-center mb-3">
                        <div className={`avatar avatar-lg bg-soft-${color} text-${color} me-3 d-flex align-items-center justify-content-center`}>
                            <Icon size={24} />
                        </div>
                        <div>
                            <span className="text-muted d-block text-uppercase fs-11 fw-bold tracking-wider">{label}</span>
                            <h3 className="mb-0 fw-bold">{value}</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content border-0 shadow-lg" style={{ maxHeight: '90vh' }}>

                    {/* Header */}
                    <div className="modal-header border-0 pb-0 bg-light">
                        <div className="d-flex align-items-center w-100 mb-3">
                            <div className="avatar avatar-xl bg-primary text-white me-3 shadow-sm rounded-circle d-flex align-items-center justify-content-center">
                                <span className="fs-3 fw-bold">{student.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                                <h4 className="modal-title fw-bold mb-1">{student.name}</h4>
                                <div className="d-flex align-items-center text-muted gap-3">
                                    <span className="d-flex align-items-center gap-1">
                                        <FiMail size={14} /> {student.email}
                                    </span>
                                    <span className={`badge ${student.status === 'active' ? 'bg-success' :
                                        student.status === 'inactive' ? 'bg-warning' : 'bg-danger'
                                        } rounded-pill`}>
                                        {student.status}
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="btn-close ms-auto align-self-start"
                                onClick={onClose}
                                style={{ boxShadow: 'none' }}
                            ></button>
                        </div>

                        {/* Tabs */}
                        <div className="w-100 mt-2">
                            <ul className="nav nav-tabs border-0">
                                <li className="nav-item">
                                    <TabButton id="overview" label="General Details" icon={FiUser} />
                                </li>
                                <li className="nav-item">
                                    <TabButton id="exams" label="Exam History" icon={FiBookOpen} />
                                </li>
                                <li className="nav-item">
                                    <TabButton id="pdfs" label="PDF Views" icon={FiFileText} />
                                </li>
                                <li className="nav-item">
                                    <TabButton id="courses" label="Course Views" icon={FiBookOpen} />
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="modal-body bg-light p-4" style={{ overflowY: 'auto' }}>
                        {loading ? (
                            <div className="d-flex justify-content-center align-items-center p-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="alert alert-danger p-4 text-center">
                                <FiXCircle className="display-6 mb-3" />
                                <p className="mb-0">{error}</p>
                            </div>
                        ) : details ? (
                            <div className="tab-content">

                                {/* OVERVIEW TAB */}
                                {activeTab === 'overview' && (
                                    <div className="animate__animated animate__fadeIn">
                                        <div className="row g-4">
                                            {/* Stats Row */}
                                            <div className="col-12">
                                                <div className="row g-3">
                                                    <StatCard
                                                        label="Total Exams"
                                                        value={details.examStats?.total || 0}
                                                        icon={FiBookOpen}
                                                        color="primary"
                                                    />
                                                    <StatCard
                                                        label="Passed Exams"
                                                        value={details.examStats?.passed || 0}
                                                        icon={FiCheckCircle}
                                                        color="success"
                                                    />
                                                    <StatCard
                                                        label="Completion Rate"
                                                        value={`${details.examStats?.total ? Math.round((details.examStats.passed / details.examStats.total) * 100) : 0}%`}
                                                        icon={FiTrendingUp}
                                                        color="info"
                                                    />
                                                </div>
                                            </div>

                                            {/* Profile Details */}
                                            <div className="col-md-8">
                                                <div className="card border-0 shadow-sm h-100">
                                                    <div className="card-header bg-white border-0 py-3">
                                                        <h6 className="card-title fw-bold mb-0">Personal Information</h6>
                                                    </div>
                                                    <div className="card-body">
                                                        <div className="row g-4">
                                                            <div className="col-md-6">
                                                                <small className="text-muted text-uppercase fs-11">Full Name</small>
                                                                <p className="fw-semibold mb-0">{details.user.name}</p>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <small className="text-muted text-uppercase fs-11">Phone Number</small>
                                                                <p className="fw-semibold mb-0">{details.user.phone || 'N/A'}</p>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <small className="text-muted text-uppercase fs-11">Email Address</small>
                                                                <p className="fw-semibold mb-0 d-flex align-items-center gap-2">
                                                                    {details.user.email}
                                                                    {details.user.emailVerified && <FiCheckCircle className="text-success" />}
                                                                </p>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <small className="text-muted text-uppercase fs-11">Category</small>
                                                                <p className="fw-semibold mb-0">{details.user.category?.name || 'N/A'}</p>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <small className="text-muted text-uppercase fs-11">Date of Birth</small>
                                                                <p className="fw-semibold mb-0">{details.user.dob ? formatDate(details.user.dob) : 'N/A'}</p>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <small className="text-muted text-uppercase fs-11">Gender</small>
                                                                <p className="fw-semibold text-capitalize mb-0">{details.user.gender || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Account Info */}
                                            <div className="col-md-4">
                                                <div className="card border-0 shadow-sm h-100">
                                                    <div className="card-header bg-white border-0 py-3">
                                                        <h6 className="card-title fw-bold mb-0">Account Activity</h6>
                                                    </div>
                                                    <div className="card-body">
                                                        <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
                                                            <li className="d-flex align-items-center justify-content-between">
                                                                <div className="d-flex align-items-center gap-2 text-muted">
                                                                    <FiCalendar /> <span className="fs-13">Joined</span>
                                                                </div>
                                                                <span className="fw-semibold fs-13">{formatDate(details.user.createdAt)}</span>
                                                            </li>
                                                            <li className="d-flex align-items-center justify-content-between">
                                                                <div className="d-flex align-items-center gap-2 text-muted">
                                                                    <FiClock /> <span className="fs-13">Last Activity</span>
                                                                </div>
                                                                <span className="fw-semibold fs-13">{formatDate(details.user.lastActivity || details.user.updatedAt)}</span>
                                                            </li>
                                                            <li className="d-flex align-items-center justify-content-between">
                                                                <div className="d-flex align-items-center gap-2 text-muted">
                                                                    <div className="me-1">🆔</div> <span className="fs-13">Roll No</span>
                                                                </div>
                                                                <span className="fw-semibold fs-13">{details.user.rollNumber || 'N/A'}</span>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* EXAMS TAB */}
                                {activeTab === 'exams' && (
                                    <div className="animate__animated animate__fadeIn">
                                        <div className="card border-0 shadow-sm">
                                            <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                                                <h6 className="card-title fw-bold mb-0">Exam Attempts History</h6>
                                                <span className="badge bg-light text-primary">{details.attempts?.length || 0} Records</span>
                                            </div>
                                            <div className="card-body p-0">
                                                <div className="table-responsive">
                                                    <table className="table table-hover table-nowrap mb-0 align-middle">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th className="ps-4">Exam Name</th>
                                                                <th>Date</th>
                                                                <th>Score</th>
                                                                <th>Status</th>
                                                                <th>Result</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {details.attempts && details.attempts.length > 0 ? (
                                                                details.attempts.map((attempt) => (
                                                                    <tr key={attempt.id}>
                                                                        <td className="ps-4 fw-medium text-dark">
                                                                            {attempt.examTitle}
                                                                        </td>
                                                                        <td>
                                                                            <div className="d-flex flex-column">
                                                                                <span className="fs-12 fw-medium">{formatDate(attempt.startedAt)}</span>
                                                                                <small className="text-muted fs-11">Started</small>
                                                                            </div>
                                                                        </td>
                                                                        <td>
                                                                            <span className="fw-bold text-dark">{attempt.score || 0}</span>
                                                                            <span className="text-muted fs-11"> / {attempt.totalMarks}</span>
                                                                        </td>
                                                                        <td>
                                                                            <span className={`badge bg-soft-${attempt.status === 'submitted' ? 'success' : 'warning'
                                                                                } text-${attempt.status === 'submitted' ? 'success' : 'warning'
                                                                                }`}>
                                                                                {attempt.status}
                                                                            </span>
                                                                        </td>
                                                                        <td>
                                                                            <span className={`badge rounded-pill ${attempt.result === 'Pass' ? 'bg-success' : 'bg-danger'
                                                                                }`}>
                                                                                {attempt.result}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan="5" className="text-center py-5 text-muted">
                                                                        <FiBookOpen size={24} className="mb-2 opacity-50" />
                                                                        <p className="mb-0">No exam attempts found</p>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* PDFS TAB */}
                                {activeTab === 'pdfs' && (
                                    <div className="animate__animated animate__fadeIn">
                                        <div className="card border-0 shadow-sm">
                                            <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                                                <h6 className="card-title fw-bold mb-0">PDF Reading History</h6>
                                                <span className="badge bg-light text-danger">{details.pdfViews?.length || 0} Records</span>
                                            </div>
                                            <div className="card-body p-0">
                                                <div className="table-responsive">
                                                    <table className="table table-hover table-nowrap mb-0 align-middle">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th className="ps-4">PDF Title</th>
                                                                <th>Viewed Date</th>
                                                                <th>Duration</th>
                                                                <th>Last Accessed</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {details.pdfViews && details.pdfViews.length > 0 ? (
                                                                details.pdfViews.map((view) => (
                                                                    <tr key={view.id}>
                                                                        <td className="ps-4 fw-medium text-dark width-40">
                                                                            <div className="d-flex align-items-center">
                                                                                <div className="avatar avatar-sm bg-soft-danger text-danger me-2 rounded">
                                                                                    <FiFileText size={16} />
                                                                                </div>
                                                                                <span className="text-truncate" style={{ maxWidth: '200px' }} title={view.title}>{view.title}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td>
                                                                            <span className="fs-13">{formatDate(view.startTime)}</span>
                                                                        </td>
                                                                        <td>
                                                                            <span className="badge bg-light text-dark border">
                                                                                {view.duration ? `${Math.round(view.duration / 60)} mins` : '< 1 min'}
                                                                            </span>
                                                                        </td>
                                                                        <td>
                                                                            <span className="text-muted fs-12">{new Date(view.lastViewed).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan="4" className="text-center py-5 text-muted">
                                                                        <FiFileText size={24} className="mb-2 opacity-50" />
                                                                        <p className="mb-0">No PDF views recorded</p>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* COURSES TAB */}
                                {activeTab === 'courses' && (
                                    <div className="animate__animated animate__fadeIn">
                                        <div className="card border-0 shadow-sm">
                                            <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                                                <h6 className="card-title fw-bold mb-0">Course Viewing History</h6>
                                                <span className="badge bg-light text-success">{details.courseViews?.length || 0} Records</span>
                                            </div>
                                            <div className="card-body p-0">
                                                <div className="table-responsive">
                                                    <table className="table table-hover table-nowrap mb-0 align-middle">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th className="ps-4">Course Title</th>
                                                                <th>Accessed Date</th>
                                                                <th>Duration</th>
                                                                <th>Last Active</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {details.courseViews && details.courseViews.length > 0 ? (
                                                                details.courseViews.map((view) => (
                                                                    <tr key={view.id}>
                                                                        <td className="ps-4 fw-medium text-dark width-40">
                                                                            <div className="d-flex align-items-center">
                                                                                <div className="avatar avatar-sm bg-soft-success text-success me-2 rounded">
                                                                                    <FiBookOpen size={16} />
                                                                                </div>
                                                                                <span className="text-truncate" style={{ maxWidth: '200px' }} title={view.title}>{view.title}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td>
                                                                            <span className="fs-13">{formatDate(view.startTime)}</span>
                                                                        </td>
                                                                        <td>
                                                                            <span className="badge bg-light text-dark border">
                                                                                {view.duration ? `${Math.round(view.duration / 60)} mins` : '< 1 min'}
                                                                            </span>
                                                                        </td>
                                                                        <td>
                                                                            <span className="text-muted fs-12">{new Date(view.lastViewed).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan="4" className="text-center py-5 text-muted">
                                                                        <FiBookOpen size={24} className="mb-2 opacity-50" />
                                                                        <p className="mb-0">No Course views recorded</p>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>
                        ) : null}
                    </div>

                    {/* Footer */}
                    <div className="modal-footer border-0 bg-white">
                        <button
                            type="button"
                            className="btn btn-light"
                            onClick={onClose}
                        >
                            Close
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                        >
                            <FiDownload className="me-2" /> Download Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ViewStudentModal