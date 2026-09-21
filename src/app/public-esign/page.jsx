'use client';
import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiClock, FiDownload, FiAlertCircle, FiMail, FiRefreshCw, FiTrash2, FiFileText } from 'react-icons/fi';
import { toast } from 'react-toastify';
import DuplicateLayout from '../duplicateLayout';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import SendESignEmailModal from '@/components/students/modals/SendESignEmailModal';

// Admin view of submissions made through the public /esign web form — people
// without a registered account/mobile app who filled the digital consent
// form directly. Same approve/reject/reset/PDF/email actions as the
// per-student E-Sign tab (StudentESignTab.jsx), reused here via the
// `submissionId`-based API paths those routes were extended with, instead of
// the `studentId`-based paths the app flow uses.
export default function PublicESignPage() {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [busyId, setBusyId] = useState(null);
    const [emailModalFor, setEmailModalFor] = useState(null);

    useEffect(() => {
        fetchSubmissions();
    }, [statusFilter]);

    const fetchSubmissions = async () => {
        try {
            setLoading(true);
            const url = statusFilter
                ? `/api/admin/esign/public-submissions?status=${statusFilter}`
                : '/api/admin/esign/public-submissions';
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setSubmissions(data.data);
            } else {
                toast.error(data.message || 'Failed to load submissions');
            }
        } catch (err) {
            toast.error('Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    const act = async (endpoint, submissionId, confirmMsg, successMsg) => {
        if (confirmMsg && !confirm(confirmMsg)) return;
        setBusyId(submissionId);
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ submissionId })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(successMsg || data.message);
                fetchSubmissions();
            } else {
                toast.error(data.message || 'Action failed');
            }
        } catch (err) {
            toast.error('Error connecting to server');
        } finally {
            setBusyId(null);
        }
    };

    const handleApprove = (id) => act('/api/student/esign/approve', id, null, 'Approved');
    const handleReject = (id) => act('/api/student/esign/reject', id, 'Reject this submission? The guest will be able to re-fill the form.', 'Rejected');
    const handleReset = (id) => act('/api/student/esign/reset', id, 'Delete this submission permanently? This cannot be undone.', 'Deleted');

    const statusBadge = (status) => {
        if (status === 'Approved') return <span className="badge bg-success"><FiCheckCircle className="me-1" />Approved</span>;
        if (status === 'Rejected') return <span className="badge bg-danger"><FiAlertCircle className="me-1" />Rejected</span>;
        return <span className="badge bg-warning text-dark"><FiClock className="me-1" />Pending</span>;
    };

    const emailModalSubmission = submissions.find((s) => s._id === emailModalFor);

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <DuplicateLayout>
                <div className="main-content">
                    <div className="container-fluid">
                        <div className="row">
                            <div className="col-12">
                                <div className="page-header">
                                    <div className="page-header-left d-flex align-items-center">
                                        <div className="page-header-title">
                                            <h5 className="m-b-10">Public E-Sign Submissions</h5>
                                        </div>
                                        <ul className="breadcrumb">
                                            <li className="breadcrumb-item"><a href="/">Home</a></li>
                                            <li className="breadcrumb-item">Public E-Sign</li>
                                        </ul>
                                    </div>
                                    <div className="page-header-right ms-auto">
                                        <div className="page-header-right-items d-flex gap-2 align-items-center">
                                            <select
                                                className="form-select form-select-sm"
                                                style={{ width: 160 }}
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                            >
                                                <option value="">All Statuses</option>
                                                <option value="Pending">Pending</option>
                                                <option value="Approved">Approved</option>
                                                <option value="Rejected">Rejected</option>
                                            </select>
                                            <button
                                                className="btn btn-icon btn-light-brand"
                                                onClick={fetchSubmissions}
                                                disabled={loading}
                                                title="Refresh"
                                            >
                                                <FiRefreshCw className={loading ? 'spin' : ''} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-12">
                                <div className="alert alert-info d-flex align-items-center gap-2 mb-3">
                                    <FiFileText />
                                    <span>
                                        These are e-sign forms filled at{' '}
                                        <code>/esign</code> by people without a registered account
                                        (e.g. no mobile app). They are separate from the students
                                        who submit through the app, which is managed from each
                                        student's own profile page.
                                    </span>
                                </div>

                                <div className="card stretch stretch-full">
                                    <div className="card-body p-0">
                                        <div className="table-responsive">
                                            <table className="table table-hover mb-0">
                                                <thead>
                                                    <tr>
                                                        <th>Name</th>
                                                        <th>Email</th>
                                                        <th>Mobile</th>
                                                        <th>Submitted</th>
                                                        <th>Status</th>
                                                        <th className="text-end">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {loading ? (
                                                        <tr>
                                                            <td colSpan="6" className="text-center py-5">
                                                                <div className="spinner-border text-primary" role="status">
                                                                    <span className="visually-hidden">Loading...</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ) : submissions.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="6" className="text-center py-5">
                                                                <FiFileText size={48} className="text-muted mb-3" />
                                                                <p className="text-muted mb-0">No public e-sign submissions yet</p>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        submissions.map((s) => {
                                                            const p = s.personalDetails || {};
                                                            const isBusy = busyId === s._id;
                                                            const isApproved = s.adminStatus === 'Approved';
                                                            const isRejected = s.adminStatus === 'Rejected';
                                                            return (
                                                                <tr key={s._id}>
                                                                    <td className="fw-semibold">{p.fullName || '—'}</td>
                                                                    <td>{p.email || '—'}</td>
                                                                    <td>{p.mobile || '—'}</td>
                                                                    <td>
                                                                        <small className="text-muted">
                                                                            {s.createdAt ? new Date(s.createdAt).toLocaleString() : '—'}
                                                                        </small>
                                                                    </td>
                                                                    <td>{statusBadge(s.adminStatus)}</td>
                                                                    <td>
                                                                        <div className="d-flex gap-2 justify-content-end flex-wrap">
                                                                            <a
                                                                                href={`/api/student/esign/pdf?submissionId=${s._id}`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                                                                                title="View / Download PDF"
                                                                            >
                                                                                <FiDownload size={14} /> PDF
                                                                            </a>
                                                                            <button
                                                                                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                                                                                onClick={() => setEmailModalFor(s._id)}
                                                                                title="Send PDF via Email"
                                                                            >
                                                                                <FiMail size={14} /> Mail
                                                                            </button>
                                                                            {!isApproved && !isRejected && (
                                                                                <>
                                                                                    <button
                                                                                        className="btn btn-sm btn-success d-flex align-items-center gap-1"
                                                                                        onClick={() => handleApprove(s._id)}
                                                                                        disabled={isBusy}
                                                                                    >
                                                                                        <FiCheckCircle size={14} /> Approve
                                                                                    </button>
                                                                                    <button
                                                                                        className="btn btn-sm btn-danger d-flex align-items-center gap-1"
                                                                                        onClick={() => handleReject(s._id)}
                                                                                        disabled={isBusy}
                                                                                    >
                                                                                        <FiAlertCircle size={14} /> Reject
                                                                                    </button>
                                                                                </>
                                                                            )}
                                                                            <button
                                                                                className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                                                                                onClick={() => handleReset(s._id)}
                                                                                disabled={isBusy}
                                                                                title="Delete this submission"
                                                                            >
                                                                                <FiTrash2 size={14} />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <SendESignEmailModal
                    isOpen={!!emailModalFor}
                    onClose={() => setEmailModalFor(null)}
                    submissionId={emailModalFor}
                    studentEmail={emailModalSubmission?.personalDetails?.email}
                    studentName={emailModalSubmission?.personalDetails?.fullName}
                />
            </DuplicateLayout>
        </ProtectedRoute>
    );
}
