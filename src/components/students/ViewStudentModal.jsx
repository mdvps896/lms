'use client'

import React, { useState, useEffect } from 'react'
import {
    FiX, FiUser, FiBookOpen, FiFileText,
    FiMail, FiDownload, FiXCircle, FiPenTool
} from 'react-icons/fi'
import StudentOverviewTab from './tabs/StudentOverviewTab'
import StudentExamsTab from './tabs/StudentExamsTab'
import StudentActivityLog from './tabs/StudentActivityLog'
import StudentESignTab from './tabs/StudentESignTab'
import { generateStudentReport } from '@/utils/studentReportGenerator'
import StudentReportModal from './StudentReportModal'
import { useSettings } from '@/contexts/SettingsContext'

const ViewStudentModal = ({ show, student, onClose }) => {
    const [activeTab, setActiveTab] = useState('overview')
    const [showReportModal, setShowReportModal] = useState(false)
    const { settings } = useSettings() // Get global settings
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
                                <li className="nav-item">
                                    <TabButton id="esign" label="E-Sign" icon={FiPenTool} />
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
                                {activeTab === 'overview' && (
                                    <StudentOverviewTab details={details} formatDate={formatDate} />
                                )}
                                {activeTab === 'exams' && (
                                    <StudentExamsTab details={details} formatDate={formatDate} />
                                )}
                                {activeTab === 'pdfs' && (
                                    <StudentActivityLog
                                        activityType="pdf"
                                        data={details.pdfViews}
                                        formatDate={formatDate}
                                    />
                                )}
                                {activeTab === 'courses' && (
                                    <StudentActivityLog
                                        activityType="course"
                                        data={details.courseViews}
                                        formatDate={formatDate}
                                    />
                                )}
                                {activeTab === 'esign' && (
                                    <StudentESignTab studentId={student.id} />
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
                            onClick={() => setShowReportModal(true)}
                            disabled={loading || !details}
                        >
                            <FiDownload className="me-2" /> Download Report
                        </button>
                    </div>

                    <StudentReportModal
                        isOpen={showReportModal}
                        onClose={() => setShowReportModal(false)}
                        studentId={student.id}
                        studentName={student.name}
                    />
                </div>
            </div>
        </div>

    )
}

export default ViewStudentModal