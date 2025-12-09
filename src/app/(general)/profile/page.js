'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-toastify'
import { FiUser, FiMail, FiPhone, FiCamera, FiSave, FiHash, FiBookOpen, FiBook } from 'react-icons/fi'

const ProfilePage = () => {
    const { user } = useAuth()
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        username: user?.username || ''
    })
    const [loading, setLoading] = useState(false)
    const [imageLoading, setImageLoading] = useState(false)
    const [categoryData, setCategoryData] = useState(null)
    const [subjects, setSubjects] = useState([])
    const [categoryLoading, setCategoryLoading] = useState(false)

    useEffect(() => {
        if (user?.role === 'student') {
            fetchCategoryAndSubjects()
        }
    }, [user])

    const fetchCategoryAndSubjects = async () => {
        setCategoryLoading(true)
        try {
            const response = await fetch('/api/users/category-subjects')
            const data = await response.json()

            if (data.success) {
                setCategoryData(data.data.category)
                setSubjects(data.data.subjects)
            }
        } catch (error) {
            console.error('Error fetching category and subjects:', error)
        } finally {
            setCategoryLoading(false)
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleProfileUpdate = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name,
                    phone: formData.phone
                })
            })

            const data = await response.json()

            if (data.success) {
                // Update user in localStorage
                const updatedUser = { ...user, ...formData }
                localStorage.setItem('user', JSON.stringify(updatedUser))
                
                toast.success('Profile updated successfully!')
            } else {
                toast.error(data.message || 'Failed to update profile')
            }
        } catch (error) {
            console.error('Profile update error:', error)
            toast.error('Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB')
            return
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file')
            return
        }

        setImageLoading(true)

        try {
            const formData = new FormData()
            formData.append('profileImage', file)

            const response = await fetch('/api/users/upload-profile-image', {
                method: 'POST',
                body: formData
            })

            const data = await response.json()

            if (data.success) {
                // Update user in localStorage
                const updatedUser = { ...user, profileImage: data.imageUrl }
                localStorage.setItem('user', JSON.stringify(updatedUser))
                
                toast.success('Profile image updated successfully!')
                window.location.reload() // Refresh to show new image
            } else {
                toast.error(data.message || 'Failed to upload image')
            }
        } catch (error) {
            console.error('Image upload error:', error)
            toast.error('Failed to upload image')
        } finally {
            setImageLoading(false)
        }
    }

    const renderProfileImage = () => {
        if (user?.profileImage) {
            return (
                <img 
                    src={user.profileImage} 
                    alt="Profile" 
                    className="rounded-circle"
                    style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                />
            )
        } else {
            return (
                <div 
                    className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle"
                    style={{ width: '120px', height: '120px' }}
                >
                    <FiUser size={50} />
                </div>
            )
        }
    }

    return (
        <div className="nxl-content">
            <div className="page-header">
                <div className="page-header-left d-flex align-items-center">
                    <div className="page-header-title">
                        <h5 className="m-b-10">My Profile</h5>
                    </div>
                    <ul className="breadcrumb">
                        <li className="breadcrumb-item"><a href="/">Home</a></li>
                        <li className="breadcrumb-item">My Profile</li>
                    </ul>
                </div>
            </div>

            <div className="main-content">
                <div className="row">
                    <div className="col-lg-8">
                        <div className="card border-top-0">
                            <div className="card-header">
                                <h5 className="card-title">Profile Information</h5>
                            </div>
                            <div className="card-body">
                                <form onSubmit={handleProfileUpdate}>
                                    <div className="row">
                                        <div className="col-md-12 mb-4">
                                            <div className="text-center">
                                                {renderProfileImage()}
                                                <div className="mt-3">
                                                    <label className="btn btn-outline-primary btn-sm">
                                                        <FiCamera className="me-1" />
                                                        {imageLoading ? 'Uploading...' : 'Change Photo'}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            style={{ display: 'none' }}
                                                            onChange={handleImageUpload}
                                                            disabled={imageLoading}
                                                        />
                                                    </label>
                                                    <p className="text-muted mt-2 mb-0">
                                                        JPG, PNG or GIF (max 5MB)
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label className="form-label">Full Name</label>
                                                <div className="input-group">
                                                    <span className="input-group-text">
                                                        <FiUser />
                                                    </span>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleInputChange}
                                                        placeholder="Enter your full name"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {user?.role !== 'student' && (
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label className="form-label">Username</label>
                                                    <div className="input-group">
                                                        <span className="input-group-text">@</span>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            name="username"
                                                            value={formData.username}
                                                            placeholder="Enter username"
                                                            readOnly
                                                            disabled
                                                        />
                                                    </div>
                                                    <small className="text-muted">Username cannot be changed</small>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label className="form-label">Email Address</label>
                                                <div className="input-group">
                                                    <span className="input-group-text">
                                                        <FiMail />
                                                    </span>
                                                    <input
                                                        type="email"
                                                        className="form-control"
                                                        name="email"
                                                        value={formData.email}
                                                        placeholder="Enter email address"
                                                        readOnly
                                                        disabled
                                                    />
                                                </div>
                                                <small className="text-muted">Email cannot be changed</small>
                                            </div>
                                        </div>
                                        
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label className="form-label">Phone Number</label>
                                                <div className="input-group">
                                                    <span className="input-group-text">
                                                        <FiPhone />
                                                    </span>
                                                    <input
                                                        type="tel"
                                                        className="form-control"
                                                        name="phone"
                                                        value={formData.phone}
                                                        onChange={handleInputChange}
                                                        placeholder="Enter phone number"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {user?.role === 'student' && (
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label className="form-label">Roll Number</label>
                                                    <div className="input-group">
                                                        <span className="input-group-text">
                                                            <FiHash />
                                                        </span>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={user?.rollNumber || 'Not Assigned'}
                                                            readOnly
                                                            disabled
                                                        />
                                                    </div>
                                                    <small className="text-muted">Roll number is auto-assigned</small>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="d-flex justify-content-end gap-2">
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={loading}
                                        >
                                            <FiSave className="me-1" />
                                            {loading ? 'Updating...' : 'Update Profile'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-4">
                        <div className="card border-top-0">
                            <div className="card-header">
                                <h5 className="card-title">Account Info</h5>
                            </div>
                            <div className="card-body">
                                <div className="mb-3">
                                    <label className="text-muted">Role</label>
                                    <p className="mb-0">
                                        <span className={`badge ${getRoleBadgeClass(user?.role)}`}>
                                            {user?.role?.toUpperCase() || 'USER'}
                                        </span>
                                    </p>
                                </div>
                                <div className="mb-3">
                                    <label className="text-muted">Account Status</label>
                                    <p className="mb-0">
                                        <span className="badge bg-soft-success text-success">
                                            {user?.status?.toUpperCase() || 'ACTIVE'}
                                        </span>
                                    </p>
                                </div>
                                <div className="mb-3">
                                    <label className="text-muted">Member Since</label>
                                    <p className="mb-0">
                                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                                {user?.emailVerified !== undefined && (
                                    <div className="mb-3">
                                        <label className="text-muted">Email Verification</label>
                                        <p className="mb-0">
                                            <span className={`badge ${user.emailVerified ? 'bg-soft-success text-success' : 'bg-soft-warning text-warning'}`}>
                                                {user.emailVerified ? 'VERIFIED' : 'PENDING'}
                                            </span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {user?.role === 'student' && (
                            <>
                                <div className="card border-top-0 mt-3">
                                    <div className="card-header">
                                        <h5 className="card-title">
                                            <FiBookOpen className="me-2" />
                                            Category
                                        </h5>
                                    </div>
                                    <div className="card-body">
                                        {categoryLoading ? (
                                            <div className="text-center py-3">
                                                <div className="spinner-border spinner-border-sm text-primary" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                            </div>
                                        ) : categoryData ? (
                                            <div>
                                                <div className="d-flex align-items-center mb-2">
                                                    <div className="avatar-text avatar-sm bg-soft-primary text-primary me-2">
                                                        <FiBookOpen />
                                                    </div>
                                                    <div>
                                                        <h6 className="mb-0">{categoryData.name}</h6>
                                                        <span className={`badge badge-sm ${categoryData.status === 'active' ? 'bg-soft-success text-success' : 'bg-soft-danger text-danger'}`}>
                                                            {categoryData.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                {categoryData.description && (
                                                    <p className="text-muted small mb-0">{categoryData.description}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center text-muted py-3">
                                                <FiBookOpen size={30} className="mb-2 opacity-50" />
                                                <p className="mb-0 small">No category assigned</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="card border-top-0 mt-3">
                                    <div className="card-header">
                                        <h5 className="card-title">
                                            <FiBook className="me-2" />
                                            Subjects
                                        </h5>
                                    </div>
                                    <div className="card-body">
                                        {categoryLoading ? (
                                            <div className="text-center py-3">
                                                <div className="spinner-border spinner-border-sm text-primary" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                            </div>
                                        ) : subjects.length > 0 ? (
                                            <div className="list-group list-group-flush">
                                                {subjects.map((subject, index) => (
                                                    <div 
                                                        key={subject._id} 
                                                        className={`list-group-item px-0 ${index === 0 ? 'pt-0' : ''} ${index === subjects.length - 1 ? 'pb-0' : ''}`}
                                                    >
                                                        <div className="d-flex align-items-center">
                                                            <div className="avatar-text avatar-sm bg-soft-info text-info me-2">
                                                                <FiBook size={14} />
                                                            </div>
                                                            <div className="flex-grow-1">
                                                                <h6 className="mb-0 fs-13">{subject.name}</h6>
                                                                {subject.description && (
                                                                    <small className="text-muted">{subject.description}</small>
                                                                )}
                                                            </div>
                                                            <span className={`badge badge-sm ${subject.status === 'active' ? 'bg-soft-success text-success' : 'bg-soft-danger text-danger'}`}>
                                                                {subject.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center text-muted py-3">
                                                <FiBook size={30} className="mb-2 opacity-50" />
                                                <p className="mb-0 small">
                                                    {categoryData ? 'No subjects available for this category' : 'Assign a category to see subjects'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

const getRoleBadgeClass = (role) => {
    switch (role) {
        case 'admin':
            return 'bg-soft-danger text-danger'
        case 'teacher':
            return 'bg-soft-warning text-warning'
        case 'student':
            return 'bg-soft-success text-success'
        default:
            return 'bg-soft-info text-info'
    }
}

export default ProfilePage