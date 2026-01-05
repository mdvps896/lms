import React, { useState, useEffect } from 'react'
import { FiX, FiCalendar, FiMapPin, FiBook } from 'react-icons/fi'
import Swal from 'sweetalert2'

const AddStudentModal = ({ show, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: 'student123',
        status: 'active',
        category: '',
        dob: '',
        admissionDate: new Date().toISOString().split('T')[0],
        address: '',
        city: '',
        state: '',
        pincode: '',
        enrolledCourses: [] // Array of course IDs
    })
    const [categories, setCategories] = useState([])
    const [courses, setCourses] = useState([])
    const [loading, setLoading] = useState(false)
    const [loadingCourses, setLoadingCourses] = useState(false)

    useEffect(() => {
        if (show) {
            fetchCategories()
            fetchCourses()
        }
    }, [show])

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/categories?status=active')
            const data = await response.json()
            if (data.success) setCategories(data.data)
        } catch (error) {
            console.error('Error fetching categories:', error)
        }
    }

    const fetchCourses = async () => {
        try {
            setLoadingCourses(true)
            const response = await fetch('/api/courses?status=active')
            const data = await response.json()
            if (data.success && Array.isArray(data.data)) {
                setCourses(data.data)
            } else {
                setCourses([])
            }
        } catch (error) {
            console.error('Error fetching courses:', error)
            setCourses([])
        } finally {
            setLoadingCourses(false)
        }
    }

    const handleCourseToggle = (courseId) => {
        const idStr = String(courseId);
        setFormData(prev => {
            const isSelected = prev.enrolledCourses.some(id => String(id) === idStr);
            return {
                ...prev,
                enrolledCourses: isSelected
                    ? prev.enrolledCourses.filter(id => String(id) !== idStr)
                    : [...prev.enrolledCourses, idStr]
            };
        });
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.name || !formData.email || !formData.category) {
            Swal.fire({
                icon: 'error',
                title: 'Required Fields',
                text: 'Name, Email and Category are mandatory.',
                timer: 2000
            })
            return
        }

        setLoading(true)

        try {
            // Prepare enrolledCourses for API
            const formattedEnrolledCourses = formData.enrolledCourses.map(id => ({
                courseId: id,
                enrolledAt: new Date(),
                expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) // Default 1 year
            }))

            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    role: 'student',
                    enrolledCourses: formattedEnrolledCourses
                }),
            })

            const data = await response.json()

            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Student Created!',
                    text: `${formData.name} has been added successfully`,
                    timer: 2000,
                    showConfirmButton: false
                })

                onSuccess()
                onClose()
                setFormData({
                    name: '', email: '', phone: '', password: 'student123', status: 'active',
                    category: '', dob: '', admissionDate: new Date().toISOString().split('T')[0],
                    address: '', city: '', state: '', pincode: '', enrolledCourses: []
                })
            } else {
                Swal.fire('Error', data.message || 'Failed to add student', 'error')
            }
        } catch (error) {
            Swal.fire('Error', 'Connection failed', 'error')
        } finally {
            setLoading(false)
        }
    }

    if (!show) return null

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060, overflowY: 'auto' }} onClick={onClose}>
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content border-0 shadow-lg">
                    <div className="modal-header bg-primary text-white py-3">
                        <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                            Add New Student Profile
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="modal-body p-4">
                            <div className="row g-3">
                                {/* Basic Info Section */}
                                <div className="col-12 border-bottom pb-2 mb-2">
                                    <h6 className="text-primary fw-bold mb-0">Personal Details</h6>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">Full Name <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter student name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">Email Address <span className="text-danger">*</span></label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        placeholder="email@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">Phone Number</label>
                                    <input
                                        type="tel"
                                        className="form-control"
                                        placeholder="+91 0000000000"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">Date of Birth</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light"><FiCalendar size={14} /></span>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={formData.dob}
                                            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Admission Section */}
                                <div className="col-12 border-bottom pb-2 mb-2 mt-4">
                                    <h6 className="text-primary fw-bold mb-0">Academic & Admission</h6>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">Admission Date (Join Date) <span className="text-danger">*</span></label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light"><FiCalendar size={14} /></span>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={formData.admissionDate}
                                            onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">Category (Target Exam) <span className="text-danger">*</span></label>
                                    <select
                                        className="form-select border-primary-subtle"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map((cat, idx) => (
                                            <option key={String(cat._id || `cat-${idx}`)} value={cat._id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Address Section */}
                                <div className="col-12 border-bottom pb-2 mb-2 mt-4">
                                    <h6 className="text-primary fw-bold mb-0">Location / Address</h6>
                                </div>

                                <div className="col-12">
                                    <label className="form-label small fw-bold">Street Address</label>
                                    <textarea
                                        className="form-control"
                                        rows="2"
                                        placeholder="H-No, Street, Area..."
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    ></textarea>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label small fw-bold">City</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="City"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label small fw-bold">State</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="State"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label small fw-bold">Pincode</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="6 Digits"
                                        value={formData.pincode}
                                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                    />
                                </div>

                                {/* Security / Status */}
                                <div className="col-12 border-bottom pb-2 mb-2 mt-4">
                                    <h6 className="text-primary fw-bold mb-0">Account Settings</h6>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">Default Password</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">Account Status</label>
                                    <select
                                        className="form-select"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="active">Active (Full Access)</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer bg-light">
                            <button type="button" className="btn btn-secondary px-4 fw-bold" onClick={onClose} disabled={loading}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary px-5 fw-bold shadow-sm" disabled={loading}>
                                {loading ? (
                                    <><span className="spinner-border spinner-border-sm me-2"></span> Saving...</>
                                ) : (
                                    'Create Student'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default AddStudentModal