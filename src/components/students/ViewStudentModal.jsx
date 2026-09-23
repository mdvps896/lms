'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
    FiUser, FiBookOpen, FiFileText, FiMail, FiDownload, FiXCircle,
    FiPenTool, FiClipboard, FiRefreshCw, FiCheckCircle
} from 'react-icons/fi'
import StudentOverviewTab from './tabs/StudentOverviewTab'
import StudentExamsTab from './tabs/StudentExamsTab'
import StudentActivityLog from './tabs/StudentActivityLog'
import StudentESignTab from './tabs/StudentESignTab'
import StudentProgressTab from './tabs/StudentProgressTab'
import StudentFreeMaterialsTab from './tabs/StudentFreeMaterialsTab'
import StudentClientFormTab from './tabs/StudentClientFormTab'
import StudentReportModal from './StudentReportModal'

const TABS = [
    { id: 'overview', label: 'General Details', icon: FiUser },
    { id: 'exams', label: 'Exam History', icon: FiBookOpen },
    { id: 'pdfs', label: 'PDF Views', icon: FiFileText },
    { id: 'esign', label: 'E-Sign', icon: FiPenTool },
    { id: 'progress', label: 'Progress Tracking', icon: FiCheckCircle },
    { id: 'client_form', label: 'Client Form', icon: FiClipboard },
    { id: 'free_materials', label: 'Free Materials', icon: FiFileText },
]

// These tabs render from the modal's details request; the others load
// their own data.
const DETAILS_TABS = new Set(['overview', 'exams', 'pdfs'])

// Last details per student for this browser session: reopening a student
// shows them instantly while fresh data loads in the background.
const detailsCache = new Map()

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

