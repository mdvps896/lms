import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { FiBell, FiCheck, FiX, FiClock, FiCalendar, FiBookOpen } from 'react-icons/fi'
import { useAuth } from '../../../contexts/AuthContext'

const NotificationsModal = () => {
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [unreadCount, setUnreadCount] = useState(0)
    const { user: currentUser } = useAuth()

    useEffect(() => {
        // Don't fetch if user is not authenticated or doesn't have an ID
        if (!currentUser?.id) {
            setLoading(false)
            setNotifications([])
            setUnreadCount(0)
            return
        }

        // Fetch notifications
        const fetchNotifications = async () => {
            try {
                const response = await fetch('/api/notifications')
                
                // Silently handle 401 errors (user not authenticated yet)
                if (response.status === 401) {
                    setNotifications([])
                    setUnreadCount(0)
                    setLoading(false)
                    return
                }

                const data = await response.json()
                
                if (response.ok) {
                    setNotifications(data.notifications || [])
                    setUnreadCount(data.unreadCount || 0)
                }
            } catch (error) {
                // Silently handle errors to avoid console spam
                setNotifications([])
                setUnreadCount(0)
            } finally {
                setLoading(false)
            }
        }

        fetchNotifications()
        
        // Setup polling every 30 seconds
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [currentUser?.id])

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        try {
            const response = await fetch('/api/notifications', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    notificationId,
                    action: 'mark_read'
                })
            })

            if (response.ok) {
                // Update local state
                setNotifications(prev => prev.map(notification => {
                    if (notification._id === notificationId) {
                        return {
                            ...notification,
                            recipients: notification.recipients.map(recipient => 
                                recipient.userId === currentUser?.id 
                                    ? { ...recipient, read: true }
                                    : recipient
                            )
                        }
                    }
                    return notification
                }))
                setUnreadCount(prev => Math.max(0, prev - 1))
            }
        } catch (error) {
            console.error('Error marking notification as read:', error)
        }
    }

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            const response = await fetch('/api/notifications', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    action: 'mark_all_read'
                })
            })

            if (response.ok) {
                setNotifications(prev => prev.map(notification => ({
                    ...notification,
                    recipients: notification.recipients.map(recipient => 
                        recipient.userId === currentUser?.id 
                            ? { ...recipient, read: true }
                            : recipient
                    )
                })))
                setUnreadCount(0)
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error)
        }
    }

    // Remove notification
    const removeNotification = async (notificationId) => {
        try {
            const response = await fetch('/api/notifications', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    notificationId,
                    action: 'remove'
                })
            })

            if (response.ok) {
                setNotifications(prev => prev.filter(n => n._id !== notificationId))
                // Update unread count if the removed notification was unread
                const removedNotification = notifications?.find(n => n._id === notificationId)
                if (removedNotification) {
                    const userRecipient = removedNotification.recipients.find(r => r.userId === currentUser?.id)
                    if (userRecipient && !userRecipient.read) {
                        setUnreadCount(prev => Math.max(0, prev - 1))
                    }
                }
            }
        } catch (error) {
            console.error('Error removing notification:', error)
        }
    }

    // Get notification icon based on type
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'exam_created':
                return <FiBookOpen className="text-info" size={16} />
            case 'exam_started':
                return <FiClock className="text-success" size={16} />
            case 'exam_ended':
                return <FiClock className="text-warning" size={16} />
            case 'exam_updated':
                return <FiCalendar className="text-primary" size={16} />
            default:
                return <FiBell className="text-muted" size={16} />
        }
    }

    // Format time ago
    const formatTimeAgo = (date) => {
        const now = new Date()
        const notificationDate = new Date(date)
        const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60))
        
        if (diffInMinutes < 1) return 'Just now'
        if (diffInMinutes < 60) return `${diffInMinutes} min ago`
        
        const diffInHours = Math.floor(diffInMinutes / 60)
        if (diffInHours < 24) return `${diffInHours}h ago`
        
        const diffInDays = Math.floor(diffInHours / 24)
        return `${diffInDays}d ago`
    }

    // Check if user has read this notification
    const isRead = (notification) => {
        const userRecipient = notification.recipients.find(r => r.userId === currentUser?.id)
        return userRecipient?.read || false
    }

    // Don't render notifications if no user is logged in
    if (!currentUser) {
        return null
    }

    return (
        <div className="dropdown nxl-h-item">
            <div className="nxl-head-link me-3" data-bs-toggle="dropdown" role="button" data-bs-auto-close="outside">
                <FiBell size={20} />
                {unreadCount > 0 && (
                    <span className="badge bg-danger nxl-h-badge">{unreadCount}</span>
                )}
            </div>
            <div className="dropdown-menu dropdown-menu-end nxl-h-dropdown nxl-notifications-menu">
                <div className="d-flex justify-content-between align-items-center notifications-head">
                    <h6 className="fw-bold text-dark mb-0">Notifications</h6>
                    {unreadCount > 0 && (
                        <button 
                            onClick={markAllAsRead}
                            className="btn btn-sm fs-11 text-success text-end ms-auto" 
                            data-toggle="tooltip" 
                            data-title="Mark All as Read"
                        >
                            <FiCheck size={16} />
                            <span className="ms-1">Mark All as Read</span>
                        </button>
                    )}
                </div>

                <div className="notifications-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {loading ? (
                        <div className="text-center py-4">
                            <div className="spinner-border spinner-border-sm text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : !notifications || notifications.length === 0 ? (
                        <div className="text-center py-4 text-muted">
                            <FiBell size={24} className="mb-2 opacity-50" />
                            <p className="mb-0">No notifications yet</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <NotificationCard 
                                key={notification._id} 
                                notification={notification}
                                isRead={isRead(notification)}
                                onMarkAsRead={() => markAsRead(notification._id)}
                                onRemove={() => removeNotification(notification._id)}
                                getIcon={getNotificationIcon}
                                formatTime={formatTimeAgo}
                            />
                        ))
                    )}
                </div>

                <div className="text-center notifications-footer">
                    <Link href="/notifications" className="fs-13 fw-semibold text-dark">
                        View All Notifications
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default NotificationsModal

