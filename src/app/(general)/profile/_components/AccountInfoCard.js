'use client'

import React from 'react'
import { getRoleBadgeClass } from './utils'

const AccountInfoCard = ({ user }) => {
    return (
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
    )
}

export default AccountInfoCard
