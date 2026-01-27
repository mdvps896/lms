import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiClock, FiDownload, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const StudentESignTab = ({ studentId }) => {
    const [statusData, setStatusData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [approving, setApproving] = useState(false);

    useEffect(() => {
        fetchStatus();
    }, [studentId]);

    const fetchStatus = async () => {
        try {
            const res = await fetch(`/api/student/esign/status?userId=${studentId}`);
            const data = await res.json();
            if (data.success) {
                setStatusData(data);
            } else {
                setError('Failed to fetch status');
            }
        } catch (err) {
            setError('Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!confirm('Are you sure you want to approve this E-Sign submission? This action cannot be undone.')) return;

        setApproving(true);
        try {
            const res = await fetch('/api/student/esign/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId })
            });
            const data = await res.json();

            if (data.success) {
                toast.success('E-Sign Approved Successfully');
                fetchStatus(); // Refresh status
            } else {
                toast.error(data.message || 'Approval Failed');
            }
        } catch (err) {
            toast.error('Error connecting to server');
        } finally {
            setApproving(false);
        }
    };

    if (loading) return <div className="text-center p-4">Loading E-Sign details...</div>;
    if (error) return <div className="text-center text-danger p-4">{error}</div>;

    if (!statusData?.submitted) {
        return (
            <div className="text-center p-5 text-muted">
                <FiAlertCircle size={40} className="mb-2" />
                <p>No E-Sign Form submitted by this student yet.</p>
            </div>
        );
    }

    const isApproved = statusData.status === 'Approved';

    return (
        <div className="card border-0 shadow-sm p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0 fw-bold text-secondary">E-Sign Submission Status</h5>
                <span className={`badge ${isApproved ? 'bg-success' : 'bg-warning text-dark'} px-3 py-2 rounded-pill`}>
                    {isApproved ? <FiCheckCircle className="me-1" /> : <FiClock className="me-1" />}
                    {statusData.status || 'Pending'}
                </span>
            </div>

            <div className="d-flex flex-column gap-3">
                <div className="d-flex align-items-center gap-2 text-muted">
                    <strong>Submission Date:</strong>
                    {new Date(statusData.submissionDate).toLocaleString()}
                </div>

                <div className="mt-3 d-flex gap-3">
                    <a
                        href={`/api/student/esign/pdf?userId=${studentId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-primary d-flex align-items-center gap-2"
                    >
                        <FiDownload /> Download Signed PDF
                    </a>

                    {!isApproved && (
                        <button
                            onClick={handleApprove}
                            disabled={approving}
                            className="btn btn-success d-flex align-items-center gap-2"
                        >
                            {approving ? 'Approving...' : <><FiCheckCircle /> Approve E-Sign</>}
                        </button>
                    )}
                </div>

                {!isApproved && (
                    <div className="alert alert-info mt-3 small">
                        <FiAlertCircle className="me-2" />
                        verify the PDF details before approving. Once approved, the student will see the "Approved" status in their app.
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentESignTab;
