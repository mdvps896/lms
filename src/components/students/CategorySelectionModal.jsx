'use client'
import React, { useState, useEffect } from 'react'
import { FiBookOpen, FiSave, FiAlertCircle, FiX } from 'react-icons/fi'

const CategorySelectionModal = ({ show, userId, onCategorySelected }) => {
    const [categories, setCategories] = useState([])
    const [selectedCategory, setSelectedCategory] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (show) {
            fetchCategories()
        }
    }, [show])

    const fetchCategories = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch('/api/categories')
            const data = await response.json()

            if (data.success) {
                setCategories(data.data || [])
            } else {
                setError('Failed to load categories')
            }
        } catch (error) {
            console.error('Error fetching categories:', error)
            setError('Failed to load categories. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!selectedCategory) {
            setError('Please select a category')
            return
        }

        setSaving(true)
        setError(null)

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    category: selectedCategory
                })
            })

            const data = await response.json()

            if (data.success) {
                // Call the callback to refresh user data and close modal
                onCategorySelected(selectedCategory)
            } else {
                setError(data.error || 'Failed to save category')
            }
        } catch (error) {
            console.error('Error saving category:', error)
            setError('Failed to save category. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    if (!show) return null

    return (
        <>
            {/* Modal Backdrop */}
            <div 
                className="modal-backdrop fade show" 
                style={{ zIndex: 1050 }}
            ></div>

            {/* Modal */}
            <div 
                className="modal fade show d-block" 
                tabIndex="-1" 
                style={{ zIndex: 1055 }}
                aria-modal="true"
                role="dialog"
            >
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header border-0 pb-0">
                            <h5 className="modal-title d-flex align-items-center">
                                <FiBookOpen className="me-2 text-primary" size={24} />
                                Select Your Category
                            </h5>
                        </div>
                        <div className="modal-body">
                            <div className="alert alert-info d-flex align-items-start" role="alert">
                                <FiAlertCircle className="me-2 mt-1 flex-shrink-0" size={20} />
                                <div>
                                    <strong>Welcome!</strong>
                                    <p className="mb-0 mt-1 small">
                                        Please select your category to access exams and start your learning journey. 
                                        This will help us show you the most relevant content.
                                    </p>
                                </div>
                            </div>

                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            )}

                            {loading ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading categories...</span>
                                    </div>
                                    <p className="mt-2 text-muted">Loading categories...</p>
                                </div>
                            ) : categories.length === 0 ? (
                                <div className="alert alert-warning" role="alert">
                                    No categories available. Please contact your administrator.
                                </div>
                            ) : (
                                <div className="mb-3">
                                    <label htmlFor="categorySelect" className="form-label fw-bold">
                                        Choose Category <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        id="categorySelect"
                                        className="form-select form-select-lg"
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        disabled={saving}
                                    >
                                        <option value="">-- Select a Category --</option>
                                        {categories.map(category => (
                                            <option key={category._id} value={category._id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                    <small className="form-text text-muted mt-1 d-block">
                                        Select the category that matches your course or program
                                    </small>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer border-0 pt-0">
                            <button
                                className="btn btn-primary btn-lg w-100"
                                onClick={handleSave}
                                disabled={!selectedCategory || saving || loading}
                            >
                                {saving ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <FiSave className="me-2" />
                                        Save and Continue
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default CategorySelectionModal
