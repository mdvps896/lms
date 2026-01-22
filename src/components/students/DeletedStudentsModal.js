'use client';
import { useState, useEffect } from 'react';
import { FaTrash, FaUndo, FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function DeletedStudentsModal({ isOpen, onClose, onRestoreSuccess }) {
    const [deletedStudents, setDeletedStudents] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchDeletedStudents();
        }
    }, [isOpen]);

    const fetchDeletedStudents = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/users/deleted');
            const data = await res.json();
            if (data.success) {
                setDeletedStudents(data.data);
            } else {
                toast.error(data.message || 'Failed to fetch deleted students');
            }
        } catch (error) {
            toast.error('Error loading deleted students');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (id) => {
        if (!confirm('Are you sure you want to restore this student?')) return;

        try {
            // Use PATCH to restore (update isDeleted: false)
            const res = await fetch(`/api/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isDeleted: false }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Student restored successfully');
                fetchDeletedStudents(); // Refresh list
                if (onRestoreSuccess) onRestoreSuccess();
            } else {
                toast.error(data.message || data.error || 'Failed to restore student');
            }
        } catch (error) {
            toast.error('Error restoring student');
        }
    };

    const handleDeletePermanent = async (id) => {
        if (!confirm('WARNING: This action cannot be undone. Delete permanently?')) return;

        try {
            const res = await fetch(`/api/users/${id}?permanent=true`, {
                method: 'DELETE',
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Student deleted permanently');
                fetchDeletedStudents(); // Refresh list
            } else {
                toast.error(data.message || 'Failed to delete student');
            }
        } catch (error) {
            toast.error('Error deleting student');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
                <div className="modal-content shadow-lg border-0">
                    {/* Header */}
                    <div className="modal-header bg-white border-bottom">
                        <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                            <FaTrash className="text-danger" />
                            Recycle Bin (Deleted Students)
                        </h5>
                        <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
                    </div>

                    {/* Content */}
                    <div className="modal-body p-0">
                        {loading ? (
                            <div className="d-flex justify-content-center align-items-center py-5">
                                <div className="spinner-border text-danger" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : deletedStudents.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                <FaTrash size={48} className="mb-3 opacity-50" />
                                <p className="mb-0">No deleted students found</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover mb-0 align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="ps-4">Name</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>Deleted At</th>
                                            <th className="text-end pe-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deletedStudents.map((student) => (
                                            <tr key={student._id}>
                                                <td className="ps-4 fw-medium text-dark">{student.name}</td>
                                                <td className="text-muted">{student.email}</td>
                                                <td className="text-muted">{student.phone || '-'}</td>
                                                <td className="text-muted small">
                                                    {new Date(student.deletedAt || student.updatedAt).toLocaleDateString()}
                                                </td>
                                                <td className="text-end pe-4">
                                                    <div className="d-flex justify-content-end gap-2">
                                                        <button
                                                            onClick={() => handleRestore(student._id)}
                                                            className="btn btn-outline-success btn-sm d-flex align-items-center gap-1"
                                                            title="Restore"
                                                        >
                                                            <FaUndo size={12} /> Restore
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeletePermanent(student._id)}
                                                            className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                                                            title="Delete Permanently"
                                                        >
                                                            <FaTrash size={12} /> Diggest
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
