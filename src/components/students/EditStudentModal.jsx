import React, { useState, useEffect } from 'react'
import { FiX, FiCalendar, FiMapPin, FiBook, FiChevronDown } from 'react-icons/fi'
import Swal from 'sweetalert2'

const EditStudentModal = ({ show, student, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '', // Leave empty to not change
        status: 'active',
        category: '',
        dob: '',
        admissionDate: '',
        address: '',
        enrolledCourses: [] // Array of course IDs
    })
    const [categories, setCategories] = useState([])
    const [courses, setCourses] = useState([])
    const [loading, setLoading] = useState(false)
    const [loadingCourses, setLoadingCourses] = useState(false)
    const [showCourseDropdown, setShowCourseDropdown] = useState(false)

    useEffect(() => {
        if (show) {
            fetchCategories()
            fetchCourses()
        }
    }, [show])

    useEffect(() => {
        if (student) {
            setFormData({
                name: student.name || '',
                email: student.email || '',
                phone: student.phone || '',
                password: '', // Don't pre-fill password
                status: student.status || 'active',
                category: student.categoryId || student.category?._id || (typeof student.category === 'string' && student.category.length === 24 ? student.category : ''),
                dob: student.dob ? new Date(student.dob).toISOString().split('T')[0] : '',
                admissionDate: student.admissionDate ? new Date(student.admissionDate).toISOString().split('T')[0] :
                    (student.enrollmentDate && !isNaN(new Date(student.enrollmentDate).getTime()) ? new Date(student.enrollmentDate).toISOString().split('T')[0] : ''),
                address: student.address || '',
                enrolledCourses: student.enrolledCourses?.map(ec => {
                    // Handle populated or direct ID
                    return typeof ec.courseId === 'object' ? ec.courseId._id : ec.courseId;
                }) || []
            })
        }
    }, [student])

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

    const toggleCourseSelection = (courseId) => {
        setFormData(prev => {
            const current = prev.enrolledCourses;
            const isSelected = current.includes(courseId);
            if (isSelected) {
                return { ...prev, enrolledCourses: current.filter(id => id !== courseId) };
            } else {
                return { ...prev, enrolledCourses: [...current, courseId] };
            }
        });
    };

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
            const formattedEnrolledCourses = formData.enrolledCourses.map(id => {
                // Check if it was already enrolled to keep original enrollment date
                const existing = student.enrolledCourses?.find(ec => {
                    const existingId = typeof ec.courseId === 'object' ? ec.courseId._id : ec.courseId;
                    return existingId === id;
                });

                return {
                    courseId: id,
                    enrolledAt: existing ? existing.enrolledAt : new Date(),
                    expiresAt: existing ? existing.expiresAt : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                    status: 'active'
                }
            })

            const payload = {
                ...formData,
                role: 'student',
                enrolledCourses: formattedEnrolledCourses
            };

            // Only send password if it's not empty
            if (!payload.password) delete payload.password;

            const studentId = student._id || student.id;
            if (!studentId) {
                Swal.fire('Error', 'Invalid User ID', 'error');
                setLoading(false);
                return;
            }

            const response = await fetch(`/api/users/${studentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const data = await response.json()

            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Student Updated!',
                    text: `${formData.name} has been updated successfully`,
                    timer: 2000,
                    showConfirmButton: false
                })

                onSuccess()
                onClose()
            } else {
                Swal.fire('Error', data.message || 'Failed to update student', 'error')
            }
        } catch (error) {
            Swal.fire('Error', 'Connection failed', 'error')
        } finally {
            setLoading(false)
        }
    }

    if (!show) return null

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }} onClick={onClose}>
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="modal-content border-0 shadow-lg">
                    {/* Header */}
                    <div className="modal-header bg-warning text-dark py-3">
                        <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                            Edit Student Profile
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>

                    {/* Body */}
                    <div className="modal-body p-4">
                        <div className="row g-3">
                            {/* Personal Details */}
                            <div className="col-12 border-bottom pb-2 mb-2">
                                <h6 className="text-warning-emphasis fw-bold mb-0">Personal Details</h6>
                            </div>

                            <div className="col-md-3">
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

                            <div className="col-md-3">
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

                            <div className="col-md-3">
                                <label className="form-label small fw-bold">Phone Number</label>
                                <input
                                    type="tel"
                                    className="form-control"
                                    placeholder="+91 0000000000"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>

                            <div className="col-md-3">
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

                            {/* Academic & Admission */}
                            <div className="col-12 border-bottom pb-2 mb-2 mt-4">
                                <h6 className="text-warning-emphasis fw-bold mb-0">Academic & Admission</h6>
                            </div>

                            <div className="col-md-3">
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

                            <div className="col-md-3">
                                <label className="form-label small fw-bold">Category (Target Exam) <span className="text-danger">*</span></label>
                                <select
                                    className="form-select border-warning-subtle"
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

                            {/* Assign Courses */}
                            <div className="col-12 border-bottom pb-2 mb-2 mt-4">
                                <h6 className="text-warning-emphasis fw-bold mb-0">Assign Courses</h6>
                            </div>

                            <div className="col-12">
                                <label className="form-label small fw-bold">Select Courses to Assign</label>
                                <div className="position-relative">
                                    <div
                                        className="form-control d-flex justify-content-between align-items-center"
                                        style={{ cursor: 'pointer', backgroundColor: '#fff' }}
                                        onClick={() => setShowCourseDropdown(!showCourseDropdown)}
                                    >
                                        <span className={formData.enrolledCourses.length === 0 ? 'text-muted' : ''}>
                                            {formData.enrolledCourses.length > 0
                                                ? `${formData.enrolledCourses.length} Course(s) Selected`
                                                : 'Select Courses...'}
                                        </span>
                                        <FiChevronDown />
                                    </div>

                                    {showCourseDropdown && (
                                        <div className="position-absolute w-100 bg-white border shadow-sm rounded-bottom mt-1 p-2"
                                            style={{ zIndex: 1050, maxHeight: '200px', overflowY: 'auto' }}>
                                            {loadingCourses ? (
                                                <div className="text-center py-2 text-muted small">Loading courses...</div>
                                            ) : courses.length > 0 ? (
                                                courses.map(course => {
                                                    const courseId = course._id || course.id;
                                                    if (!courseId) return null;
                                                    return (
                                                        <div key={courseId} className="form-check py-1">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                id={`course-${courseId}`}
                                                                checked={formData.enrolledCourses.includes(courseId)}
                                                                onChange={() => toggleCourseSelection(courseId)}
                                                                style={{ cursor: 'pointer' }}
                                                            />
                                                            <label className="form-check-label w-100 ps-1" htmlFor={`course-${courseId}`} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                                                {course.title || course.name}
                                                            </label>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="text-center py-2 text-muted small">No active courses found</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Location / Address */}
                            <div className="col-12 border-bottom pb-2 mb-2 mt-4">
                                <h6 className="text-warning-emphasis fw-bold mb-0">Location / Address</h6>
                            </div>

                            <div className="col-12">
                                <label className="form-label small fw-bold">Address</label>
                                <textarea
                                    className="form-control"
                                    rows="3"
                                    placeholder="Enter full address here..."
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                ></textarea>
                            </div>

                            {/* Account Settings */}
                            <div className="col-12 border-bottom pb-2 mb-2 mt-4">
                                <h6 className="text-warning-emphasis fw-bold mb-0">Account Settings</h6>
                            </div>

                            <div className="col-md-3">
                                <label className="form-label small fw-bold">Change Password</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Leave empty to keep current"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>

                            <div className="col-md-3">
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

                    {/* Footer */}
                    <div className="modal-footer bg-light">
                        <button type="button" className="btn btn-secondary px-4 fw-bold" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-warning px-5 fw-bold shadow-sm" disabled={loading}>
                            {loading ? (
                                <><span className="spinner-border spinner-border-sm me-2"></span> Saving...</>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default EditStudentModal
