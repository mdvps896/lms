'use client'
import React, { useState, useEffect } from 'react'
import Header from '@/components/shared/header/Header'
import NavigationManu from '@/components/shared/navigationMenu/NavigationMenu'
import ProtectedRoute from '@/components/shared/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { FiAward, FiEye, FiCalendar, FiTrendingUp, FiBarChart2, FiDownload, FiUser } from 'react-icons/fi'

const StudentResultsPage = () => {
    const { user } = useAuth()
    const [results, setResults] = useState([])
    const [stats, setStats] = useState({})
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all') // all, passed, failed

    useEffect(() => {
        fetchStudentResults()
    }, [])

    const fetchStudentResults = async () => {
        setLoading(true)
        try {
            // Mock data for now - replace with actual API calls
            const mockResults = [
                {
                    id: 1,
                    examTitle: "Mathematics Final Exam",
                    subject: "Mathematics",
                    score: 85,
                    totalMarks: 100,
                    percentage: 85,
                    grade: "A",
                    date: "2024-12-20",
                    status: "passed",
                    duration: "2 hours",
                    rank: 5,
                    totalStudents: 45
                },
                {
                    id: 2,
                    examTitle: "Physics Chapter Test",
                    subject: "Physics",
                    score: 78,
                    totalMarks: 100,
                    percentage: 78,
                    grade: "B+",
                    date: "2024-12-15",
                    status: "passed",
                    duration: "1.5 hours",
                    rank: 8,
                    totalStudents: 40
                },
                {
                    id: 3,
                    examTitle: "Chemistry Quiz",
                    subject: "Chemistry",
                    score: 65,
                    totalMarks: 100,
                    percentage: 65,
                    grade: "B",
                    date: "2024-12-10",
                    status: "passed",
                    duration: "1 hour",
                    rank: 12,
                    totalStudents: 38
                },
                {
                    id: 4,
                    examTitle: "English Literature Test",
                    subject: "English",
                    score: 92,
                    totalMarks: 100,
                    percentage: 92,
                    grade: "A+",
                    date: "2024-12-05",
                    status: "passed",
                    duration: "2 hours",
                    rank: 2,
                    totalStudents: 42
                }
            ]

            setResults(mockResults)
            
            // Calculate stats
            const totalExams = mockResults.length
            const passedExams = mockResults.filter(r => r.status === 'passed').length
            const averageScore = mockResults.reduce((sum, r) => sum + r.percentage, 0) / totalExams
            const bestScore = Math.max(...mockResults.map(r => r.percentage))
            
            setStats({
                totalExams,
                passedExams,
                averageScore: averageScore.toFixed(1),
                bestScore
            })
        } catch (error) {
            console.error('Error fetching student results:', error)
        } finally {
            setLoading(false)
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

    const getStatusBadge = (status) => {
        return status === 'passed' 
            ? <span className="badge bg-success">Passed</span>
            : <span className="badge bg-danger">Failed</span>
    }

    const filteredResults = results.filter(result => {
        if (filter === 'all') return true
        return result.status === filter
    })

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
                                <h5 className="m-b-10">My Results</h5>
                            </div>
                            <ul className="breadcrumb">
                                <li className="breadcrumb-item"><Link href="/">Home</Link></li>
                                <li className="breadcrumb-item">Results</li>
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
                        {/* Stats Cards */}
                        <div className="row mb-4">
                            <div className="col-lg-3 col-md-6 mb-3">
                                <div className="card">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div>
                                                <p className="text-muted mb-1">Total Exams</p>
                                                <h4 className="mb-0">{stats.totalExams}</h4>
                                            </div>
                                            <div className="text-primary">
                                                <FiBarChart2 size={28} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-3 col-md-6 mb-3">
                                <div className="card">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div>
                                                <p className="text-muted mb-1">Passed</p>
                                                <h4 className="mb-0 text-success">{stats.passedExams}</h4>
                                            </div>
                                            <div className="text-success">
                                                <FiAward size={28} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-3 col-md-6 mb-3">
                                <div className="card">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div>
                                                <p className="text-muted mb-1">Average Score</p>
                                                <h4 className="mb-0">{stats.averageScore}%</h4>
                                            </div>
                                            <div className="text-info">
                                                <FiTrendingUp size={28} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-3 col-md-6 mb-3">
                                <div className="card">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div>
                                                <p className="text-muted mb-1">Best Score</p>
                                                <h4 className="mb-0 text-warning">{stats.bestScore}%</h4>
                                            </div>
                                            <div className="text-warning">
                                                <FiAward size={28} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Results Table */}
                        <div className="card">
                            <div className="card-header">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h5 className="card-title mb-0">
                                        <FiAward className="me-2" />
                                        Exam Results
                                    </h5>
                                    <div className="d-flex align-items-center gap-2">
                                        <select 
                                            className="form-select form-select-sm" 
                                            value={filter} 
                                            onChange={(e) => setFilter(e.target.value)}
                                            style={{ width: 'auto' }}
                                        >
                                            <option value="all">All Results</option>
                                            <option value="passed">Passed</option>
                                            <option value="failed">Failed</option>
                                        </select>
                                        <button className="btn btn-sm btn-outline-primary">
                                            <FiDownload className="me-1" />
                                            Export
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="card-body">
                                {filteredResults.length === 0 ? (
                                    <div className="text-center py-5">
                                        <FiBarChart2 size={48} className="text-muted mb-3" />
                                        <p className="text-muted">No results available</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Exam</th>
                                                    <th>Subject</th>
                                                    <th>Score</th>
                                                    <th>Grade</th>
                                                    <th>Rank</th>
                                                    <th>Date</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredResults.map(result => (
                                                    <tr key={result.id}>
                                                        <td>
                                                            <div>
                                                                <h6 className="mb-1">{result.examTitle}</h6>
                                                                <small className="text-muted">Duration: {result.duration}</small>
                                                            </div>
                                                        </td>
                                                        <td>{result.subject}</td>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <span className="fw-bold me-2">
                                                                    {result.score}/{result.totalMarks}
                                                                </span>
                                                                <small className="text-muted">({result.percentage}%)</small>
                                                            </div>
                                                            <div className="progress mt-1" style={{ height: '4px' }}>
                                                                <div 
                                                                    className={`progress-bar ${result.percentage >= 80 ? 'bg-success' : result.percentage >= 60 ? 'bg-warning' : 'bg-danger'}`}
                                                                    style={{ width: `${result.percentage}%` }}
                                                                ></div>
                                                            </div>
                                                        </td>
                                                        <td>{getGradeBadge(result.grade)}</td>
                                                        <td>
                                                            <span className="fw-bold">{result.rank}</span>
                                                            <small className="text-muted">/{result.totalStudents}</small>
                                                        </td>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <FiCalendar className="me-1 text-muted" size={14} />
                                                                {result.date}
                                                            </div>
                                                        </td>
                                                        <td>{getStatusBadge(result.status)}</td>
                                                        <td>
                                                            <div className="d-flex gap-1">
                                                                <button className="btn btn-sm btn-outline-primary">
                                                                    <FiEye />
                                                                </button>
                                                                <button className="btn btn-sm btn-outline-secondary">
                                                                    <FiDownload />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </ProtectedRoute>
    )
}

export default StudentResultsPage