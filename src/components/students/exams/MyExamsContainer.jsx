'use client'
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ExamFilters from './ExamFilters'
import ExamGrid from './ExamGrid'
import ExamSkeletonLoader from './ExamSkeletonLoader'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import Link from 'next/link'

const MyExamsContainer = () => {
    const { user } = useAuth()
    const [exams, setExams] = useState([])
    const [filteredExams, setFilteredExams] = useState([])
    const [subjects, setSubjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({
        status: 'all', // all, current, upcoming, completed, live
        type: 'all', // all, regular, live
        subject: '',
        searchTerm: '',
        dateRange: 'all' // all, today, week, month
    })

    useEffect(() => {
        if (user && (user.category?._id || user.category)) {
            fetchExams()
            fetchSubjects()
        }
    }, [user])

    useEffect(() => {
        applyFilters()
    }, [exams, filters])

    const fetchExams = async () => {
        setLoading(true)
        try {
            // Extract category ID - handle both populated and non-populated cases
            const categoryId = user.category?._id || user.category

            if (!categoryId) {
                console.error('No category found for user')
                setLoading(false)
                return
            }

            const response = await fetch(`/api/exams/student?category=${categoryId}`)
            const data = await response.json()

            if (data.success) {
                setExams(data.data)
                // Debug first exam
                if (data.data && data.data.length > 0) {
                    }
            } else {
                console.error('Failed to fetch exams:', data.message)
            }
        } catch (error) {
            console.error('Error fetching exams:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchSubjects = async () => {
        try {
            // Extract category ID - handle both populated and non-populated cases
            const categoryId = user.category?._id || user.category

            if (!categoryId) {
                console.error('No category found for user')
                return
            }

            const response = await fetch(`/api/subjects?category=${categoryId}`)
            const data = await response.json()

            if (data.success) {
                setSubjects(data.data)
            }
        } catch (error) {
            console.error('Error fetching subjects:', error)
        }
    }

    const applyFilters = () => {
        let result = [...exams]
        const now = new Date()

        // Status filter
        if (filters.status !== 'all') {
            result = result.filter(exam => {
                const startDate = new Date(exam.startDate)
                const endDate = new Date(exam.endDate)

                switch (filters.status) {
                    case 'current':
                        return startDate <= now && endDate >= now
                    case 'upcoming':
                        return startDate > now
                    case 'completed':
                        return endDate < now
                    case 'live':
                        return exam.type === 'live' && startDate <= now && endDate >= now
                    default:
                        return true
                }
            })
        }

        // Type filter
        if (filters.type !== 'all') {
            result = result.filter(exam => exam.type === filters.type)
        }

        // Subject filter
        if (filters.subject) {
            result = result.filter(exam =>
                exam.subjects?.some(subject => subject._id === filters.subject || subject === filters.subject)
            )
        }

        // Search filter
        if (filters.searchTerm) {
            result = result.filter(exam =>
                exam.name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                exam.description?.toLowerCase().includes(filters.searchTerm.toLowerCase())
            )
        }

        // Date range filter
        if (filters.dateRange !== 'all') {
            const today = new Date()
            const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
            const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

            result = result.filter(exam => {
                const examDate = new Date(exam.startDate)

                switch (filters.dateRange) {
                    case 'today':
                        return examDate.toDateString() === today.toDateString()
                    case 'week':
                        return examDate <= weekFromNow && examDate >= today
                    case 'month':
                        return examDate <= monthFromNow && examDate >= today
                    default:
                        return true
                }
            })
        }

        setFilteredExams(result)
    }

    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }))
    }

    return (
        <>
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-left d-flex align-items-center">
                    <div className="page-header-title">
                        <h5 className="m-b-10">My Exams</h5>
                    </div>
                    <ul className="breadcrumb">
                        <li className="breadcrumb-item"><Link href="/">Home</Link></li>
                        <li className="breadcrumb-item">My Exams</li>
                    </ul>
                </div>
                <div className="page-header-right ms-auto">
                    <div className="page-header-right-items">
                        <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-info">
                                {filteredExams.length} of {exams.length} exams
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="main-content">
                {/* Filters */}
                <ExamFilters
                    filters={filters}
                    subjects={subjects}
                    onFilterChange={handleFilterChange}
                />

                {/* Exam Grid */}
                {loading ? (
                    <ExamSkeletonLoader />
                ) : (
                    <ExamGrid exams={filteredExams} />
                )}
            </div>
        </>
    )
}

export default MyExamsContainer