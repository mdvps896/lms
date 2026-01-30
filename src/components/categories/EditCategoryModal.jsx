'use client'

import React, { useState, useEffect } from 'react'
import Swal from 'sweetalert2'

const EditCategoryModal = ({ show, category, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'active',
        isPublished: true
    })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name,
                description: category.description || '',
                status: category.status || 'active',
                isPublished: category.isPublished !== undefined ? category.isPublished : true
            })
        }
    }, [category])

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.name) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Category name is required',
                timer: 2000
            })
            return
        }

        setLoading(true)

        try {
            const response = await fetch(`/api/categories/${category.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Updated!',
                    text: 'Category updated successfully',
                    timer: 1500,
                    showConfirmButton: false
                })

                onSuccess()
                onClose()
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: data.message || 'Failed to update category',
                    timer: 2000
                })
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to update category',
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
                        <h5 className="modal-title">Edit Category</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label">Category Name <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-control"
                                    rows="4"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Enter category description"
                                />
                            </div>
                            <div className="mb-3">
                                <select
                                    className="form-select"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="mb-3">
                                <div className="form-check form-switch">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="editIsPublishedSwitch"
                                        checked={formData.isPublished}
                                        onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                                    />
                                    <label className="form-check-label" htmlFor="editIsPublishedSwitch">
                                        Published (Visible in App)
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Updating...' : 'Update Category'}
                            </button>
                        </div>
                    </form>
                </div>
            </div >
        </div >
    )
}

export default EditCategoryModal