const ViewStudentModal = ({ show, student, onClose }) => {
    const [activeTab, setActiveTab] = useState('overview')
    const [showReportModal, setShowReportModal] = useState(false)
    const [details, setDetails] = useState(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState(null)
    const [lastUpdated, setLastUpdated] = useState(null)

    // Tabs stay mounted once opened, so switching back is instant; bumping a
    // tab's signal makes it reload quietly in the background.
    const [visited, setVisited] = useState(() => new Set(['overview']))
    const [signals, setSignals] = useState({})
    const requestId = useRef(0)

    const studentId = student?.id

    const fetchStudentDetails = useCallback(async ({ silent = false } = {}) => {
        if (!studentId) return
        const id = ++requestId.current
        if (silent) setRefreshing(true)
        else setLoading(true)
        try {
            const response = await fetch(`/api/users/${studentId}/details`, { cache: 'no-store' })
            const data = await response.json()
            if (id !== requestId.current) return // a newer request superseded this one
            if (data.success) {
                detailsCache.set(studentId, data.data)
                setDetails(data.data)
                setError(null)
                setLastUpdated(new Date())
            } else if (!silent) {
                setError(data.message || 'Failed to fetch details')
            }
        } catch (err) {
            if (id === requestId.current && !silent) setError('Error connecting to server')
        } finally {
            if (id === requestId.current) {
                setLoading(false)
                setRefreshing(false)
            }
        }
    }, [studentId])

    useEffect(() => {
        if (!show || !studentId) return
        const cached = detailsCache.get(studentId)
        setActiveTab('overview')
        setVisited(new Set(['overview']))
        setSignals({})
        setError(null)
        if (cached) {
            setDetails(cached)
            setLoading(false)
            fetchStudentDetails({ silent: true })
        } else {
            setDetails(null)
            fetchStudentDetails()
        }
    }, [show, studentId, fetchStudentDetails])

    const bumpSignal = (tabId) => setSignals(s => ({ ...s, [tabId]: (s[tabId] || 0) + 1 }))

    const openTab = (tabId) => {
        if (tabId === activeTab) return
        const seenBefore = visited.has(tabId)
        setActiveTab(tabId)
        if (!seenBefore) {
            setVisited(v => new Set(v).add(tabId))
        } else if (DETAILS_TABS.has(tabId)) {
            fetchStudentDetails({ silent: true })
        } else {
            bumpSignal(tabId)
        }
    }

    const handleRefresh = () => {
        if (refreshing || loading) return
        fetchStudentDetails({ silent: true })
        if (!DETAILS_TABS.has(activeTab)) bumpSignal(activeTab)
    }

    if (!show || !student) return null

    const renderTab = (tabId) => {
        switch (tabId) {
            case 'overview':
                return <StudentOverviewTab details={details} formatDate={formatDate} />
            case 'exams':
                return <StudentExamsTab details={details} formatDate={formatDate} />
            case 'pdfs':
                return <StudentActivityLog activityType="pdf" data={details.pdfViews} formatDate={formatDate} />
            case 'esign':
                return <StudentESignTab studentId={student.id} refreshSignal={signals.esign || 0} />
            case 'progress':
                return <StudentProgressTab studentId={student.id} refreshSignal={signals.progress || 0} />
            case 'client_form':
                return <StudentClientFormTab studentId={student.id} studentName={student.name} refreshSignal={signals.client_form || 0} />
            case 'free_materials':
                return (
                    <StudentFreeMaterialsTab
                        studentId={student.id}
                        freeMaterialViews={details.freeMaterialViews}
                        refreshSignal={signals.free_materials || 0}
                    />
                )
            default:
                return null
        }
    }

    const statusClass = student.status === 'active' ? 'bg-success'
        : student.status === 'inactive' ? 'bg-warning' : 'bg-danger'

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content border-0 shadow-lg vsm" style={{ maxHeight: '90vh' }}>

                    {/* Row 1 — who: name, email, status, last update, actions */}
                    <div className="px-4 pt-4 pb-3 bg-white flex-shrink-0">
                        <div className="d-flex align-items-center gap-3">
                            <div
                                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
                                style={{ width: 56, height: 56 }}
                            >
                                <span className="fs-4 fw-bold">{student.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="flex-grow-1 min-w-0">
                                <div className="d-flex align-items-center flex-wrap gap-2">
                                    <h4 className="modal-title fw-bold mb-0 text-truncate">{student.name}</h4>
                                    <span className={`badge ${statusClass} rounded-pill text-capitalize`}>{student.status}</span>
                                </div>
                                <div className="d-flex align-items-center flex-wrap gap-3 text-muted mt-1 fs-13">
                                    <span className="d-flex align-items-center gap-1 text-truncate">
                                        <FiMail size={14} /> {student.email}
                                    </span>
                                    {lastUpdated && (
                                        <span className="d-flex align-items-center gap-1">
                                            <FiRefreshCw size={12} />
                                            Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-2 flex-shrink-0 align-self-start">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-light border d-flex align-items-center gap-2"
                                    onClick={handleRefresh}
                                    disabled={refreshing || loading}
                                    title="Reload this student's data"
                                >
                                    <FiRefreshCw size={14} className={refreshing ? 'vsm-spin' : ''} />
                                    <span className="d-none d-sm-inline">{refreshing ? 'Refreshing…' : 'Refresh'}</span>
                                </button>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={onClose}
                                    style={{ boxShadow: 'none' }}
                                    aria-label="Close"
                                ></button>
                            </div>
                        </div>
                    </div>

                    {/* Row 2 — tabs (scroll sideways on small screens) */}
                    <div className="vsm-tabs bg-white border-bottom px-3 flex-shrink-0">
                        <ul className="nav flex-nowrap" role="tablist">
                            {TABS.map(({ id, label, icon: Icon }) => {
                                const active = activeTab === id
                                return (
                                    <li className="nav-item" key={id}>
                                        <button
                                            type="button"
                                            role="tab"
                                            aria-selected={active}
                                            className={`vsm-tab nav-link d-flex align-items-center gap-2 ${active ? 'active' : ''}`}
                                            onClick={() => openTab(id)}
                                        >
                                            <Icon size={16} />
                                            {label}
                                        </button>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>

                    {/* Row 3 — the selected tab's data */}
                    <div className="modal-body bg-light p-4" style={{ overflowY: 'auto' }}>
                        {loading ? (
                            <div className="d-flex justify-content-center align-items-center p-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : error && !details ? (
                            <div className="alert alert-danger p-4 text-center">
                                <FiXCircle className="display-6 mb-3" />
                                <p className="mb-0">{error}</p>
                            </div>
                        ) : details ? (
                            TABS.filter(t => visited.has(t.id)).map(t => (
                                <div key={t.id} className={activeTab === t.id ? '' : 'd-none'} role="tabpanel">
                                    {renderTab(t.id)}
                                </div>
                            ))
                        ) : null}
                    </div>

                    {/* Footer */}
                    <div className="modal-footer border-0 bg-white flex-shrink-0">
                        <button type="button" className="btn btn-light" onClick={onClose}>
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
            <style>{`
                .vsm .min-w-0 { min-width: 0; }
                /* The modal is a height-capped flex column: only the body may
                   shrink/scroll. overflow-x on the tab bar otherwise let flex
                   squash it to zero height. */
                .vsm-tabs { overflow-x: auto; overflow-y: hidden; scrollbar-width: thin; min-height: 52px; }
                .vsm-tabs .nav { flex-wrap: nowrap; }
                .vsm-tabs .vsm-tab {
                    white-space: nowrap; border: 0; background: none;
                    color: #6c757d; font-weight: 500; padding: .9rem 1.1rem;
                    border-bottom: 2px solid transparent; border-radius: 0;
                }
                .vsm-tabs .vsm-tab:hover { color: #3454d1; }
                .vsm-tabs .vsm-tab.active { color: #3454d1; border-bottom-color: #3454d1; }
                .vsm-spin { animation: vsm-spin 0.8s linear infinite; }
                @keyframes vsm-spin { to { transform: rotate(360deg); } }
                @media (prefers-reduced-motion: reduce) { .vsm-spin { animation: none; } }
            `}</style>
        </div>
    )
}

export default ViewStudentModal
