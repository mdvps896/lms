'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiCalendar, FiClock, FiUser, FiBookOpen, FiCheckCircle, FiXCircle, FiEye, FiPlay, FiAward } from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'

const StudentDashboard = () => {
    const { user } = useAuth()
    const [myExams, setMyExams] = useState([])
    const [testExams, setTestExams] = useState([])
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (user?._id && user?.category) {
            fetchStudentData()
        } else if (user?._id && !user?.category) {
            // User has no category, stop loading and wait for category selection
            setLoading(false)
        }
    }, [user])

    const fetchStudentData = async () => {
        if (!user?._id) {
            console.log('No user ID available')
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)
        
        try {
            console.log('Fetching dashboard data for user:', user._id)
            
            const response = await fetch(`/api/student/dashboard?userId=${user._id}`)
            const data = await response.json()

            console.log('Dashboard API response:', data)

            if (data.success) {
                setMyExams(data.data.myExams || [])
                setTestExams(data.data.testExams || [])
                setResults(data.data.results || [])
                console.log('Dashboard data loaded:', {
                    myExams: data.data.myExams?.length,
                    testExams: data.data.testExams?.length,
                    results: data.data.results?.length
                })
            } else {
                console.error('API returned error:', data.error)
                setError(data.error || 'Failed to load dashboard data')
            }
        } catch (error) {
            console.error('Error fetching student data:', error)
            setError('Failed to load dashboard data. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status) => {
        switch(status) {
            case 'upcoming':
                return <span className="badge bg-primary">Upcoming</span>
            case 'completed':
                return <span className="badge bg-success">Completed</span>
            case 'missed':
                return <span className="badge bg-danger">Missed</span>
            default:
                return <span className="badge bg-secondary">Unknown</span>
        }
    }

    const getGradeBadge = (grade) => {
        const gradeColors = {
            'A+': 'success',
            'A': 'success', 
            'B+': 'info',
            'B': 'info',
            'C+': 'warning',
            'C': 'warning',
            'D': 'danger',
            'F': 'danger'
        }
        return <span className={`badge bg-${gradeColors[grade] || 'secondary'}`}>{grade}</span>
    }

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        )
    }

    if (!user?.category) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="text-center">
                    <FiBookOpen size={64} className="text-muted mb-3" />
                    <h5 className="text-muted">Please select your category to continue</h5>
                    <p className="text-muted">A category selection dialog will appear shortly</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="alert alert-danger m-3" role="alert">
                <h5 className="alert-heading">Error Loading Dashboard</h5>
                <p>{error}</p>
                <button className="btn btn-danger" onClick={fetchStudentData}>
                    Retry
                </button>
            </div>
        )
    }

    return (
        <div className="row">
            {/* My Exams Section */}
            <div className="col-12 mb-4">
                <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="card-title mb-0">
                            <FiCalendar className="me-2" />
                            My Exams
                        </h5>
                        <Link href="/exam" className="btn btn-sm btn-outline-primary">
                            View All Exams
                        </Link>
                    </div>
                    <div className="card-body">
                        {myExams.length === 0 ? (
                            <div className="text-center py-4">
                                <FiBookOpen size={48} className="text-muted mb-3" />
                                <p className="text-muted">No scheduled exams</p>
                            </div>
                        ) : (
                            <div className="row">
                                {myExams.map(exam => (
                                    <div key={exam.id} className="col-md-6 mb-3">
                                        <div className="card border-start border-4 border-primary">
                                            <div className="card-body">
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <h6 className="card-title mb-0">{exam.title}</h6>
                                                    {getStatusBadge(exam.status)}
                                                </div>
                                                <p className="text-muted small mb-2">{exam.subject}</p>
                                                <div className="d-flex align-items-center text-sm">
                                                    <FiCalendar className="me-1" />
                                                    <span className="me-3">
                                                        {new Date(exam.date).toLocaleDateString('en-US')}
                                                    </span>
                                                    <FiClock className="me-1" />
                                                    <span className="me-3">{exam.time}</span>
                                                    <span>({exam.duration})</span>
                                                </div>
                                                <div className="mt-3">
                                                    {exam.status === 'active' ? (
                                                        <Link href={`/exams/${exam.id}/take`} className="btn btn-sm btn-success">
                                                            <FiPlay className="me-1" />
                                                            Start Exam
                                                        </Link>
                                                    ) : (
                                                        <Link href={`/exams/${exam.id}`} className="btn btn-sm btn-primary">
                                                            <FiEye className="me-1" />
                                                            View Details
                                                        </Link>
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

            {/* Test Exams Section */}
            <div className="col-lg-6 mb-4">
                <div className="card h-100">
                    <div className="card-header">
                        <h5 className="card-title mb-0">
                            <FiBookOpen className="me-2" />
                            Practice Tests
                        </h5>
                    </div>
                    <div className="card-body">
                        {testExams.length === 0 ? (
                            <div className="text-center py-4">
                                <FiBookOpen size={48} className="text-muted mb-3" />
                                <p className="text-muted">No practice tests available</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {testExams.map(test => (
                                    <div key={test.id} className="border rounded p-3 mb-3">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <h6 className="mb-0">{test.title}</h6>
                                            <span className={`badge ${
                                                test.difficulty === 'Easy' ? 'bg-success' :
                                                test.difficulty === 'Medium' ? 'bg-warning' : 'bg-danger'
                                            }`}>
                                                {test.difficulty}
                                            </span>
                                        </div>
                                        <p className="text-muted small mb-2">{test.subject}</p>
                                        <div className="d-flex align-items-center text-sm text-muted mb-3">
                                            <span className="me-3">{test.questions} questions</span>
                                            <FiClock className="me-1" />
                                            <span>{test.duration}</span>
                                        </div>
                                        <Link href={`/exams/${test.id}/take`} className="btn btn-sm btn-outline-primary">
                                            <FiPlay className="me-1" />
                                            Start Practice
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Results Section */}
            <div className="col-lg-6 mb-4">
                <div className="card h-100">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="card-title mb-0">
                            <FiAward className="me-2" />
                            Recent Results
                        </h5>
                        <Link href="/reports" className="btn btn-sm btn-outline-primary">
                            View All Results
                        </Link>
                    </div>
                    <div className="card-body">
                        {results.length === 0 ? (
                            <div className="text-center py-4">
                                <FiAward size={48} className="text-muted mb-3" />
                                <p className="text-muted">No results available</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {results.map(result => (
                                    <div key={result.id} className="border rounded p-3 mb-3">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <h6 className="mb-0">{result.examTitle}</h6>
                                            {getGradeBadge(result.grade)}
                                        </div>
                                        <p className="text-muted small mb-2">{result.subject}</p>
                                        <div className="row align-items-center mb-2">
                                            <div className="col">
                                                <div className="d-flex align-items-center">
                                                    <span className="fw-bold text-primary">
                                                        {result.score}/{result.totalMarks}
                                                    </span>
                                                    <span className="ms-2 text-muted">
                                                        ({result.percentage}%)
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="col-auto">
                                                <small className="text-muted">{result.date}</small>
                                            </div>
                                        </div>
                                        <div className="progress mb-2" style={{ height: '6px' }}>
                                            <div 
                                                className={`progress-bar ${result.status === 'passed' ? 'bg-success' : 'bg-danger'}`}
                                                style={{ width: `${result.percentage}%` }}
                                            ></div>
                                        </div>
                                        <Link href={`/exam-result?examId=${result.id}`} className="btn btn-sm btn-outline-secondary">
                                            <FiEye className="me-1" />
                                            View Details
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StudentDashboard