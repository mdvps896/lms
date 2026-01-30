'use client';
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { FiTrash2, FiRefreshCcw, FiX, FiAlertTriangle } from 'react-icons/fi';
import { toast } from 'react-toastify';

const RecycleBinModal = ({ show, onClose, onRestore }) => {
    const [deletedQuestions, setDeletedQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(null); // ID of question being processed

    useEffect(() => {
        if (show) {
            fetchDeletedQuestions();
        }
    }, [show]);

    const fetchDeletedQuestions = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/questions?trash=true');
            const data = await res.json();
            if (data.success) {
                setDeletedQuestions(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching trash:', error);
            toast.error('Failed to load recycle bin');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (id) => {
        setProcessing(id);
        try {
            const res = await fetch(`/api/questions/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'restore' })
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Question restored successfully');
                setDeletedQuestions(prev => prev.filter(q => q._id !== id));
                if (onRestore) onRestore();
            } else {
                toast.error(data.message || 'Failed to restore');
            }
        } catch (error) {
            toast.error('Error restoring question');
        } finally {
            setProcessing(null);
        }
    };

    const handlePermanentDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Permanently?',
            text: "You won't be able to recover this question!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it forever!'
        });

        if (result.isConfirmed) {
            setProcessing(id);
            try {
                const res = await fetch(`/api/questions/${id}?force=true`, {
                    method: 'DELETE'
                });
                const data = await res.json();

                if (data.success) {
                    toast.success('Question permanently deleted');
                    setDeletedQuestions(prev => prev.filter(q => q._id !== id));
                } else {
                    toast.error(data.message || 'Failed to delete');
                }
            } catch (error) {
                toast.error('Error deleting question');
            } finally {
                setProcessing(null);
            }
        }
    };

    const stripHtml = (html) => {
        if (!html) return "";
        return html.replace(/<[^>]*>?/gm, "");
    };

    if (!show) return null;

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', overflowY: 'auto' }}>
            <div className="modal-dialog modal-dialog-centered modal-xl">
                <div className="modal-content shadow-lg border-0">
                    <div className="modal-header bg-danger text-white">
                        <h5 className="modal-title">
                            <FiTrash2 className="me-2" />
                            Recycle Bin
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>
                    <div className="modal-body p-0">
                        {loading ? (
                            <div className="p-5 text-center">
                                <div className="spinner-border text-danger" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : deletedQuestions.length === 0 ? (
                            <div className="text-center p-5 text-muted">
                                <FiTrash2 className="fs-1 mb-3 opacity-50" />
                                <p className="mb-0">Recycle bin is empty</p>
                            </div>
                        ) : (
                            <div className="table-responsive" style={{ maxHeight: '60vh' }}>
                                <table className="table table-hover mb-0">
                                    <thead className="table-light sticky-top">
                                        <tr>
                                            <th>#</th>
                                            <th style={{ width: '40%' }}>Question</th>
                                            <th>Type</th>
                                            <th>Deleted At</th>
                                            <th className="text-end">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deletedQuestions.map((q, index) => (
                                            <tr key={q._id}>
                                                <td>{index + 1}</td>
                                                <td>
                                                    <div className="text-truncate" style={{ maxWidth: '400px' }} title={stripHtml(q.questionText)}>
                                                        {stripHtml(q.questionText)}
                                                    </div>
                                                    <small className="text-muted d-block">
                                                        {q.category?.name} &rsaquo; {q.subject?.name}
                                                    </small>
                                                </td>
                                                <td><span className="badge bg-secondary">{q.type}</span></td>
                                                <td>
                                                    {q.deletedAt ? new Date(q.deletedAt).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="text-end">
                                                    <button
                                                        className="btn btn-sm btn-success me-2"
                                                        onClick={() => handleRestore(q._id)}
                                                        disabled={processing === q._id}
                                                        title="Restore"
                                                    >
                                                        {processing === q._id ? (
                                                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                        ) : (
                                                            <>
                                                                <FiRefreshCcw className="me-1" /> Restore
                                                            </>
                                                        )}
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handlePermanentDelete(q._id)}
                                                        disabled={processing === q._id}
                                                        title="Delete Permanently"
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                    <div className="modal-footer bg-light">
                        <div className="text-muted small me-auto">
                            <FiAlertTriangle className="me-1 text-warning" />
                            Items in recycle bin may be permanently deleted after 30 days.
                        </div>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecycleBinModal;
