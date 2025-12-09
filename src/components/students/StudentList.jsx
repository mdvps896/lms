'use client'

import React, { useState, useEffect } from 'react'
import { FiDownload, FiUpload, FiPlus, FiSearch, FiEdit2, FiEye, FiTrash2, FiFilter } from 'react-icons/fi'
import Swal from 'sweetalert2'
import SkeletonLoader from './SkeletonLoader'
import AddStudentModal from './AddStudentModal'
import EditStudentModal from './EditStudentModal'
import ViewStudentModal from './ViewStudentModal'

const StudentList = () => {
    const [students, setStudents] = useState([])
    const [filteredStudents, setFilteredStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [studentsPerPage] = useState(10)
    
    // Modals
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showViewModal, setShowViewModal] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState(null)

    // Load students from MongoDB
    useEffect(() => {
        loadStudents()
    }, [])

    const loadStudents = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/users?role=student&populate=category')
            const data = await response.json()
            
            if (data.success) {
                const studentsData = data.data.map(user => ({
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone || 'N/A',
                    rollNumber: user.rollNumber || 'Not Assigned',
                    category: user.category ? user.category.name : 'Not Assigned',
                    categoryId: user.category ? user.category._id : null,
                    enrollmentDate: new Date(user.createdAt).toLocaleDateString(),
                    status: user.status || 'active',
                    isGoogleAuth: user.isGoogleAuth || false,
                    emailVerified: user.emailVerified || false
                }))
                setStudents(studentsData)
                setFilteredStudents(studentsData)
            }
        } catch (error) {
            console.error('Error loading students:', error)
        } finally {
            setLoading(false)
        }
    }

    // Search and filter
    useEffect(() => {
        let result = students

        // Search filter
        if (searchTerm) {
            result = result.filter(student =>
                student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.phone.includes(searchTerm)
            )
        }

        // Status filter
        if (statusFilter !== 'all') {
            result = result.filter(student => student.status === statusFilter)
        }

        setFilteredStudents(result)
        setCurrentPage(1)
    }, [searchTerm, statusFilter, students])

    // Pagination
    const indexOfLastStudent = currentPage * studentsPerPage
    const indexOfFirstStudent = indexOfLastStudent - studentsPerPage
    const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent)
    const totalPages = Math.ceil(filteredStudents.length / studentsPerPage)

    // Export CSV
    const exportToCSV = () => {
        const headers = ['ID', 'Name', 'Email', 'Phone', 'Roll Number', 'Category', 'Enrollment Date', 'Status']
        const csvData = filteredStudents.map(s => [
            s.id, s.name, s.email, s.phone, s.rollNumber, s.category, s.enrollmentDate, s.status
        ])

        let csvContent = headers.join(',') + '\\n'
        csvData.forEach(row => {
            csvContent += row.join(',') + '\\n'
        })

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `students_${new Date().toISOString().split('T')[0]}.csv`
        a.click()

        Swal.fire({
            icon: 'success',
            title: 'Exported!',
            text: 'Students data exported successfully',
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
                const rows = text.split('\\n').filter(row => row.trim())
                const headers = rows[0].split(',')
                
                const importedStudents = []
                for (let i = 1; i < rows.length; i++) {
                    const values = rows[i].split(',')
                    if (values.length >= 4) {
                        const newStudent = {
                            name: values[1]?.trim(),
                            email: values[2]?.trim(),
                            phone: values[3]?.trim(),
                            password: 'student123',
                            role: 'student',
                            status: values[5]?.trim() || 'active',
                        }
                        importedStudents.push(newStudent)
                    }
                }

                if (importedStudents.length > 0) {
                    let successCount = 0
                    
                    for (const student of importedStudents) {
                        try {
                            const response = await fetch('/api/users', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(student),
                            })
                            const data = await response.json()
                            if (data.success) successCount++
                        } catch (error) {
                            console.error('Error importing student:', error)
                        }
                    }
                    
                    loadStudents()
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Imported!',
                        text: `${successCount} of ${importedStudents.length} students imported successfully`,
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

    // Delete student
    const handleDelete = async (student) => {
        const result = await Swal.fire({
            title: 'Delete Student?',
            text: `Are you sure you want to delete ${student.name}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        })

        if (result.isConfirmed) {
            try {
                const response = await fetch(`/api/users/${student.id}`, {
                    method: 'DELETE',
                })

                const data = await response.json()

                if (data.success) {
                    loadStudents()
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'Student has been deleted',
                        timer: 2000
                    })
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.message || 'Failed to delete student',
                        timer: 2000
                    })
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to delete student',
                    timer: 2000
                })
            }
        }
    }

    // View student
    const handleView = (student) => {
        setSelectedStudent(student)
        setShowViewModal(true)
    }

    // Edit student
    const handleEdit = (student) => {
        setSelectedStudent(student)
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
                                    placeholder="Search students..."
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
                                    disabled={filteredStudents.length === 0}
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
                                <FiPlus className="me-1" /> Add Student
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
                                Showing {indexOfFirstStudent + 1} to {Math.min(indexOfLastStudent, filteredStudents.length)} of {filteredStudents.length} students
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
                                    <th>Roll Number</th>
                                    <th>Category</th>
                                    <th>Enrollment Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <SkeletonLoader rows={studentsPerPage} />
                                ) : currentStudents.length > 0 ? (
                                    currentStudents.map((student, index) => (
                                        <tr key={student.id}>
                                            <td>{indexOfFirstStudent + index + 1}</td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="avatar avatar-sm bg-soft-primary text-primary me-2">
                                                        {student.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="fw-semibold">{student.name}</div>
                                                        {student.isGoogleAuth && (
                                                            <small className="badge bg-info">Google Auth</small>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {student.email}
                                                {student.emailVerified && (
                                                    <span className="ms-1 text-success" title="Verified">✓</span>
                                                )}
                                            </td>
                                            <td>{student.phone}</td>
                                            <td>
                                                <span className="badge bg-primary">
                                                    {student.rollNumber}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="badge bg-light text-dark">
                                                    {student.category}
                                                </span>
                                            </td>
                                            <td>{student.enrollmentDate}</td>
                                            <td>
                                                <span className={`badge ${
                                                    student.status === 'active' ? 'bg-success' :
                                                    student.status === 'inactive' ? 'bg-secondary' :
                                                    'bg-danger'
                                                }`}>
                                                    {student.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="btn-group btn-group-sm">
                                                    <button
                                                        className="btn btn-light"
                                                        onClick={() => handleView(student)}
                                                        title="View"
                                                    >
                                                        <FiEye />
                                                    </button>
                                                    <button
                                                        className="btn btn-light"
                                                        onClick={() => handleEdit(student)}
                                                        title="Edit"
                                                    >
                                                        <FiEdit2 />
                                                    </button>
                                                    <button
                                                        className="btn btn-light text-danger"
                                                        onClick={() => handleDelete(student)}
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
                                            <p className="text-muted">No students found</p>
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
                <AddStudentModal
                    show={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={loadStudents}
                />
            )}

            {showEditModal && selectedStudent && (
                <EditStudentModal
                    show={showEditModal}
                    student={selectedStudent}
                    onClose={() => {
                        setShowEditModal(false)
                        setSelectedStudent(null)
                    }}
                    onSuccess={loadStudents}
                />
            )}

            {showViewModal && selectedStudent && (
                <ViewStudentModal
                    show={showViewModal}
                    student={selectedStudent}
                    onClose={() => {
                        setShowViewModal(false)
                        setSelectedStudent(null)
                    }}
                />
            )}
        </>
    )
}

export default StudentList
