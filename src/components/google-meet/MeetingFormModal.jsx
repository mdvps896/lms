
'use client'

import React, { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import Select from 'react-select'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { FiPlus, FiTrash2, FiLink } from 'react-icons/fi'

const MeetingFormModal = ({ isOpen, onClose, meeting, onSave }) => {
    const isEditing = !!meeting

    // Manage body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.classList.add('modal-open');
        } else {
            document.body.style.overflow = 'unset';
            document.body.classList.remove('modal-open');
        }
        return () => {
            document.body.style.overflow = 'unset';
            document.body.classList.remove('modal-open');
        }
    }, [isOpen]);

    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState([])
    const [subjects, setSubjects] = useState([])
    const [availableSubjects, setAvailableSubjects] = useState([])

    const [assignToSpecific, setAssignToSpecific] = useState(false)
    const [availableStudents, setAvailableStudents] = useState([])

    const [formData, setFormData] = useState({
        title: '',
        category: null,
        subjects: [],
        assignedUsers: [],
        startTime: new Date(),
        endTime: new Date(new Date().getTime() + 60 * 60 * 1000), // +1 hour
        links: [{ title: 'Main Link', url: '' }]
    })

    // Initialization
    useEffect(() => {
        fetchCategories()
        fetchSubjects()
        if (meeting) {
            setFormData({
                title: meeting.title,
                category: meeting.category ? { value: meeting.category._id, label: meeting.category.name } : null,
                subjects: meeting.subjects ? meeting.subjects.map(s => ({ value: s._id, label: s.name })) : [],
                assignedUsers: meeting.assignedUsers ? meeting.assignedUsers.map(u => ({ value: u._id, label: `${u.name} (${u.email})` })) : [],
                startTime: new Date(meeting.startTime),
                endTime: new Date(meeting.endTime),
                links: meeting.links.length > 0 ? meeting.links : [{ title: 'Main Link', url: '' }]
            })
            if (meeting.assignedUsers && meeting.assignedUsers.length > 0) {
                setAssignToSpecific(true)
            }
        }
    }, [meeting])

    // Fetch lists
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
                setSubjects(data.data); // Keep raw data to filter later
            }
        } catch (err) { console.error(err); }
    }

    // Filter subjects when category changes
    useEffect(() => {
        if (formData.category) {
            const filtered = subjects
                .filter(sub => sub.category && sub.category._id === formData.category.value)
                .map(sub => ({ value: sub._id, label: sub.name }));
            setAvailableSubjects(filtered);

            // Fetch students for this category
            fetchStudents(formData.category.value)
        } else {
            setAvailableSubjects([]);
            setAvailableStudents([]);
        }
    }, [formData.category, subjects]);

    const fetchStudents = async (categoryId) => {
        try {
            const res = await fetch(`/api/users?role=student&category=${categoryId}`);
            const data = await res.json();
            if (data.success) {
                const options = data.data.map(user => ({
                    value: user._id,
                    label: `${user.name} (${user.email})`
                }));
                setAvailableStudents(options);
            }
        } catch (err) { console.error(err); }
    }


    const handleAddLink = () => {
        setFormData({
            ...formData,
            links: [...formData.links, { title: '', url: '' }]
        })
    }

    const handleRemoveLink = (index) => {
        const newLinks = [...formData.links]
        newLinks.splice(index, 1)
        setFormData({ ...formData, links: newLinks })
    }

    const handleLinkChange = (index, field, value) => {
        const newLinks = [...formData.links]
        newLinks[index][field] = value
        setFormData({ ...formData, links: newLinks })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.title || !formData.category || !formData.startTime || !formData.endTime) {
            Swal.fire('Error', 'Please fill all required fields', 'error')
            return
        }

        // Filter out empty links
        const validLinks = formData.links.filter(l => l.url.trim() !== '')
        if (validLinks.length === 0) {
            Swal.fire('Error', 'Please add at least one valid meeting link', 'error')
            return
        }

        setLoading(true)
        try {
            const payload = {
                title: formData.title,
                category: formData.category.value,
                subjects: formData.subjects.map(s => s.value),
                assignedUsers: assignToSpecific ? formData.assignedUsers.map(u => u.value) : [],
                startTime: formData.startTime,
                endTime: formData.endTime,
                links: validLinks
            }

            const url = isEditing ? `/api/meetings/${meeting._id}` : '/api/meetings'
            const method = isEditing ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await response.json()
            if (data.success) {
                Swal.fire('Success', `Meeting ${isEditing ? 'updated' : 'created'} successfully`, 'success')
                onSave()
            } else {
                throw new Error(data.message)
            }
        } catch (error) {
            console.error('Submit error:', error)
            Swal.fire('Error', error.message || 'Failed to save meeting', 'error')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null;

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
                <div className="modal-content shadow-lg border-0">
                    <div className="modal-header bg-light">
                        <h5 className="modal-title fw-bold">{isEditing ? 'Edit Meeting' : 'Schedule New Meeting'}</h5>
                        <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                    </div>
                    <div className="modal-body p-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                        <form onSubmit={handleSubmit} id="meetingForm">
                            <div className="mb-3">
                                <label className="form-label required fw-semibold">Meeting Title</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Daily Standup or Math Class"
                                    required
                                />
                            </div>

                            <div className="row g-3 mb-3">
                                <div className="col-md-6">
                                    <label className="form-label required fw-semibold">Category</label>
                                    <Select
                                        options={categories}
                                        value={formData.category}
                                        onChange={(val) => setFormData({ ...formData, category: val, subjects: [] })}
                                        placeholder="Select Category"
                                        required
                                        classNamePrefix="select"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Subjects (Optional)</label>
                                    <Select
                                        isMulti
                                        options={availableSubjects}
                                        value={formData.subjects}
                                        onChange={(val) => setFormData({ ...formData, subjects: val })}
                                        placeholder={formData.category ? "Select Subjects or leave empty for all" : "Select Category first"}
                                        isDisabled={!formData.category}
                                        classNamePrefix="select"
                                    />
                                    <div className="form-text text-muted small mt-1">
                                        {formData.subjects.length === 0 ? "All subjects in this category will be included." : "Specific subjects selected."}
                                    </div>
                                </div>
                            </div>
                            <div className="form-check form-switch mb-2">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="assignSpecific"
                                    checked={assignToSpecific}
                                    onChange={(e) => setAssignToSpecific(e.target.checked)}
                                />
                                <label className="form-check-label fw-semibold" htmlFor="assignSpecific">
                                    Assign to Specific Students Only
                                </label>
                            </div>
                            {assignToSpecific && (
                                <div className="card bg-light border-0 p-3">
                                    <label className="form-label fw-semibold">Select Students</label>
                                    <Select
                                        isMulti
                                        options={availableStudents}
                                        value={formData.assignedUsers}
                                        onChange={(val) => setFormData({ ...formData, assignedUsers: val })}
                                        placeholder={formData.category ? "Search by name or email..." : "Select Category first"}
                                        isDisabled={!formData.category}
                                        classNamePrefix="select"
                                        noOptionsMessage={() => "No students found in this category"}
                                    />
                                    <div className="form-text text-muted small mt-1">
                                        {formData.assignedUsers.length === 0 ? "No students selected." : `${formData.assignedUsers.length} students selected.`}
                                    </div>
                                </div>
                            )}


                            <div className="row g-3 mb-3">
                                <div className="col-md-6">
                                    <label className="form-label required fw-semibold">Start Time</label>
                                    <DatePicker
                                        selected={formData.startTime}
                                        onChange={(date) => setFormData({ ...formData, startTime: date })}
                                        showTimeSelect
                                        dateFormat="MMMM d, yyyy h:mm aa"
                                        className="form-control w-100"
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label required fw-semibold">End Time</label>
                                    <DatePicker
                                        selected={formData.endTime}
                                        onChange={(date) => setFormData({ ...formData, endTime: date })}
                                        showTimeSelect
                                        dateFormat="MMMM d, yyyy h:mm aa"
                                        className="form-control w-100"
                                        minDate={formData.startTime}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label d-flex justify-content-between align-items-center fw-semibold mb-2">
                                    <span>Meeting Links <span className="text-danger">*</span></span>
                                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleAddLink}>
                                        <FiPlus size={14} className="me-1" /> Add Another Link
                                    </button>
                                </label>

                                <div className="bg-light p-3 rounded border">
                                    {formData.links.map((link, index) => (
                                        <div key={index} className="d-flex gap-2 mb-3 align-items-start last:mb-0">
                                            <div className="flex-grow-1">
                                                <input
                                                    type="text"
                                                    className="form-control mb-1 form-control-sm"
                                                    placeholder="Link Title (e.g. Host Link, Student Link)"
                                                    value={link.title}
                                                    onChange={(e) => handleLinkChange(index, 'title', e.target.value)}
                                                />
                                                <div className="input-group input-group-sm">
                                                    <span className="input-group-text bg-white"><FiLink /></span>
                                                    <input
                                                        type="url"
                                                        className="form-control"
                                                        placeholder="https://meet.google.com/..."
                                                        value={link.url}
                                                        onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            {formData.links.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-danger btn-sm mt-1"
                                                    onClick={() => handleRemoveLink(index)}
                                                    title="Remove Link"
                                                >
                                                    <FiTrash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </form>
                    </div>
                    <div className="modal-footer bg-light">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Close</button>
                        <button type="submit" form="meetingForm" className="btn btn-primary" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Saving...
                                </>
                            ) : (
                                isEditing ? 'Update Meeting' : 'Create Meeting'
                            )}
                        </button>
                    </div>
                </div>
            </div >
        </div >
    )
}

export default MeetingFormModal
