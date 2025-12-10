'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import PermissionChecker from './PermissionChecker'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

const ExamCard = ({ exam }) => {
    const [timeRemaining, setTimeRemaining] = useState('')
    const [examStatus, setExamStatus] = useState('pending')
    const [progressPercentage, setProgressPercentage] = useState(0)
    const [showPermissionChecker, setShowPermissionChecker] = useState(false)
    const [attemptInfo, setAttemptInfo] = useState({ attempts: 0, hasActiveAttempt: false, lastAttempt: null })
    const [loadingAttempts, setLoadingAttempts] = useState(false)
    const router = useRouter()
    const { user } = useAuth()

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date()
            const startDate = new Date(exam.startDate)
            const endDate = new Date(exam.endDate)

            if (now < startDate) {
                setExamStatus('upcoming')
                const diff = startDate - now
                setTimeRemaining(formatTimeDifference(diff))
            } else if (now >= startDate && now <= endDate) {
                setExamStatus('active')
                const diff = endDate - now
                const totalDuration = endDate - startDate
                const elapsed = now - startDate
                const progress = Math.min(100, (elapsed / totalDuration) * 100)
                setProgressPercentage(progress)
                setTimeRemaining(formatActiveExamTime(diff))
            } else {
                setExamStatus('completed')
                setTimeRemaining('')
            }
        }

        updateTimer()
        const interval = setInterval(updateTimer, 1000)

        return () => clearInterval(interval)
    }, [exam.startDate, exam.endDate])

    // Separate useEffect for checking attempts - runs once on mount and when user/exam changes
    useEffect(() => {
        if (user && exam._id) {
            checkUserAttempts()
        }
    }, [user?._id, exam._id])

    const checkUserAttempts = async () => {
        if (!user || !exam._id) return

        try {
            setLoadingAttempts(true)
            const response = await fetch(`/api/exams/check-attempts?examId=${exam._id}&userId=${user._id}`)

            if (response.ok) {
                const data = await response.json()
                setAttemptInfo(data)
            }
        } catch (error) {
            console.error('Error checking attempts:', error)
        } finally {
            setLoadingAttempts(false)
        }
    }

    const formatTimeDifference = (ms) => {
        const days = Math.floor(ms / (1000 * 60 * 60 * 24))
        const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((ms % (1000 * 60)) / 1000)

        if (days > 0) return `${days}d ${hours}h`
        if (hours > 0) return `${hours}h ${minutes}m`
        if (minutes > 0) return `${minutes}m ${seconds}s`
        return `${seconds}s`
    }

    const formatActiveExamTime = (ms) => {
        const hours = Math.floor(ms / (1000 * 60 * 60))
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((ms % (1000 * 60)) / 1000)

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getStatusBadge = () => {
        switch (examStatus) {
            case 'upcoming':
                return <span className="badge bg-warning">Upcoming</span>
            case 'active':
                return <span className="badge bg-success">Active</span>
            case 'completed':
                return <span className="badge bg-secondary">Completed</span>
            default:
                return <span className="badge bg-info">Pending</span>
        }
    }

    const getActionButton = () => {
        const maxAttempts = exam.maxAttempts ?? 1
        const currentAttempts = attemptInfo.attempts || 0
        const isUnlimited = maxAttempts === -1
        const attemptsRemaining = isUnlimited ? Infinity : maxAttempts - currentAttempts

        switch (examStatus) {
            case 'active':
                // Check if user has active attempt
                if (attemptInfo.hasActiveAttempt) {
                    return (
                        <button
                            className="btn btn-warning w-100"
                            onClick={() => {
                                // Set access token before navigating
                                sessionStorage.setItem(`exam_access_${exam._id}`, 'true')
                                router.push(`/exams/${exam._id}/start`)
                            }}
                        >
                            <i className="feather-play me-1"></i>
                            Resume Exam
                        </button>
                    )
                }

                // Check if attempts are exhausted (only for limited attempts)
                if (!isUnlimited && currentAttempts >= maxAttempts) {
                    return (
                        <button className="btn btn-danger w-100" disabled>
                            <i className="feather-x me-1"></i>
                            Attempts Exhausted ({currentAttempts}/{maxAttempts})
                        </button>
                    )
                }

                // Allow starting new attempt
                return (
                    <button
                        className="btn btn-success w-100"
                        onClick={() => setShowPermissionChecker(true)}
                        disabled={loadingAttempts}
                    >
                        <i className="feather-play me-1"></i>
                        {loadingAttempts ? 'Loading...' : `Start Exam (${attemptsRemaining} left)`}
                    </button>
                )

            case 'completed':
                return (
                    <Link href={`/my-results/${attemptInfo.lastAttempt?._id || exam._id}`} className="btn btn-info w-100">
                        <i className="feather-eye me-1"></i>
                        View Results
                    </Link>
                )
            case 'upcoming':
                return (
                    <button className="btn btn-outline-primary w-100" disabled>
                        <i className="feather-clock me-1"></i>
                        Starts in {timeRemaining}
                    </button>
                )
            default:
                return (
                    <button className="btn btn-outline-secondary w-100" disabled>
                        <i className="feather-info me-1"></i>
                        Not Available
                    </button>
                )
        }
    }

    return (
        <div className={`card exam-card h-100 ${examStatus === 'active' ? 'active' : ''}`}>
            <div className="card-header d-flex justify-content-between align-items-center">
                <div>
                    {getStatusBadge()}
                    {exam.type === 'live' && (
                        <span className="badge bg-danger ms-2">
                            <i className="feather-zap me-1"></i>
                            Live
                        </span>
                    )}
                </div>

                {/* Header Timer for Active Exams */}
                {examStatus === 'active' && timeRemaining && (
                    <div className="active-exam-timer" style={{ fontSize: '0.9rem' }}>
                        <i className="feather-clock me-1"></i>
                        {timeRemaining}
                    </div>
                )}
            </div>

            <div className="card-body">
                <h5 className="card-title mb-2">{exam.name}</h5>

                {exam.description && (
                    <p className="card-text text-muted small mb-3">
                        {exam.description.length > 100
                            ? `${exam.description.substring(0, 100)}...`
                            : exam.description}
                    </p>
                )}

                <div className="exam-details">
                    <div className="row text-sm">
                        <div className="col-12 mb-2">
                            <i className="feather-book text-primary me-2"></i>
                            <span className="text-muted">Subjects:</span>
                            <span className="fw-medium ms-1">
                                {exam.subjects && exam.subjects.length > 0
                                    ? exam.subjects.map(subject =>
                                        typeof subject === 'object' && subject.name
                                            ? subject.name
                                            : subject
                                    ).join(', ')
                                    : 'General'}
                            </span>
                        </div>

                        <div className="col-12 mb-2">
                            <i className="feather-clock text-primary me-2"></i>
                            <span className="text-muted">Duration:</span>
                            <span className="fw-medium ms-1">{exam.duration} minutes</span>
                        </div>

                        <div className="col-12 mb-2">
                            <i className="feather-help-circle text-primary me-2"></i>
                            <span className="text-muted">Questions:</span>
                            <span className="fw-medium ms-1">{exam.totalQuestions || exam.questions?.length || 0}</span>
                        </div>

                        <div className="col-12 mb-2">
                            <i className="feather-award text-primary me-2"></i>
                            <span className="text-muted">Total Marks:</span>
                            <span className="fw-medium ms-1">{exam.totalMarks}</span>
                        </div>

                        <div className="col-12 mb-2">
                            <i className="feather-repeat text-primary me-2"></i>
                            <span className="text-muted">Max Attempts:</span>
                            <span className="fw-medium ms-1">
                                {(exam.maxAttempts ?? 1) === -1 ? 'Unlimited' : (exam.maxAttempts || 1)}
                                {(examStatus === 'active' || examStatus === 'upcoming') && !loadingAttempts && (
                                    <span className="text-success ms-1">
                                        {(exam.maxAttempts ?? 1) === -1
                                            ? `(${attemptInfo.attempts || 0} taken)`
                                            : `(${Math.max(0, (exam.maxAttempts || 1) - (attemptInfo.attempts || 0))} remaining)`
                                        }
                                    </span>
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Active Exam Timer */}
                    {examStatus === 'active' && timeRemaining && (
                        <div className="alert alert-warning border-0 mb-3" style={{ backgroundColor: '#fff3cd' }}>
                            <div className="d-flex align-items-center justify-content-between mb-2">
                                <div className="d-flex align-items-center">
                                    <i className="feather-clock text-warning me-2"></i>
                                    <strong className="text-warning">Time Remaining:</strong>
                                </div>
                                <div className="text-dark fw-bold" style={{ fontSize: '1.1rem', fontFamily: 'monospace' }}>
                                    {timeRemaining}
                                </div>
                            </div>
                            <div className="progress" style={{ height: '8px' }}>
                                <div
                                    className="progress-bar bg-warning"
                                    role="progressbar"
                                    style={{ width: `${100 - progressPercentage}%` }}
                                    aria-valuenow={100 - progressPercentage}
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                ></div>
                            </div>
                        </div>
                    )}

                    {/* Upcoming Exam Timer */}
                    {examStatus === 'upcoming' && timeRemaining && (
                        <div className="alert alert-info border-0 mb-3" style={{ backgroundColor: '#d1ecf1' }}>
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center">
                                    <i className="feather-calendar text-info me-2"></i>
                                    <span className="text-info">Starts in:</span>
                                </div>
                                <div className="text-dark fw-bold">
                                    {timeRemaining}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {timeRemaining && examStatus === 'active' && (
                    <div className="alert alert-success mt-3 mb-3 py-2">
                        <div className="d-flex align-items-center">
                            <i className="feather-clock text-success me-2"></i>
                            <div>
                                <small className="fw-medium">Time Remaining</small>
                                <div className="text-success fw-bold">{timeRemaining}</div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="exam-schedule mt-3">
                    <div className="row text-sm">
                        <div className="col-6">
                            <div className="text-muted mb-1">Start Date</div>
                            <div className="fw-medium small">
                                {formatDateTime(exam.startDate)}
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="text-muted mb-1">End Date</div>
                            <div className="fw-medium small">
                                {formatDateTime(exam.endDate)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card-footer">
                {getActionButton()}
            </div>

            {/* Permission Checker Modal */}
            {showPermissionChecker && (
                <PermissionChecker
                    exam={exam}
                    onPermissionsGranted={() => {
                        setShowPermissionChecker(false)
                        // Set access token before navigating
                        sessionStorage.setItem(`exam_access_${exam._id}`, 'true')
                        router.push(`/exams/${exam._id}/start`)
                    }}
                    onCancel={() => setShowPermissionChecker(false)}
                />
            )}
        </div>
    )
}

export default ExamCard