'use client'

import React, { useState, useEffect } from 'react'
import { FiCheckCircle, FiClock, FiAlertCircle, FiDollarSign, FiFileText, FiUpload, FiDownload, FiSave } from 'react-icons/fi'
import Swal from 'sweetalert2'

const StudentProgressTab = ({ studentId }) => {
    const [progressData, setProgressData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchProgress()
    }, [studentId])

    const fetchProgress = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/student/progress?userId=${studentId}`)
            const data = await res.json()
            if (data.success) {
                setProgressData(data.data || {})
            }
        } catch (error) {
            console.error('Error fetching progress:', error)
        } finally {
            setLoading(false)
        }
    }

    const updateStep = async (key, updates) => {
        setSaving(true)
        try {
            const currentStepData = progressData[key] || {}
            const newStepData = { ...currentStepData, ...updates }

            const res = await fetch('/api/admin/progress', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: studentId,
                    [key]: newStepData
                })
            })

            const data = await res.json()
            if (data.success) {
                // Update local state optimistically or re-fetch
                setProgressData(prev => ({
                    ...prev,
                    [key]: newStepData
                }))
                Swal.fire({
                    icon: 'success',
                    title: 'Updated!',
                    text: 'Status updated successfully',
                    timer: 1500,
                    showConfirmButton: false
                })
            } else {
                Swal.fire('Error', data.message || 'Failed to update', 'error')
            }
        } catch (error) {
            Swal.fire('Error', 'Something went wrong', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleUploadBill = async () => {
        const { value: formValues } = await Swal.fire({
            title: 'Upload/Add Bill',
            html:
                '<input id="swal-input1" class="swal2-input" placeholder="Bill Name (e.g. DataFlow Bill)">' +
                '<input id="swal-input2" class="swal2-input" placeholder="PDF URL">',
            focusConfirm: false,
            showCancelButton: true,
            preConfirm: () => {
                return [
                    document.getElementById('swal-input1').value,
                    document.getElementById('swal-input2').value
                ]
            }
        })

        if (formValues) {
            const [name, url] = formValues
            if (!name || !url) return

            try {
                const res = await fetch(`/api/admin/progress/bill?userId=${studentId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, url })
                })
                const data = await res.json()
                if (data.success) {
                    Swal.fire('Success', 'Bill added successfully', 'success')
                    fetchProgress()
                } else {
                    Swal.fire('Error', data.message, 'error')
                }
            } catch (err) {
                Swal.fire('Error', 'Failed to add bill', 'error')
            }
        }
    }

    const StepEditor = ({ title, stepKey, options, hasPayment = false }) => {
        const data = progressData?.[stepKey] || {}
        const currentStatus = data.status || options[0]
        const currentPayment = data.paymentStatus || 'Not Started'
        const [note, setNote] = useState(data.adminNote || '')

        // Update local note state when data loaded
        useEffect(() => {
            setNote(data.adminNote || '')
        }, [data.adminNote])

        return (
            <div className="card mb-3 border shadow-sm">
                <div className="card-header bg-light d-flex justify-content-between align-items-center py-2">
                    <h6 className="mb-0 fw-bold text-primary">{title}</h6>
                    {getStatusBadge(currentStatus)}
                </div>
                <div className="card-body p-3">
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label small text-muted">Status</label>
                            <select
                                className="form-select form-select-sm"
                                value={currentStatus}
                                onChange={(e) => updateStep(stepKey, { status: e.target.value })}
                            >
                                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        {hasPayment && (
                            <div className="col-md-6">
                                <label className="form-label small text-muted">Payment Status</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={currentPayment}
                                    onChange={(e) => updateStep(stepKey, { paymentStatus: e.target.value })}
                                >
                                    {['Not Started', 'Pending', 'Paid', 'Not Paid'].map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="col-12">
                            <label className="form-label small text-muted">Admin Note</label>
                            <div className="input-group input-group-sm">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter note..."
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                />
                                <button
                                    className="btn btn-outline-secondary"
                                    type="button"
                                    onClick={() => updateStep(stepKey, { adminNote: note })}
                                    disabled={saving}
                                >
                                    <FiSave /> Save Note
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const ResultEditor = () => {
        const stepKey = 'examResult'
        const data = progressData?.[stepKey] || {}
        const options = ['Awaiting Result', 'Passed', 'Failed', 'Result On Hold / Under Review', 'Re-Exam Required', 'Eligibility Letter Issued']
        const currentStatus = data.status || options[0]
        const [score, setScore] = useState(data.score || '')
        const [note, setNote] = useState(data.adminNote || '')

        useEffect(() => {
            setScore(data.score || '')
            setNote(data.adminNote || '')
        }, [data.score, data.adminNote])

        return (
            <div className="card mb-3 border shadow-sm">
                <div className="card-header bg-light d-flex justify-content-between align-items-center py-2">
                    <h6 className="mb-0 fw-bold text-primary">Exam Tracking</h6>
                    {getStatusBadge(currentStatus)}
                </div>
                <div className="card-body p-3">
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label small text-muted">Result Status</label>
                            <select
                                className="form-select form-select-sm"
                                value={currentStatus}
                                onChange={(e) => updateStep(stepKey, { status: e.target.value })}
                            >
                                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label small text-muted">Score / Marks</label>
                            <input
                                type="text"
                                className="form-control form-select-sm"
                                value={score}
                                onChange={(e) => setScore(e.target.value)}
                            />
                        </div>
                        <div className="col-12">
                            <label className="form-label small text-muted">Result Note</label>
                            <div className="input-group input-group-sm">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter note..."
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                />
                                <button
                                    className="btn btn-outline-secondary"
                                    type="button"
                                    onClick={() => updateStep(stepKey, { score, adminNote: note })}
                                    disabled={saving}
                                >
                                    <FiSave /> Save Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const McqPaymentEditor = () => {
        const stepKey = 'mcqCoursePayment'
        const data = progressData?.[stepKey] || {}
        const options = ['Not Paid', 'Payment Pending', 'Paid']
        const currentStatus = data.status || options[0]

        return (
            <div className="card mb-3 border shadow-sm">
                <div className="card-body p-3 d-flex align-items-center justify-content-between">
                    <h6 className="mb-0 fw-bold text-primary">MCQ Course Payment</h6>
                    <div style={{ width: '200px' }}>
                        <select
                            className="form-select form-select-sm"
                            value={currentStatus}
                            onChange={(e) => updateStep(stepKey, { status: e.target.value })}
                        >
                            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                </div>
            </div>
        )
    }

    const BillsManager = () => {
        const bills = progressData?.bills || []

        return (
            <div className="card mb-3 border shadow-sm">
                <div className="card-header bg-light d-flex justify-content-between align-items-center py-2">
                    <h6 className="mb-0 fw-bold text-primary">Bill Management</h6>
                    <button className="btn btn-sm btn-primary" onClick={handleUploadBill}>
                        <FiUpload className="me-1" /> Add Bill
                    </button>
                </div>
                <div className="card-body p-0">
                    {bills.length === 0 ? (
                        <div className="text-center p-3 text-muted small">No bills uploaded yet</div>
                    ) : (
                        <ul className="list-group list-group-flush">
                            {bills.map((bill, idx) => (
                                <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center">
                                        <FiFileText className={`me-3 fs-4 ${bill.status === 'Downloaded' ? 'text-success' : 'text-danger'}`} />
                                        <div>
                                            <div className="fw-semibold">{bill.name || 'Untitled Bill'}</div>
                                            <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                                                {bill.status === 'Downloaded' ? 'Downloaded' : 'Uploaded (Pending Download)'}
                                            </div>
                                        </div>
                                    </div>
                                    <a
                                        href={bill.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-sm btn-outline-primary"
                                    >
                                        <FiDownload /> View
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        )
    }

    if (loading) return <div className="text-center p-5"><div className="spinner-border text-primary" /></div>

    return (
        <div className="container-fluid p-0">
            <div className="row">
                <div className="col-lg-6">
                    <StepEditor
                        title="Eligibility Check"
                        stepKey="eligibilityCheck"
                        options={['Pending', 'In Review', 'Approved', 'Rejected']}
                    />
                    <StepEditor
                        title="DataFlow Verification"
                        stepKey="dataFlow"
                        options={['Not Started', 'Submitted', 'Under Verification', 'Completed', 'Rejected', 'Additional Docs Required']}
                        hasPayment
                    />
                    <StepEditor
                        title="PSV Verification"
                        stepKey="psv"
                        options={['Not Started', 'Submitted', 'Under Verification', 'Completed', 'Rejected', 'Additional Docs Required']}
                        hasPayment
                    />
                </div>
                <div className="col-lg-6">
                    <StepEditor
                        title="Exam Booking"
                        stepKey="examBooking"
                        options={['Not Booked', 'Slot Available', 'Slot Not Available', 'Exam Pending', 'Booked', 'Rescheduled']}
                        hasPayment
                    />
                    <StepEditor
                        title="Eligibility Letter"
                        stepKey="eligibilityLetter"
                        options={['Not Started', 'Submitted', 'Under Verification', 'Congratulations', 'Rejected', 'Additional Docs Required']}
                        hasPayment
                    />
                    <ResultEditor />
                    <McqPaymentEditor />
                    <BillsManager />
                </div>
            </div>
        </div>
    )
}

// Helper for status badges
const getStatusBadge = (status) => {
    let color = 'bg-secondary'
    if (['Approved', 'Completed', 'Congratulations', 'Paid', 'Passed'].includes(status)) color = 'bg-success'
    if (['Pending', 'In Review', 'Under Verification', 'Submitted', 'Payment Pending'].includes(status)) color = 'bg-warning text-dark'
    if (['Rejected', 'Failed', 'Not Paid'].includes(status)) color = 'bg-danger'

    return <span className={`badge ${color} rounded-pill`}>{status}</span>
}

export default StudentProgressTab
