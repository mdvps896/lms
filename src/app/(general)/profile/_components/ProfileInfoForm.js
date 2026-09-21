'use client'

import React from 'react'
import { FiUser, FiMail, FiPhone, FiSave, FiHash } from 'react-icons/fi'
import ProfileImageUpload from './ProfileImageUpload'

const ProfileInfoForm = ({
    user,
    formData,
    loading,
    imageLoading,
    handleInputChange,
    handleProfileUpdate,
    handleImageUpload
}) => {
    return (
        <div className="col-lg-8">
            <div className="card border-top-0">
                <div className="card-header">
                    <h5 className="card-title">Profile Information</h5>
                </div>
                <div className="card-body">
                    <form onSubmit={handleProfileUpdate}>
                        <div className="row">
                            <ProfileImageUpload
                                user={user}
                                imageLoading={imageLoading}
                                handleImageUpload={handleImageUpload}
                            />

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
    )
}

export default ProfileInfoForm
