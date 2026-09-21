'use client'

import React from 'react'
import { FiUser, FiCamera } from 'react-icons/fi'

const ProfileImageUpload = ({ user, imageLoading, handleImageUpload }) => {
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
    )
}

export default ProfileImageUpload