const NotificationCard = ({ notification, isRead, onMarkAsRead, onRemove, getIcon, formatTime }) => {
    const { title, message, type, data, createdAt } = notification

    return (
        <div className={`notifications-item ${!isRead ? 'unread' : ''}`}>
            <div className="d-flex align-items-start">
                <div className="flex-shrink-0 me-3 d-flex align-items-center justify-content-center" 
                     style={{ 
                         width: '40px', 
                         height: '40px', 
                         backgroundColor: !isRead ? '#e3f2fd' : '#f8f9fa',
                         borderRadius: '50%' 
                     }}>
                    {getIcon(type)}
                </div>
                
                <div className="flex-grow-1 notifications-desc">
                    <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                            <h6 className={`mb-1 ${!isRead ? 'fw-bold' : 'fw-semibold'}`}>
                                {title}
                            </h6>
                            <p className="text-muted mb-1 fs-12">{message}</p>
                            
                            {data && data.examName && (
                                <div className="exam-details mt-2">
                                    <small className="text-primary fw-medium">
                                        📚 {data.examName}
                                    </small>
                                    {data.startTime && (
                                        <div className="text-muted fs-11">
                                            🕐 Start: {new Date(data.startTime).toLocaleString()}
                                        </div>
                                    )}
                                    {data.endTime && (
                                        <div className="text-muted fs-11">
                                            🏁 End: {new Date(data.endTime).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center mt-2">
                        <div className="notifications-date text-muted border-bottom border-bottom-dashed fs-11">
                            {formatTime(createdAt)}
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            {!isRead && (
                                <button
                                    onClick={onMarkAsRead}
                                    className="btn btn-sm p-0 d-flex align-items-center justify-content-center"
                                    style={{ width: '20px', height: '20px' }}
                                    data-toggle="tooltip" 
                                    data-title="Mark as Read"
                                >
                                    <span className="d-block wd-8 ht-8 rounded-circle bg-primary"></span>
                                </button>
                            )}
                            <button
                                onClick={onRemove}
                                className="btn btn-sm p-0 text-danger d-flex align-items-center justify-content-center"
                                style={{ width: '20px', height: '20px' }}
                                data-toggle="tooltip" 
                                data-title="Remove"
                            >
                                <FiX className="fs-12" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}