'use client';
import React, { useState, useEffect } from 'react';
import { FiX, FiRefreshCw } from 'react-icons/fi';
import Swal from 'sweetalert2';
import MultiSelectTags from '@/components/shared/MultiSelectTags';

export default function CouponModal({ show, onHide, coupon, onSuccess }) {
    const [formData, setFormData] = useState({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        applicationType: 'all',
        courses: [],
        categories: [],
        students: [],
        startDate: '',
        endDate: '',
        maxUses: '',
        isActive: true
    });

    const [courses, setCourses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (show) {
            fetchCoursesAndCategories();
            if (coupon) {
                // Edit mode
                setFormData({
                    code: coupon.code || '',
                    discountType: coupon.discountType || 'percentage',
                    discountValue: coupon.discountValue || '',
                    applicationType: coupon.applicationType || 'all',
                    courses: coupon.courses?.map(c => c._id) || [],
                    categories: coupon.categories?.map(c => c._id) || [],
                    startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().split('T')[0] : '',
                    endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().split('T')[0] : '',
                    maxUses: coupon.maxUses || '',
                    isActive: coupon.isActive !== undefined ? coupon.isActive : true
                });
            } else {
                // Create mode - set default dates
                const today = new Date().toISOString().split('T')[0];
                const nextMonth = new Date();
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                const endDate = nextMonth.toISOString().split('T')[0];

                setFormData(prev => ({
                    ...prev,
                    startDate: today,
                    endDate: endDate
                }));
            }
        }
    }, [show, coupon]);

    const fetchCoursesAndCategories = async () => {
        try {
            setLoadingData(true);

            // Fetch all data
            const [coursesRes, categoriesRes, studentsRes] = await Promise.all([
                fetch('/api/courses'),
                fetch('/api/categories'),
                fetch('/api/students').catch(() => null) // Handle students API not existing
            ]);

            // Process courses
            if (coursesRes.ok) {
                const coursesData = await coursesRes.json();
                if (coursesData.success) {
                    setCourses(coursesData.data);
                }
            } else {
                console.error('Courses API error:', coursesRes.status);
            }

            // Process categories
            if (categoriesRes.ok) {
                const categoriesData = await categoriesRes.json();
                if (categoriesData.success) {
                    setCategories(categoriesData.data);
                }
            } else {
                console.error('Categories API error:', categoriesRes.status);
            }

            // Process students (optional - may not exist)
            if (studentsRes && studentsRes.ok) {
                try {
                    const studentsData = await studentsRes.json();
                    if (studentsData.success) {
                        setStudents(studentsData.data);
                    }
                } catch (err) {
                    console.warn('Students API not available - feature disabled');
                    setStudents([]);
                }
            } else {
                console.warn('Students API not available (404) - feature disabled');
                setStudents([]);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoadingData(false);
        }
    };

    const generateRandomCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData(prev => ({ ...prev, code }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = coupon ? `/api/coupons/${coupon._id}` : '/api/coupons';
            const method = coupon ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    maxUses: formData.maxUses ? parseInt(formData.maxUses) : null
                })
            });

            const data = await response.json();

            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: coupon ? 'Updated!' : 'Created!',
                    text: data.message,
                    timer: 2000,
                    showConfirmButton: false
                });
                onSuccess();
            } else {
                Swal.fire('Error', data.message, 'error');
            }
        } catch (error) {
            console.error('Error saving coupon:', error);
            Swal.fire('Error', 'Failed to save coupon', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleMultiSelect = (e, field) => {
        const options = Array.from(e.target.selectedOptions, option => option.value);
        setFormData(prev => ({ ...prev, [field]: options }));
    };

    if (!show) return null;

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{coupon ? 'Edit Coupon' : 'Create Coupon'}</h5>
                        <button type="button" className="btn-close" onClick={onHide}></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            {loadingData ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="row g-3">
                                    {/* Coupon Code */}
                                    <div className="col-12">
                                        <label className="form-label">Coupon Code *</label>
                                        <div className="input-group">
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="code"
                                                value={formData.code}
                                                onChange={handleChange}
                                                placeholder="SUMMER2024"
                                                required
                                                style={{ textTransform: 'uppercase' }}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary"
                                                onClick={generateRandomCode}
                                                title="Generate Random Code"
                                            >
                                                <FiRefreshCw />
                                            </button>
                                        </div>
                                        <small className="text-muted">Unique code that users will enter</small>
                                    </div>

                                    {/* Discount Type & Value */}
                                    <div className="col-md-6">
                                        <label className="form-label">Discount Type *</label>
                                        <select
                                            className="form-select"
                                            name="discountType"
                                            value={formData.discountType}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="flat">Flat Amount (₹)</option>
                                        </select>
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">Discount Value *</label>
                                        <div className="input-group">
                                            {formData.discountType === 'flat' && (
                                                <span className="input-group-text">₹</span>
                                            )}
                                            <input
                                                type="number"
                                                className="form-control"
                                                name="discountValue"
                                                value={formData.discountValue}
                                                onChange={handleChange}
                                                min="0"
                                                max={formData.discountType === 'percentage' ? '100' : undefined}
                                                required
                                            />
                                            {formData.discountType === 'percentage' && (
                                                <span className="input-group-text">%</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Application Type */}
                                    <div className="col-12">
                                        <label className="form-label">Apply To *</label>
                                        <select
                                            className="form-select"
                                            name="applicationType"
                                            value={formData.applicationType}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="all">All Courses</option>
                                            <option value="specific">Specific Courses</option>
                                            <option value="category">Specific Categories</option>
                                            <option value="students">Specific Students</option>
                                        </select>
                                    </div>

                                    {/* Course Selection */}
                                    {formData.applicationType === 'specific' && (
                                        <div className="col-12">
                                            <MultiSelectTags
                                                options={courses.map(c => ({
                                                    value: c._id || c.id,
                                                    label: c.title,
                                                    color: '#3b82f6'
                                                }))}
                                                defaultSelect={courses
                                                    .filter(c => formData.courses.includes(c._id || c.id))
                                                    .map(c => ({
                                                        value: c._id || c.id,
                                                        label: c.title,
                                                        color: '#3b82f6'
                                                    }))}
                                                placeholder="Select courses..."
                                                onChange={(selected) => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        courses: selected.map(s => s.value)
                                                    }));
                                                }}
                                            />
                                            <small className="text-muted d-block mt-2">
                                                Coupon will be valid for selected courses only
                                            </small>
                                        </div>
                                    )}

                                    {/* Category Selection */}
                                    {formData.applicationType === 'category' && (
                                        <div className="col-12">
                                            <MultiSelectTags
                                                options={categories.map(c => ({
                                                    value: c._id || c.id,
                                                    label: c.name,
                                                    color: '#f59e0b'
                                                }))}
                                                defaultSelect={categories
                                                    .filter(c => formData.categories.includes(c._id || c.id))
                                                    .map(c => ({
                                                        value: c._id || c.id,
                                                        label: c.name,
                                                        color: '#f59e0b'
                                                    }))}
                                                placeholder="Select categories..."
                                                onChange={(selected) => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        categories: selected.map(s => s.value)
                                                    }));
                                                }}
                                            />
                                            <small className="text-muted d-block mt-2">
                                                Coupon will be valid for all courses in selected categories
                                            </small>
                                        </div>
                                    )}

                                    {/* Students Selection */}
                                    {formData.applicationType === 'students' && (
                                        <div className="col-12">
                                            <MultiSelectTags
                                                options={students.map(s => ({
                                                    value: s._id,
                                                    label: `${s.name} (${s.email})`,
                                                    color: '#10b981'
                                                }))}
                                                defaultSelect={students
                                                    .filter(s => formData.students.includes(s._id))
                                                    .map(s => ({
                                                        value: s._id,
                                                        label: `${s.name} (${s.email})`,
                                                        color: '#10b981'
                                                    }))}
                                                placeholder="Select students..."
                                                onChange={(selected) => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        students: selected.map(s => s.value)
                                                    }));
                                                }}
                                            />
                                            <small className="text-muted d-block mt-2">
                                                Coupon will be available only to selected students
                                            </small>
                                        </div>
                                    )}

                                    {/* Date Range */}
                                    <div className="col-md-6">
                                        <label className="form-label">Start Date *</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            name="startDate"
                                            value={formData.startDate}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">End Date *</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            name="endDate"
                                            value={formData.endDate}
                                            onChange={handleChange}
                                            min={formData.startDate}
                                            required
                                        />
                                    </div>

                                    {/* Max Uses */}
                                    <div className="col-md-6">
                                        <label className="form-label">Max Uses</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="maxUses"
                                            value={formData.maxUses}
                                            onChange={handleChange}
                                            min="1"
                                            placeholder="Unlimited"
                                        />
                                        <small className="text-muted">Leave empty for unlimited</small>
                                    </div>

                                    {/* Active Status */}
                                    <div className="col-md-6">
                                        <label className="form-label d-block">Status</label>
                                        <div className="form-check form-switch mt-2">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                name="isActive"
                                                checked={formData.isActive}
                                                onChange={handleChange}
                                            />
                                            <label className="form-check-label">
                                                {formData.isActive ? 'Active' : 'Inactive'}
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onHide}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading || loadingData}>
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Saving...
                                    </>
                                ) : (
                                    coupon ? 'Update Coupon' : 'Create Coupon'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
