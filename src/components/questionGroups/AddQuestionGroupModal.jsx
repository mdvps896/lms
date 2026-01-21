'use client';
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const AddQuestionGroupModal = ({ show, onClose, onAdd }) => {
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        subject: '',
        description: '',
        status: 'active'
    });
    const [categories, setCategories] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [filteredSubjects, setFilteredSubjects] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (show) {
            fetchCategories();
            fetchSubjects();
        }
    }, [show]);

    useEffect(() => {
        if (formData.category) {
            const filtered = subjects.filter(s => s.category?._id === formData.category);
            setFilteredSubjects(filtered);
            setFormData(prev => ({ ...prev, subject: '' }));
        } else {
            setFilteredSubjects([]);
        }
    }, [formData.category, subjects]);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            if (data.success) {
                setCategories(data.data.filter(c => c.status === 'active'));
            } else {
                throw new Error(data.message || 'Failed to load categories');
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load categories',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        }
    };

    const fetchSubjects = async () => {
        try {
            const res = await fetch('/api/subjects');
            const data = await res.json();
            if (data.success) {
                setSubjects(data.data.filter(s => s.status === 'active'));
            } else {
                throw new Error(data.message || 'Failed to load subjects');
            }
        } catch (error) {
            console.error('Error fetching subjects:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load subjects',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/question-groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create question group');
            }

            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Question group created successfully!',
                timer: 2000,
                showConfirmButton: false
            });

            onAdd(data);
            handleClose();
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            name: '',
            category: '',
            subject: '',
            description: '',
            status: 'active'
        });
        setFilteredSubjects([]);
        onClose();
    };

    if (!show) return null;

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Add Question Group</h5>
                        <button type="button" className="btn-close" onClick={handleClose}></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label">Group Name *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Status *</label>
                                    <select
                                        className="form-select"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        required
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Category *</label>
                                    <select
                                        className="form-select"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map((cat) => (
                                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Subject *</label>
                                    <select
                                        className="form-select"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        required
                                        disabled={!formData.category}
                                    >
                                        <option value="">Select Subject</option>
                                        {filteredSubjects.map((sub) => (
                                            <option key={sub._id} value={sub._id}>{sub.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-12">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={handleClose}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Creating...' : 'Create Group'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddQuestionGroupModal;
