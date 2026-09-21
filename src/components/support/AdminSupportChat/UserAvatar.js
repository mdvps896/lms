'use client'

import React from 'react'

// Helper to render Avatar
const UserAvatar = ({ user }) => {
    if (user.profileImage) {
        return (
            <img
                src={user.profileImage}
                alt={user.name}
                className="avatar-sm rounded-circle me-3"
                style={{ objectFit: 'cover' }}
            />
        )
    }
    return (
        <div className="avatar-sm me-3">
            <span className={`avatar-title rounded-circle ${user.isSupportBlocked ? 'bg-danger text-white' : 'bg-primary-soft text-primary'}`}>
                {(user.name || 'U').charAt(0)}
            </span>
        </div>
    )
}

export default UserAvatar
