'use client'

import Link from 'next/link'
import React from 'react'
import { FiLogOut, FiSettings, FiUser } from "react-icons/fi"
import { useAuth } from '@/contexts/AuthContext'
import Swal from 'sweetalert2'

const ProfileModal = () => {
    const { user, logout } = useAuth();

    const handleLogout = (e) => {
        e.preventDefault();

        Swal.fire({
            title: 'Are you sure?',
            text: "You want to logout?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, logout!'
        }).then((result) => {
            if (result.isConfirmed) {
                logout();
                Swal.fire({
                    icon: 'success',
                    title: 'Logged out successfully!',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        });
    };

    // Function to render profile image or default icon
    const renderProfileImage = (size = 40) => {
        // Check if user has a valid profile image
        const hasValidImage = user?.profileImage &&
            user.profileImage !== '' &&
            !user.profileImage.includes('undefined') &&
            !user.profileImage.includes('null');

        if (hasValidImage) {
            return (
                <img
                    width={size}
                    height={size}
                    src={user.profileImage}
                    alt={user?.name || 'User'}
                    className="img-fluid user-avtar rounded-circle"
                    style={{ objectFit: 'cover', border: '2px solid #fff' }}
                    onError={(e) => {
                        // Fallback to initials if image fails to load
                        const initials = user?.name
                            ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                            : 'U';
                        e.target.outerHTML = `<div class="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle user-avtar" style="width: ${size}px; height: ${size}px; min-width: ${size}px; font-size: ${size * 0.4}px; font-weight: bold;">${initials}</div>`;
                    }}
                />
            );
        } else {
            // Show user initials or icon
            const initials = user?.name
                ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                : 'U';

            return (
                <div
                    className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle user-avtar"
                    style={{
                        width: size,
                        height: size,
                        minWidth: size,
                        fontSize: size * 0.4,
                        fontWeight: 'bold'
                    }}
                >
                    {initials}
                </div>
            );
        }
    };

    return (
        <div className="dropdown nxl-h-item">
            <a href="#" data-bs-toggle="dropdown" role="button" data-bs-auto-close="outside">
                <div style={{ width: 60, height: 40 }} className="d-flex">
                    {renderProfileImage(40)}
                </div>
            </a>
            <div className="dropdown-menu dropdown-menu-end nxl-h-dropdown nxl-user-dropdown">
                <div className="dropdown-header">
                    <div className="d-flex align-items-center">
                        {renderProfileImage(40)}
                        <div className="ms-3">
                            <h6 className="text-dark mb-0">{user?.name || 'User'}
                                <span className={`badge ms-1 ${getRoleBadgeClass(user?.role)}`}>
                                    {user?.role?.toUpperCase() || 'USER'}
                                </span>
                            </h6>
                            <span className="fs-12 fw-medium text-muted">{user?.email || 'user@example.com'}</span>
                        </div>
                    </div>
                </div>
                <div className="dropdown-divider"></div>

                {/* My Profile */}
                <Link href="/profile" className="dropdown-item">
                    <i className="me-2"><FiUser /></i>
                    <span>My Profile</span>
                </Link>

                {/* Settings - Only show for admin */}
                {user?.role === 'admin' && (
                    <Link href="/settings" className="dropdown-item">
                        <i className="me-2"><FiSettings /></i>
                        <span>Settings</span>
                    </Link>
                )}

                <div className="dropdown-divider"></div>

                {/* Logout */}
                <a href="#" className="dropdown-item" onClick={handleLogout}>
                    <i className="me-2"><FiLogOut /></i>
                    <span>Logout</span>
                </a>
            </div>
        </div>
    )
}

export default ProfileModal

const getRoleBadgeClass = (role) => {
    switch (role) {
        case 'admin':
            return 'bg-soft-danger text-danger';
        case 'teacher':
            return 'bg-soft-warning text-warning';
        case 'student':
            return 'bg-soft-success text-success';
        default:
            return 'bg-soft-info text-info';
    }
}