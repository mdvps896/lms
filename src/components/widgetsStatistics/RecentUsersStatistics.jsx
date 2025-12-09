'use client'

import React, { useState, useEffect } from 'react'
import { FiUsers, FiUserCheck, FiUserPlus, FiTrendingUp } from 'react-icons/fi'

const RecentUsersStatistics = () => {
    const [users, setUsers] = useState([])
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        newToday: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchRecentUsers()
    }, [])

    const fetchRecentUsers = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/users?role=student&limit=5')
            const data = await response.json()
            
            if (data.success) {
                const recentUsers = data.data || []
                setUsers(recentUsers)
                
                // Calculate stats
                const today = new Date().setHours(0, 0, 0, 0)
                const newToday = recentUsers.filter(u => {
                    const userDate = new Date(u.createdAt).setHours(0, 0, 0, 0)
                    return userDate === today
                }).length

                setStats({
                    total: recentUsers.length,
                    active: recentUsers.filter(u => u.status === 'active').length,
                    newToday: newToday
                })
            }
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="col-xxl-6 col-xl-6">
            <div className="card stretch stretch-full">
                <div className="card-header">
                    <h5 className="card-title">
                        <FiUsers className="me-2" />
                        Recent Users
                    </h5>
                </div>
                <div className="card-body">
                    {loading ? (
                        <div className="text-center py-4">
                            <div className="spinner-border spinner-border-sm text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="row g-3 mb-4">
                                <div className="col-4">
                                    <div className="text-center p-3 bg-soft-primary rounded">
                                        <FiUsers className="text-primary mb-2" size={24} />
                                        <h4 className="mb-0">{stats.total}</h4>
                                        <small className="text-muted">Total</small>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div className="text-center p-3 bg-soft-success rounded">
                                        <FiUserCheck className="text-success mb-2" size={24} />
                                        <h4 className="mb-0">{stats.active}</h4>
                                        <small className="text-muted">Active</small>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div className="text-center p-3 bg-soft-info rounded">
                                        <FiUserPlus className="text-info mb-2" size={24} />
                                        <h4 className="mb-0">{stats.newToday}</h4>
                                        <small className="text-muted">New Today</small>
                                    </div>
                                </div>
                            </div>

                            {users.length > 0 ? (
                                <div className="list-group list-group-flush">
                                    {users.map((user, index) => (
                                        <div key={user._id || index} className="list-group-item px-0 border-bottom">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="avatar avatar-sm">
                                                    {user.profileImage ? (
                                                        <img 
                                                            src={user.profileImage} 
                                                            alt={user.name} 
                                                            className="rounded-circle" 
                                                            style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        <div className="avatar-text bg-soft-primary text-primary">
                                                            {user.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-fill">
                                                    <h6 className="mb-1">{user.name}</h6>
                                                    <p className="text-muted mb-0 small">{user.email}</p>
                                                </div>
                                                <div className="text-end">
                                                    <span className={`badge ${user.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                                                        {user.status || 'active'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-5">
                                    <FiUsers size={48} className="text-muted mb-3" />
                                    <p className="text-muted">No users found</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default RecentUsersStatistics
