'use client'

import React, { useState, useEffect } from 'react'
import { FiX } from 'react-icons/fi'
import Swal from 'sweetalert2'

const AddTeacherModal = ({ show, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: 'teacher123',
        status: 'active',
        category: '',
        category: '',
        permissions: [],
        accessScope: 'own'
    })
    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState([])

    useEffect(() => {
        if (show) {
            fetchCategories()
        }
    }, [show])

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/categories')
            const data = await response.json()
            if (data.success) {
                setCategories(data.data)
            }
        } catch (error) {
            console.error('Error fetching categories:', error)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.name || !formData.email) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Name and Email are required',
                timer: 2000
            })
            return
        }

        setLoading(true)

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone || '',
                    password: formData.password,
                    role: 'teacher',
                    status: formData.status,
                    category: formData.category || null,
                    category: formData.category || null,
                    permissions: formData.permissions || [],
                    accessScope: formData.accessScope
                }),
            })

            const data = await response.json()

            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Teacher added successfully',
                    timer: 1500,
                    showConfirmButton: false
                })

                onSuccess()
                onClose()
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: data.message || 'Failed to add teacher',
                    timer: 2000
                })
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to add teacher',
                timer: 2000
            })
        } finally {
            setLoading(false)
        }
    }

    if (!show) return null

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Add New Teacher</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label">Full Name <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Email <span className="text-danger">*</span></label>
                                <input
                                    type="email"
                                    className="form-control"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Phone</label>
                                <input
                                    type="tel"
                                    className="form-control"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+91 1234567890"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Password</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <small className="text-muted">Default: teacher123</small>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Category</label>
                                <select
                                    className="form-select"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="">Select Category (Optional)</option>
                                    {categories.map(cat => (
                                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                                    ))}
                                </select>
                                <small className="text-muted">Assign a category to the teacher</small>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Status</label>
                                <select
                                    className="form-select"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Access Scope</label>
                                <select
                                    className="form-select"
                                    value={formData.accessScope || 'own'}
                                    onChange={(e) => setFormData({ ...formData, accessScope: e.target.value })}
                                >
                                    <option value="own">Manage Own (Created by me)</option>
                                    <option value="global">Global Access (Manage All)</option>
                                </select>
                                <small className="text-muted">
                                    'Manage Own' restricts teacher to their own content. 'Global Access' allows managing all content (subject to permissions).
                                </small>
                            </div>

                            <div className="mb-3">
                                <label className="form-label d-block">Permissions</label>
                                <div className="row g-2">
                                    {[
                                        { id: 'manage_students', label: 'Manage Students' },
                                        { id: 'manage_exams', label: 'Manage Exams' },
                                        { id: 'manage_courses', label: 'Manage Courses' },
                                        { id: 'manage_questions', label: 'Manage Question Bank' },
                                        { id: 'view_analytics', label: 'View Analytics' },
                                        { id: 'manage_live_exams', label: 'Manage Live Exams' },
                                        { id: 'manage_content', label: 'Manage Content' },
                                        { id: 'manage_storage', label: 'Manage Storage' },
                                    ].map((perm) => (
                                        <div className="col-md-6" key={perm.id}>
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id={`perm-${perm.id}`}
                                                    checked={formData.permissions?.includes(perm.id)}
                                                    onChange={(e) => {
                                                        const currentPerms = formData.permissions || [];
                                                        if (e.target.checked) {
                                                            setFormData({ ...formData, permissions: [...currentPerms, perm.id] });
                                                        } else {
                                                            setFormData({ ...formData, permissions: currentPerms.filter(p => p !== perm.id) });
                                                        }
                                                    }}
                                                />
                                                <label className="form-check-label" htmlFor={`perm-${perm.id}`}>
                                                    {perm.label}
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Adding...' : 'Add Teacher'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default AddTeacherModal
