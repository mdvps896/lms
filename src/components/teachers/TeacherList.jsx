'use client'

import React, { useState, useEffect } from 'react'
import { FiDownload, FiUpload, FiPlus, FiSearch, FiEdit2, FiEye, FiTrash2, FiFilter } from 'react-icons/fi'
import Swal from 'sweetalert2'
import SkeletonLoader from './SkeletonLoader'
import AddTeacherModal from './AddTeacherModal'
import EditTeacherModal from './EditTeacherModal'
import ViewTeacherModal from './ViewTeacherModal'

const TeacherList = () => {
    const [teachers, setTeachers] = useState([])
    const [filteredTeachers, setFilteredTeachers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [teachersPerPage] = useState(10)

    // Modals
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showViewModal, setShowViewModal] = useState(false)
    const [selectedTeacher, setSelectedTeacher] = useState(null)

    // Load teachers from MongoDB
    useEffect(() => {
        loadTeachers()
    }, [])

    const loadTeachers = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/users?role=teacher')
            const data = await response.json()

            if (data.success) {
                const teachersData = data.data.map(user => ({
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone || 'N/A',
                    category: user.category?.name || 'Not Assigned',
                    categoryId: user.category?._id || null,
                    joiningDate: new Date(user.createdAt).toLocaleDateString(),
                    status: user.status || 'active',
                    isGoogleAuth: user.isGoogleAuth || false,
                    emailVerified: user.emailVerified || false,
                    permissions: user.permissions || []
                }))
                setTeachers(teachersData)
                setFilteredTeachers(teachersData)
            }
        } catch (error) {
            console.error('Error loading teachers:', error)
        } finally {
            setLoading(false)
        }
    }

    // Search and filter
    useEffect(() => {
        let result = teachers

        // Search filter
        if (searchTerm) {
            result = result.filter(teacher =>
                teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                teacher.phone.includes(searchTerm)
            )
        }

        // Status filter
        if (statusFilter !== 'all') {
            result = result.filter(teacher => teacher.status === statusFilter)
        }

        setFilteredTeachers(result)
        setCurrentPage(1)
    }, [searchTerm, statusFilter, teachers])

    // Pagination
    const indexOfLastTeacher = currentPage * teachersPerPage
    const indexOfFirstTeacher = indexOfLastTeacher - teachersPerPage
    const currentTeachers = filteredTeachers.slice(indexOfFirstTeacher, indexOfLastTeacher)
    const totalPages = Math.ceil(filteredTeachers.length / teachersPerPage)

    // Export CSV
    const exportToCSV = () => {
        const headers = ['ID', 'Name', 'Email', 'Phone', 'Joining Date', 'Status']
        const csvData = filteredTeachers.map(t => [
            t.id, t.name, t.email, t.phone, t.joiningDate, t.status
        ])

        let csvContent = headers.join(',') + '\n'
        csvData.forEach(row => {
            csvContent += row.join(',') + '\n'
        })

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `teachers_${new Date().toISOString().split('T')[0]}.csv`
        a.click()

        Swal.fire({
            icon: 'success',
            title: 'Exported!',
            text: 'Teachers data exported successfully',
            timer: 2000
        })
    }

    // Import CSV
    const importFromCSV = (e) => {
        const file = e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async (event) => {
            try {
                const text = event.target.result
                const rows = text.split('\n').filter(row => row.trim())
                const headers = rows[0].split(',')

                const importedTeachers = []
                for (let i = 1; i < rows.length; i++) {
                    const values = rows[i].split(',')
                    if (values.length >= 4) {
                        const newTeacher = {
                            name: values[1]?.trim(),
                            email: values[2]?.trim(),
                            phone: values[3]?.trim(),
                            password: 'teacher123',
                            role: 'teacher',
                            status: values[5]?.trim() || 'active',
                        }
                        importedTeachers.push(newTeacher)
                    }
                }

                if (importedTeachers.length > 0) {
                    let successCount = 0

                    for (const teacher of importedTeachers) {
                        try {
                            const response = await fetch('/api/users', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(teacher),
                            })
                            const data = await response.json()
                            if (data.success) successCount++
                        } catch (error) {
                            console.error('Error importing teacher:', error)
                        }
                    }

                    loadTeachers()

                    Swal.fire({
                        icon: 'success',
                        title: 'Imported!',
                        text: `${successCount} of ${importedTeachers.length} teachers imported successfully`,
                        timer: 2000
                    })
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to import CSV file',
                    timer: 2000
                })
            }
        }
        reader.readAsText(file)
        e.target.value = ''
    }

    // Delete teacher
    const handleDelete = async (teacher) => {
        const result = await Swal.fire({
            title: 'Delete Teacher?',
            text: `Are you sure you want to delete ${teacher.name}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        })

        if (result.isConfirmed) {
            try {
                const response = await fetch(`/api/users/${teacher.id}`, {
                    method: 'DELETE',
                })

                const data = await response.json()

                if (data.success) {
                    loadTeachers()

                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'Teacher has been deleted',
                        timer: 2000
                    })
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.message || 'Failed to delete teacher',
                        timer: 2000
                    })
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to delete teacher',
                    timer: 2000
                })
            }
        }
    }

    // View teacher
    const handleView = (teacher) => {
        setSelectedTeacher(teacher)
        setShowViewModal(true)
    }

    // Edit teacher
    const handleEdit = (teacher) => {
        setSelectedTeacher(teacher)
        setShowEditModal(true)
    }

    return (
        <>
            <div className="card stretch stretch-full">
                <div className="card-body">
                    {/* Header Actions */}
                    <div className="row mb-4">
                        <div className="col-md-6">
                            <div className="input-group">
                                <span className="input-group-text"><FiSearch /></span>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search teachers..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-md-6 text-end">
                            <div className="btn-group me-2">
                                <button
                                    className="btn btn-sm btn-success"
                                    onClick={exportToCSV}
                                    disabled={filteredTeachers.length === 0}
                                >
                                    <FiDownload className="me-1" /> Export CSV
                                </button>
                                <label className="btn btn-sm btn-warning mb-0">
                                    <FiUpload className="me-1" /> Import CSV
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={importFromCSV}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            </div>
                            <button
                                className="btn btn-sm btn-primary"
                                onClick={() => setShowAddModal(true)}
                            >
                                <FiPlus className="me-1" /> Add Teacher
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="row mb-3">
                        <div className="col-md-3">
                            <select
                                className="form-select form-select-sm"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="suspended">Suspended</option>
                            </select>
                        </div>
                        <div className="col-md-9 text-end">
                            <small className="text-muted">
                                Showing {indexOfFirstTeacher + 1} to {Math.min(indexOfLastTeacher, filteredTeachers.length)} of {filteredTeachers.length} teachers
                            </small>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Category</th>
                                    <th>Joining Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <SkeletonLoader rows={teachersPerPage} />
                                ) : currentTeachers.length > 0 ? (
                                    currentTeachers.map((teacher, index) => (
                                        <tr key={teacher.id}>
                                            <td>{indexOfFirstTeacher + index + 1}</td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="avatar avatar-sm bg-soft-primary text-primary me-2">
                                                        {teacher.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="fw-semibold">{teacher.name}</div>
                                                        {teacher.isGoogleAuth && (
                                                            <small className="badge bg-info">Google Auth</small>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {teacher.email}
                                                {teacher.emailVerified && (
                                                    <span className="ms-1 text-success" title="Verified">✓</span>
                                                )}
                                            </td>
                                            <td>{teacher.phone}</td>
                                            <td>
                                                <span className={`badge ${teacher.categoryId ? 'bg-primary' : 'bg-secondary'}`}>
                                                    {teacher.category}
                                                </span>
                                            </td>
                                            <td>{teacher.joiningDate}</td>
                                            <td>
                                                <span className={`badge ${teacher.status === 'active' ? 'bg-success' :
                                                        teacher.status === 'inactive' ? 'bg-secondary' :
                                                            'bg-danger'
                                                    }`}>
                                                    {teacher.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="btn-group btn-group-sm">
                                                    <button
                                                        className="btn btn-light"
                                                        onClick={() => handleView(teacher)}
                                                        title="View"
                                                    >
                                                        <FiEye />
                                                    </button>
                                                    <button
                                                        className="btn btn-light"
                                                        onClick={() => handleEdit(teacher)}
                                                        title="Edit"
                                                    >
                                                        <FiEdit2 />
                                                    </button>
                                                    <button
                                                        className="btn btn-light text-danger"
                                                        onClick={() => handleDelete(teacher)}
                                                        title="Delete"
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4">
                                            <p className="text-muted">No teachers found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="d-flex justify-content-center mt-4">
                            <nav>
                                <ul className="pagination pagination-sm">
                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        >
                                            Previous
                                        </button>
                                    </li>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => setCurrentPage(i + 1)}
                                            >
                                                {i + 1}
                                            </button>
                                        </li>
                                    ))}
                                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        >
                                            Next
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showAddModal && (
                <AddTeacherModal
                    show={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={loadTeachers}
                />
            )}

            {showEditModal && selectedTeacher && (
                <EditTeacherModal
                    show={showEditModal}
                    teacher={selectedTeacher}
                    onClose={() => {
                        setShowEditModal(false)
                        setSelectedTeacher(null)
                    }}
                    onSuccess={loadTeachers}
                />
            )}

            {showViewModal && selectedTeacher && (
                <ViewTeacherModal
                    show={showViewModal}
                    teacher={selectedTeacher}
                    onClose={() => {
                        setShowViewModal(false)
                        setSelectedTeacher(null)
                    }}
                />
            )}
        </>
    )
}

export default TeacherList
