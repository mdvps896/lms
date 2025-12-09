'use client'

import React, { useState, useEffect } from 'react'
import { FiActivity, FiCheckCircle, FiClock, FiUser } from 'react-icons/fi'

const RecentActivityStatistics = () => {
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchRecentActivities()
    }, [])

    const fetchRecentActivities = async () => {
        setLoading(true)
        try {
            // Fetch recent exam attempts or activities
            const response = await fetch('/api/recent-activity')
            const data = await response.json()
            
            if (data.success) {
                setActivities(data.activities || [])
            }
        } catch (error) {
            console.error('Error fetching activities:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="col-xxl-6 col-xl-6">
            <div className="card stretch stretch-full">
                <div className="card-header">
                    <h5 className="card-title">
                        <FiActivity className="me-2" />
                        Recent Activity
                    </h5>
                </div>
                <div className="card-body">
                    {loading ? (
                        <div className="text-center py-4">
                            <div className="spinner-border spinner-border-sm text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : activities.length > 0 ? (
                        <div className="list-group list-group-flush">
                            {activities.slice(0, 5).map((activity, index) => (
                                <div key={index} className="list-group-item px-0 border-bottom">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="avatar avatar-sm">
                                            <div className="avatar-text bg-soft-primary text-primary">
                                                {activity.type === 'exam' ? <FiCheckCircle size={18} /> : <FiUser size={18} />}
                                            </div>
                                        </div>
                                        <div className="flex-fill">
                                            <h6 className="mb-1">{activity.title}</h6>
                                            <p className="text-muted mb-0 small">{activity.description}</p>
                                        </div>
                                        <div className="text-end">
                                            <small className="text-muted d-flex align-items-center gap-1">
                                                <FiClock size={12} />
                                                {activity.time}
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-5">
                            <FiActivity size={48} className="text-muted mb-3" />
                            <p className="text-muted">No recent activities</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default RecentActivityStatistics
