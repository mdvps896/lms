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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FaTrash className="text-red-500" />
                        Recycle Bin (Deleted Students)
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <FaTimes size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500"></div>
                        </div>
                    ) : deletedStudents.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">
                            <FaTrash size={48} className="mx-auto mb-4 text-gray-300" />
                            <p>No deleted students found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b">
                                        <th className="p-3 font-semibold text-gray-600">Name</th>
                                        <th className="p-3 font-semibold text-gray-600">Email</th>
                                        <th className="p-3 font-semibold text-gray-600">Phone</th>
                                        <th className="p-3 font-semibold text-gray-600">Deleted At</th>
                                        <th className="p-3 font-semibold text-gray-600 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deletedStudents.map((student) => (
                                        <tr key={student._id} className="border-b hover:bg-gray-50">
                                            <td className="p-3 font-medium text-gray-800">{student.name}</td>
                                            <td className="p-3 text-gray-600">{student.email}</td>
                                            <td className="p-3 text-gray-600">{student.phone || '-'}</td>
                                            <td className="p-3 text-gray-500 text-sm">
                                                {new Date(student.deletedAt || student.updatedAt).toLocaleDateString()}
                                            </td>
                                            <td className="p-3 text-right space-x-2">
                                                <button
                                                    onClick={() => handleRestore(student._id)}
                                                    className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm font-medium transition-colors"
                                                    title="Restore"
                                                >
                                                    <FaUndo className="inline mr-1" /> Restore
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePermanent(student._id)}
                                                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium transition-colors"
                                                    title="Delete Permanently"
                                                >
                                                    <FaTrash className="inline mr-1" /> Diggest
                                                </button>
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
    );
}
