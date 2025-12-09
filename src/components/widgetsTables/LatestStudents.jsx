'use client'
import React, { useEffect, useState } from 'react'
import CardHeader from '@/components/shared/CardHeader'
import CardLoader from '@/components/shared/CardLoader'
import useCardTitleActions from '@/hooks/useCardTitleActions'
import Link from 'next/link'

const LatestStudents = ({ title }) => {
    const { refreshKey, isRemoved, isExpanded, handleRefresh, handleExpand, handleDelete } = useCardTitleActions()
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStudents()
    }, [refreshKey])

    const fetchStudents = async () => {
        try {
            const response = await fetch('/api/users?role=student&limit=5&sort=createdAt')
            const data = await response.json()
            if (data.success) {
                setStudents(data.users || [])
            }
        } catch (error) {
            console.error('Error fetching students:', error)
        } finally {
            setLoading(false)
        }
    }

    if (isRemoved) {
        return null
    }

    const formatDate = (date) => {
        const d = new Date(date)
        const day = String(d.getDate()).padStart(2, '0')
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const year = d.getFullYear()
        return `${day}/${month}/${year}`
    }

    const getStatusBadge = (status) => {
        const statusClasses = {
            active: 'badge-soft-success',
            inactive: 'badge-soft-warning',
            suspended: 'badge-soft-danger'
        }
        return statusClasses[status] || 'badge-soft-secondary'
    }

    return (
        <div className="col-xxl-6">
            <div className={`card stretch stretch-full ${isExpanded ? "card-expand" : ""} ${refreshKey ? "card-loading" : ""}`}>
                <CardHeader title={title} refresh={handleRefresh} remove={handleDelete} expanded={handleExpand} />
                <div className="card-body custom-card-action p-0">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead>
                                <tr className="border-b">
                                    <th scope="row">Student Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Status</th>
                                    <th>Joined Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-4">
                                            <div className="spinner-border spinner-border-sm text-primary" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : students.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-4 text-muted">
                                            No students found
                                        </td>
                                    </tr>
                                ) : (
                                    students.map((student) => (
                                        <tr key={student._id}>
                                            <td>
                                                <Link href={`/students/${student._id}`} className="hstack gap-3">
                                                    <div className="avatar-image avatar-md">
                                                        <div className="avatar-text bg-soft-primary text-primary">
                                                            {student.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-truncate-1-line">{student.name}</span>
                                                    </div>
                                                </Link>
                                            </td>
                                            <td>
                                                <span className="text-truncate-1-line">{student.email}</span>
                                            </td>
                                            <td>
                                                <span className="text-truncate-1-line">{student.phone || 'N/A'}</span>
                                            </td>
                                            <td>
                                                <span className={`badge ${getStatusBadge(student.status)}`}>
                                                    {student.status}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="text-truncate-1-line">{formatDate(student.createdAt)}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <Link href="/students" className="card-footer fs-11 fw-bold text-uppercase text-center">
                    View All Students
                </Link>
                <CardLoader refreshKey={refreshKey} />
            </div>
        </div>
    )
}

export default LatestStudents
