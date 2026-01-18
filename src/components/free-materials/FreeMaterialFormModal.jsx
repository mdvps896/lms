'use client'

import React, { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import Select from 'react-select'
import { FiPlus, FiTrash2, FiFile, FiX } from 'react-icons/fi'

const FreeMaterialFormModal = ({ isOpen, onClose, material, onSave }) => {
    const isEditing = !!material

    // Manage body scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen]);

    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState([])
    const [subjects, setSubjects] = useState([])
    const [availableSubjects, setAvailableSubjects] = useState([])
    const [availableTests, setAvailableTests] = useState([])

    const [formData, setFormData] = useState({
        title: '',
        type: 'document', // 'document', 'video', 'test'
        category: null,
        subject: null, // null for 'All'
        files: [], // Array of { title, fileData, url, publicId } for document/video
        selectedTest: null // For test type
    })

    // Init
    useEffect(() => {
        fetchCategories()
        fetchSubjects()
        if (material) {
            setFormData({
                title: material.title,
                category: material.category ? { value: material.category._id, label: material.category.name } : null,
                subject: material.subject ? { value: material.subject._id, label: material.subject.name } : null,
                files: material.files ? material.files.map(f => ({ ...f, fileData: null })) : []
            })
        }
    }, [material])

    // Fetchers
    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            if (data.success) {
                setCategories(data.data.map(c => ({ value: c._id, label: c.name })));
            }
        } catch (err) { console.error(err); }
    }

    const fetchSubjects = async () => {
        try {
            const res = await fetch('/api/subjects');
            const data = await res.json();
            if (data.success) {
                setSubjects(data.data);
            }
        } catch (err) { console.error(err); }
    }

    const fetchTests = async () => {
        try {
            const res = await fetch('/api/tests');
            const data = await res.json();
            if (data.success) {
                setAvailableTests(data.data || []);
            }
        } catch (err) { console.error(err); }
    }

    // Fetch tests when component mounts
    useEffect(() => {
        fetchTests();
    }, []);

    // Filter Subjects
    useEffect(() => {
        if (formData.category) {
            const filtered = subjects
                .filter(sub => sub.category && sub.category._id === formData.category.value)
                .map(sub => ({ value: sub._id, label: sub.name }));
            setAvailableSubjects(filtered);
        } else {
            setAvailableSubjects([]);
        }
    }, [formData.category, subjects]);

    const handleAddFileRow = () => {
        setFormData(prev => ({
            ...prev,
            files: [...prev.files, { title: '', fileData: null, url: null }]
        }))
    }

    const handleRemoveFileRow = (index) => {
        setFormData(prev => {
            const newFiles = [...prev.files]
            newFiles.splice(index, 1)
            return { ...prev, files: newFiles }
        })
    }

    const handleFileChange = (index, field, value) => {
        setFormData(prev => {
            const newFiles = [...prev.files]
            newFiles[index] = { ...newFiles[index], [field]: value }
            return { ...prev, files: newFiles }
        })
    }

    const handleFileUpload = (index, e) => {
        const file = e.target.files[0];
        if (file) {
            // File size validation removed per request


            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => {
                    const newFiles = [...prev.files]
                    newFiles[index] = {
                        ...newFiles[index],
                        fileData: reader.result,
                        // Auto-set title if empty
                        title: newFiles[index].title || file.name
                    }
                    return { ...prev, files: newFiles }
                })
            }
            reader.readAsDataURL(file);
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.title || !formData.category) {
            Swal.fire('Error', 'Please fill all required fields', 'error')
            return
        }

        // Validate based on type
        if (formData.type === 'test') {
            if (!formData.selectedTest) {
                Swal.fire('Error', 'Please select a test', 'error')
                return
            }
        } else {
            if (formData.files.length === 0) {
                Swal.fire('Error', `Please add at least one ${formData.type === 'video' ? 'video' : 'file'}`, 'error')
                return
            }

            // Validate files
            for (const file of formData.files) {
                if (!file.title) {
                    Swal.fire('Error', 'All files must have a title', 'error')
                    return
                }
                if (!file.url && !file.fileData) {
                    Swal.fire('Error', `Please upload a file for "${file.title}"`, 'error')
                    return
                }
            }
        }

        setLoading(true)
        try {
            const payload = {
                title: formData.title,
                type: formData.type,
                category: formData.category.value,
                subject: formData.subject ? formData.subject.value : null,
            }

            // Add type-specific data
            if (formData.type === 'test') {
                payload.testId = formData.selectedTest.value
            } else {
                payload.files = formData.files
            }

            const url = isEditing ? `/api/free-materials/${material._id}` : '/api/free-materials'
            const method = isEditing ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await response.json()
            if (data.success) {
                Swal.fire('Success', `Material ${isEditing ? 'updated' : 'created'} successfully`, 'success')
                onSave()
            } else {
                throw new Error(data.message)
            }
        } catch (error) {
            console.error('Submit error:', error)
            Swal.fire('Error', error.message || 'Failed to save material', 'error')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null;

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content shadow-lg border-0">
                    <div className="modal-header bg-light">
                        <h5 className="modal-title fw-bold">{isEditing ? 'Edit Material' : 'Add New Material'}</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body p-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                        <form onSubmit={handleSubmit} id="materialForm">
                            <div className="mb-3">
                                <label className="form-label required fw-semibold">Title</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Physics Chapter 1 Notes"
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label required fw-semibold">Material Type</label>
                                <div className="btn-group w-100" role="group">
                                    <input
                                        type="radio"
                                        className="btn-check"
                                        name="materialType"
                                        id="typeDocument"
                                        value="document"
                                        checked={formData.type === 'document'}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value, files: [], selectedTest: null })}
                                    />
                                    <label className="btn btn-outline-primary" htmlFor="typeDocument">
                                        <FiFile className="me-1" /> Document
                                    </label>

                                    <input
                                        type="radio"
                                        className="btn-check"
                                        name="materialType"
                                        id="typeVideo"
                                        value="video"
                                        checked={formData.type === 'video'}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value, files: [], selectedTest: null })}
                                    />
                                    <label className="btn btn-outline-primary" htmlFor="typeVideo">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-camera-video me-1" viewBox="0 0 16 16">
                                            <path fillRule="evenodd" d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2V5zm11.5 5.175 3.5 1.556V4.269l-3.5 1.556v4.35zM2 4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h7.5a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H2z" />
                                        </svg> Video
                                    </label>

                                    <input
                                        type="radio"
                                        className="btn-check"
                                        name="materialType"
                                        id="typeTest"
                                        value="test"
                                        checked={formData.type === 'test'}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value, files: [], selectedTest: null })}
                                    />
                                    <label className="btn btn-outline-primary" htmlFor="typeTest">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-clipboard-check me-1" viewBox="0 0 16 16">
                                            <path fillRule="evenodd" d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z" />
                                            <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" />
                                            <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
                                        </svg> Test
                                    </label>
                                </div>
                            </div>

                            <div className="row g-3 mb-3">
                                <div className="col-md-6">
                                    <label className="form-label required fw-semibold">Category</label>
                                    <Select
                                        options={categories}
                                        value={formData.category}
                                        onChange={(val) => setFormData({ ...formData, category: val, subject: null })}
                                        placeholder="Select Category"
                                        required
                                        classNamePrefix="select"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Subject (Optional)</label>
                                    <Select
                                        options={availableSubjects}
                                        value={formData.subject}
                                        onChange={(val) => setFormData({ ...formData, subject: val })}
                                        placeholder={formData.category ? "Select Subject or leave for All" : "Select Category first"}
                                        isDisabled={!formData.category}
                                        classNamePrefix="select"
                                        isClearable
                                    />
                                    <div className="form-text text-muted small mt-1">
                                        {!formData.subject ? "All subjects in this category will be included." : "Specific subject selected."}
                                    </div>
                                </div>
                            </div>

                            {/* Conditional Content based on Type */}
                            {formData.type === 'test' ? (
                                <div className="mb-3">
                                    <label className="form-label required fw-semibold">Select Test</label>
                                    <Select
                                        options={availableTests
                                            .filter(test => {
                                                if (!formData.category) return false;
                                                const testCategoryId = test.category?._id || test.category;
                                                return testCategoryId === formData.category.value;
                                            })
                                            .map(test => ({
                                                value: test._id,
                                                label: `${test.title} (${test.questions?.length || 0} questions)`
                                            }))
                                        }
                                        value={formData.selectedTest}
                                        onChange={(val) => setFormData({ ...formData, selectedTest: val })}
                                        placeholder={formData.category ? "Select a test from this category" : "Select category first"}
                                        isDisabled={!formData.category}
                                        classNamePrefix="select"
                                        required
                                    />
                                    <div className="form-text text-muted small mt-1">
                                        {formData.category ?
                                            `${availableTests.filter(test => {
                                                const testCategoryId = test.category?._id || test.category;
                                                return testCategoryId === formData.category.value;
                                            }).length} test(s) available in this category`
                                            : "Please select a category to see available tests"}
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-3">
                                    <label className="form-label d-flex justify-content-between align-items-center fw-semibold mb-2">
                                        <span>{formData.type === 'video' ? 'Videos' : 'Files / Documents'} <span className="text-danger">*</span></span>
                                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleAddFileRow}>
                                            <FiPlus size={14} className="me-1" /> Add {formData.type === 'video' ? 'Video' : 'File'}
                                        </button>
                                    </label>

                                    <div className="bg-light p-3 rounded border">
                                        {formData.files.length === 0 && (
                                            <div className="text-center text-muted p-3">
                                                No {formData.type === 'video' ? 'videos' : 'files'} added. Click "Add {formData.type === 'video' ? 'Video' : 'File'}" to attach {formData.type === 'video' ? 'videos' : 'documents'}.
                                            </div>
                                        )}
                                        {formData.files.map((file, index) => (
                                            <div key={index} className="card mb-3 border bg-white">
                                                <div className="card-body p-3">
                                                    <div className="d-flex justify-content-between mb-2">
                                                        <h6 className="card-title mb-0 small text-uppercase text-muted fw-bold">{formData.type === 'video' ? 'Video' : 'File'} {index + 1}</h6>
                                                        <button type="button" className="btn btn-sm text-danger p-0" onClick={() => handleRemoveFileRow(index)}>
                                                            <FiTrash2 /> Remove
                                                        </button>
                                                    </div>
                                                    <div className="row g-2">
                                                        <div className="col-md-5">
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                placeholder={`${formData.type === 'video' ? 'Video' : 'File'} Title (e.g. ${formData.type === 'video' ? 'Lecture 1' : 'Notes PDF'})`}
                                                                value={file.title}
                                                                onChange={(e) => handleFileChange(index, 'title', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="col-md-7">
                                                            {file.url ? (
                                                                <div className="input-group input-group-sm">
                                                                    <span className="input-group-text bg-success-subtle text-success"><FiFile /></span>
                                                                    <input type="text" className="form-control" value={formData.type === 'video' ? 'Video Uploaded' : 'File Uploaded'} disabled />
                                                                    <button className="btn btn-outline-secondary" type="button" onClick={() => handleFileChange(index, 'url', null)}>Change</button>
                                                                </div>
                                                            ) : (
                                                                <input
                                                                    type="file"
                                                                    className="form-control form-control-sm"
                                                                    accept={formData.type === 'video' ? 'video/*' : '*/*'}
                                                                    onChange={(e) => handleFileUpload(index, e)}
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                    <div className="modal-footer bg-light">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Close</button>
                        <button type="submit" form="materialForm" className="btn btn-primary" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Saving...
                                </>
                            ) : (
                                isEditing ? 'Update Material' : 'Create Material'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FreeMaterialFormModal
