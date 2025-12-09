'use client'
import React, { useState, useEffect } from 'react'
import Header from '@/components/shared/header/Header'
import NavigationManu from '@/components/shared/navigationMenu/NavigationMenu'
import ProtectedRoute from '@/components/shared/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { FiCalendar, FiClock, FiPlay, FiFileText, FiBookOpen, FiUser } from 'react-icons/fi'

const StudentExamPage = () => {
    const { user } = useAuth()
    const [upcomingExams, setUpcomingExams] = useState([])
    const [availableTests, setAvailableTests] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStudentExams()
    }, [])

    const fetchStudentExams = async () => {
        setLoading(true)
        try {
            // Mock data for now - replace with actual API calls
            setUpcomingExams([
                {
                    id: 1,
                    title: "Mathematics Final Exam",
                    subject: "Mathematics",
                    date: "2025-01-15",
                    time: "10:00 AM",
                    duration: "2 hours",
                    status: "upcoming",
                    instructions: "Scientific calculator allowed"
                },
                {
                    id: 2,
                    title: "Physics Chapter Test",
                    subject: "Physics", 
                    date: "2025-01-20",
                    time: "2:00 PM",
                    duration: "1.5 hours",
                    status: "upcoming",
                    instructions: "Formula sheet provided"
                }
            ])

            setAvailableTests([
                {
                    id: 3,
                    title: "Sample Practice Test - Math",
                    subject: "Mathematics",
                    questions: 25,
                    duration: "45 minutes",
                    difficulty: "Medium",
                    attempts: 2,
                    maxAttempts: 3
                },
                {
                    id: 4,
                    title: "Quick Quiz - General Knowledge",
                    subject: "General Knowledge",
                    questions: 15,
                    duration: "30 minutes", 
                    difficulty: "Easy",
                    attempts: 0,
                    maxAttempts: 5
                }
            ])
        } catch (error) {
            console.error('Error fetching student exams:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status) => {
        switch(status) {
            case 'upcoming':
                return <span className="badge bg-primary">Upcoming</span>
            case 'live':
                return <span className="badge bg-success">Live Now</span>
            case 'completed':
                return <span className="badge bg-secondary">Completed</span>
            default:
                return <span className="badge bg-light text-dark">Unknown</span>
        }
    }

    const getDifficultyBadge = (difficulty) => {
        const colors = {
            'Easy': 'success',
            'Medium': 'warning', 
            'Hard': 'danger'
        }
        return <span className={`badge bg-${colors[difficulty] || 'secondary'}`}>{difficulty}</span>
    }

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={['student']}>
                <Header />
                <NavigationManu />
                <main className="nxl-container">
                    <div className="nxl-content">
                        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    </div>
                </main>
            </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute allowedRoles={['student']}>
            <Header />
            <NavigationManu />
            <main className="nxl-container">
                <div className="nxl-content">
                    {/* Page Header */}
                    <div className="page-header">
                        <div className="page-header-left d-flex align-items-center">
                            <div className="page-header-title">
                                <h5 className="m-b-10">My Exams</h5>
                            </div>
                            <ul className="breadcrumb">
                                <li className="breadcrumb-item"><Link href="/">Home</Link></li>
                                <li className="breadcrumb-item">Exams</li>
                            </ul>
                        </div>
                        <div className="page-header-right ms-auto">
                            <div className="page-header-right-items">
                                <div className="d-flex align-items-center gap-2">
                                    <FiUser className="text-muted" />
                                    <span className="text-muted">Welcome, {user?.fullName || user?.name}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="main-content">
                        <div className="row">
                            {/* Scheduled Exams */}
                            <div className="col-12 mb-4">
                                <div className="card">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">
                                            <FiCalendar className="me-2" />
                                            Scheduled Exams
                                        </h5>
                                    </div>
                                    <div className="card-body">
                                        {upcomingExams.length === 0 ? (
                                            <div className="text-center py-5">
                                                <FiFileText size={48} className="text-muted mb-3" />
                                                <p className="text-muted">No scheduled exams</p>
                                            </div>
                                        ) : (
                                            <div className="row">
                                                {upcomingExams.map(exam => (
                                                    <div key={exam.id} className="col-lg-6 mb-3">
                                                        <div className="card border-start border-4 border-primary">
                                                            <div className="card-body">
                                                                <div className="d-flex justify-content-between align-items-start mb-3">
                                                                    <h6 className="card-title mb-0">{exam.title}</h6>
                                                                    {getStatusBadge(exam.status)}
                                                                </div>
                                                                <p className="text-muted mb-2">{exam.subject}</p>
                                                                <div className="mb-3">
                                                                    <div className="d-flex align-items-center mb-2">
                                                                        <FiCalendar className="me-2 text-muted" size={16} />
                                                                        <span className="me-4">{exam.date}</span>
                                                                        <FiClock className="me-2 text-muted" size={16} />
                                                                        <span>{exam.time}</span>
                                                                    </div>
                                                                    <small className="text-muted">
                                                                        Duration: {exam.duration}
                                                                    </small>
                                                                </div>
                                                                {exam.instructions && (
                                                                    <div className="alert alert-light py-2 mb-3">
                                                                        <small><strong>Instructions:</strong> {exam.instructions}</small>
                                                                    </div>
                                                                )}
                                                                <div className="d-flex gap-2">
                                                                    <button className="btn btn-primary btn-sm">
                                                                        <FiPlay className="me-1" />
                                                                        Start Exam
                                                                    </button>
                                                                    <button className="btn btn-outline-secondary btn-sm">
                                                                        View Details
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Practice Tests */}
                            <div className="col-12 mb-4">
                                <div className="card">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">
                                            <FiBookOpen className="me-2" />
                                            Practice Tests
                                        </h5>
                                    </div>
                                    <div className="card-body">
                                        {availableTests.length === 0 ? (
                                            <div className="text-center py-5">
                                                <FiBookOpen size={48} className="text-muted mb-3" />
                                                <p className="text-muted">No practice tests available</p>
                                            </div>
                                        ) : (
                                            <div className="row">
                                                {availableTests.map(test => (
                                                    <div key={test.id} className="col-lg-6 mb-3">
                                                        <div className="card border">
                                                            <div className="card-body">
                                                                <div className="d-flex justify-content-between align-items-start mb-3">
                                                                    <h6 className="card-title mb-0">{test.title}</h6>
                                                                    {getDifficultyBadge(test.difficulty)}
                                                                </div>
                                                                <p className="text-muted mb-2">{test.subject}</p>
                                                                <div className="row text-sm text-muted mb-3">
                                                                    <div className="col-6">
                                                                        <div className="d-flex align-items-center mb-1">
                                                                            <FiFileText size={14} className="me-1" />
                                                                            <span>{test.questions} questions</span>
                                                                        </div>
                                                                        <div className="d-flex align-items-center">
                                                                            <FiClock size={14} className="me-1" />
                                                                            <span>{test.duration}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-6">
                                                                        <small>
                                                                            Attempts: {test.attempts}/{test.maxAttempts}
                                                                        </small>
                                                                        <div className="progress mt-1" style={{ height: '4px' }}>
                                                                            <div 
                                                                                className="progress-bar bg-info" 
                                                                                style={{ width: `${(test.attempts / test.maxAttempts) * 100}%` }}
                                                                            ></div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="d-flex gap-2">
                                                                    <button 
                                                                        className="btn btn-outline-primary btn-sm"
                                                                        disabled={test.attempts >= test.maxAttempts}
                                                                    >
                                                                        <FiPlay className="me-1" />
                                                                        {test.attempts >= test.maxAttempts ? 'Limit Reached' : 'Start Practice'}
                                                                    </button>
                                                                    {test.attempts > 0 && (
                                                                        <button className="btn btn-outline-secondary btn-sm">
                                                                            View Results
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </ProtectedRoute>
    )
}

export default StudentExamPage