'use client'

import React, { useState, useEffect } from 'react'
import { FiDownload, FiUpload, FiPlus, FiSearch, FiEdit2, FiEye, FiTrash2, FiFilter, FiGlobe, FiSmartphone, FiMail, FiCheckSquare } from 'react-icons/fi'
import { FcGoogle } from 'react-icons/fc'
import { SiGmail } from 'react-icons/si'
import { FaAndroid } from 'react-icons/fa'
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
    const [sourceFilter, setSourceFilter] = useState('all')
    const [authFilter, setAuthFilter] = useState('all')
    const [selectedStudents, setSelectedStudentsList] = useState([]) // ID list of selected students
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

    const truncateName = (name) => {
        if (!name) return '';
        const words = name.split(' ').filter(w => w.length > 0);
        if (words.length > 2) {
            return words.slice(0, 2).join(' ') + '..';
        }
        return name;
    }

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
                    enrollmentDate: new Date(user.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    }),
                    status: user.status || 'active',
                    isGoogleAuth: user.isGoogleAuth || user.authProvider === 'google',
                    authProvider: user.authProvider || 'local',
                    // Prioritize 'app' if registerSource is 'app' OR if fcmToken exists (indicating app usage)
                    registerSource: (user.registerSource === 'app' || user.fcmToken) ? 'app' : 'web',
                    enrolledCourses: user.enrolledCourses || [],
                    emailVerified: user.emailVerified || false,
                    fcmToken: user.fcmToken,
                    address: user.address || '',
                    city: user.city || '',
                    state: user.state || '',
                    pincode: user.pincode || '',
                    dob: user.dob || '',
                    admissionDate: user.admissionDate || '',
                    gender: user.gender || 'other',
                    secondaryEmail: user.secondaryEmail || '',
                    education: user.education || '',
                    profileImage: user.profileImage || null
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
                student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.phone.includes(searchTerm)
            )
        }

        // Status filter
        if (statusFilter !== 'all') {
            result = result.filter(student => student.status === statusFilter)
        }

        // Source filter
        if (sourceFilter !== 'all') {
            result = result.filter(student => student.registerSource === sourceFilter)
        }

        // Auth filter
        if (authFilter !== 'all') {
            if (authFilter === 'google') {
                result = result.filter(student => student.isGoogleAuth)
            } else {
                result = result.filter(student => !student.isGoogleAuth)
            }
        }

        setFilteredStudents(result)
        setCurrentPage(1)
    }, [searchTerm, statusFilter, sourceFilter, authFilter, students])

    // Pagination
    const indexOfLastStudent = currentPage * studentsPerPage
    const indexOfFirstStudent = indexOfLastStudent - studentsPerPage
    const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent)
    const totalPages = Math.ceil(filteredStudents.length / studentsPerPage)

    // Selection Logic
    const toggleSelectStudent = (id) => {
        setSelectedStudentsList(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        )
    }

    const toggleSelectAll = () => {
        if (selectedStudents.length === currentStudents.length) {
            setSelectedStudentsList([])
        } else {
            setSelectedStudentsList(currentStudents.map(s => s.id))
        }
    }

    // Export CSV (Modified to support both all filtered and specific selected)
    const exportToCSV = (specificData = null) => {
        const dataToExport = specificData || filteredStudents

        const headers = [
            'ID',
            'Roll Number',
            'Name',
            'Email',
            'Phone',
            'Register Source',
            'Auth Type',
            'Enroll Date',
            'Status',
            'Enrolled Courses',
            'Full Address'
        ]

        const csvData = dataToExport.map(s => {
            const courseTitles = s.enrolledCourses?.map(c => c.courseId?.title).filter(Boolean).join('; ') || 'No Courses';
            const fullAddress = [s.address, s.city, s.state, s.pincode].filter(Boolean).join(', ') || 'N/A';

            return [
                s.id,
                `"${s.rollNumber}"`,
                `"${s.name}"`,
                s.email,
                s.phone,
                s.registerSource,
                s.isGoogleAuth ? 'Google' : 'Local/Email',
                s.enrollmentDate,
                s.status,
                `"${courseTitles}"`,
                `"${fullAddress}"`
            ]
        })

        let csvContent = headers.join(',') + '\n'
        csvData.forEach(row => {
            csvContent += row.join(',') + '\n'
        })

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `students_report_${new Date().toISOString().split('T')[0]}.csv`
        a.click()

        Swal.fire({
            icon: 'success',
            title: 'CSV Exported!',
            text: `Data for ${dataToExport.length} students has been generated.`,
            timer: 2000
        })
    }

    const handleBulkExport = () => {
        const dataToExport = students.filter(s => selectedStudents.includes(s.id))
        exportToCSV(dataToExport)
    }

    const handleBulkDelete = async () => {
        const result = await Swal.fire({
            title: 'Delete Selected?',
            text: `Are you sure you want to delete ${selectedStudents.length} selected students?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, delete all!'
        })

        if (result.isConfirmed) {
            try {
                setLoading(true)
                let successCount = 0
                for (const id of selectedStudents) {
                    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
                    const data = await res.json()
                    if (data.success) successCount++
                }

                loadStudents()
                setSelectedStudentsList([])
                Swal.fire('Deleted!', `${successCount} students removed.`, 'success')
            } catch (error) {
                Swal.fire('Error', 'Bulk delete failed', 'error')
            } finally {
                setLoading(false)
            }
        }
    }

    // Import CSV logic stays similar but sets source to web
    const importFromCSV = (e) => {
        const file = e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async (event) => {
            try {
                const text = event.target.result
                const rows = text.split('\n').filter(row => row.trim())
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
                            registerSource: 'web',
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
                                    placeholder="Search by Name, Email or Roll Num..."
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

                    {/* Multi-Filters */}
                    <div className="row mb-3 g-2">
                        <div className="col-md-3">
                            <div className="input-group input-group-sm">
                                <span className="input-group-text bg-light"><FiFilter size={12} /></span>
                                <select
                                    className="form-select"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">Every Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="input-group input-group-sm">
                                <span className="input-group-text bg-light"><FiGlobe size={12} /></span>
                                <select
                                    className="form-select"
                                    value={sourceFilter}
                                    onChange={(e) => setSourceFilter(e.target.value)}
                                >
                                    <option value="all">All Sources</option>
                                    <option value="web">Web Users</option>
                                    <option value="app">App Users</option>
                                </select>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="input-group input-group-sm">
                                <span className="input-group-text bg-light"><FiMail size={12} /></span>
                                <select
                                    className="form-select"
                                    value={authFilter}
                                    onChange={(e) => setAuthFilter(e.target.value)}
                                >
                                    <option value="all">All Auth Types</option>
                                    <option value="google">Google Login</option>
                                    <option value="local">Direct/Email</option>
                                </select>
                            </div>
                        </div>
                        <div className="col-md-3 text-end d-flex align-items-center justify-content-end">
                            <small className="text-muted">
                                Total: {filteredStudents.length}
                            </small>
                        </div>
                    </div>

                    {/* Bulk Actions Bar */}
                    {selectedStudents.length > 0 && (
                        <div className="alert alert-primary d-flex align-items-center justify-content-between animate__animated animate__fadeInDown mb-4 py-2 px-3 border-0 shadow-sm" style={{ backgroundColor: '#eef2ff' }}>
                            <div className="d-flex align-items-center gap-3">
                                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
                                    {selectedStudents.length}
                                </div>
                                <span className="fw-bold text-primary">Students Selected</span>
                            </div>
                            <div className="d-flex gap-2">
                                <button className="btn btn-sm btn-outline-primary border-primary" onClick={handleBulkExport}>
                                    <FiDownload className="me-1" /> Export Selected
                                </button>
                                <button className="btn btn-sm btn-danger shadow-sm" onClick={handleBulkDelete}>
                                    <FiTrash2 className="me-1" /> Delete {selectedStudents.length} Students
                                </button>
                                <button className="btn btn-sm btn-light border" onClick={() => setSelectedStudentsList([])}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Table */}
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th style={{ width: '40px' }}>
                                        <div className="form-check">
                                            <input
                                                className="form-check-input cursor-pointer"
                                                type="checkbox"
                                                checked={selectedStudents.length === currentStudents.length && currentStudents.length > 0}
                                                onChange={toggleSelectAll}
                                            />
                                        </div>
                                    </th>
                                    <th style={{ width: '50px' }}>#</th>
                                    <th>Student Info</th>
                                    <th>Mail</th>
                                    <th>Courses Enrolled</th>
                                    <th>Register Date</th>
                                    <th className="text-center">Source/Auth</th>
                                    <th>Status</th>
                                    <th className="text-end">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <SkeletonLoader rows={studentsPerPage} colSpan={9} />
                                ) : currentStudents.length > 0 ? (
                                    currentStudents.map((student, index) => (
                                        <tr key={student.id} className={selectedStudents.includes(student.id) ? 'table-light' : ''}>
                                            <td>
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input cursor-pointer"
                                                        type="checkbox"
                                                        checked={selectedStudents.includes(student.id)}
                                                        onChange={() => toggleSelectStudent(student.id)}
                                                    />
                                                </div>
                                            </td>
                                            <td>{indexOfFirstStudent + index + 1}</td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    {student.profileImage ? (
                                                        <img
                                                            src={student.profileImage}
                                                            alt={student.name}
                                                            className="rounded-circle me-3"
                                                            style={{
                                                                width: '40px',
                                                                height: '40px',
                                                                objectFit: 'cover',
                                                                border: '2px solid #e3e6f0'
                                                            }}
                                                            onError={(e) => {
                                                                // If image fails to load, replace with initials
                                                                const parent = e.target.parentElement;
                                                                const initialsDiv = document.createElement('div');
                                                                initialsDiv.className = 'avatar avatar-md bg-soft-primary text-primary me-3 fw-bold rounded-circle d-flex align-items-center justify-content-center';
                                                                initialsDiv.style.width = '40px';
                                                                initialsDiv.style.height = '40px';
                                                                initialsDiv.textContent = student.name.charAt(0).toUpperCase();
                                                                parent.replaceChild(initialsDiv, e.target);
                                                            }}
                                                        />
                                                    ) : (
                                                        <div
                                                            className="avatar avatar-md bg-soft-primary text-primary me-3 fw-bold rounded-circle d-flex align-items-center justify-content-center"
                                                            style={{
                                                                width: '40px',
                                                                height: '40px'
                                                            }}
                                                        >
                                                            {student.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="fw-bold text-dark" title={student.name}>
                                                            {truncateName(student.name)}
                                                        </div>
                                                        <div className="text-muted" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                                                            {student.rollNumber}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column">
                                                    <span className="text-muted small">{student.email?.endsWith('@mobile.local') ? 'Not Provided' : student.email}</span>
                                                    <span className="text-muted" style={{ fontSize: '10px' }}>{student.phone}</span>
                                                </div>
                                            </td>
                                            <td>
                                                {student.enrolledCourses && student.enrolledCourses.length > 0 ? (
                                                    <div className="d-flex flex-column">
                                                        <span className="badge bg-soft-info text-info border-info-subtle text-truncate" style={{ maxWidth: '150px' }}>
                                                            {student.enrolledCourses[0].courseId?.title || 'Unknown Course'}
                                                        </span>
                                                        {student.enrolledCourses.length > 1 && (
                                                            <small className="text-primary fw-medium mt-1">
                                                                + {student.enrolledCourses.length - 1} more
                                                            </small>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted small">No courses</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="text-muted" style={{ fontSize: '12px' }}>
                                                    {student.enrollmentDate}
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <div className="d-flex justify-content-center gap-3">
                                                    {/* Source Icon */}
                                                    <div title={student.registerSource === 'web' ? 'Web User' : 'App User'}>
                                                        {student.registerSource === 'web' ? (
                                                            <FiGlobe className="text-info" size={18} />
                                                        ) : (
                                                            <FaAndroid className="text-success" size={18} />
                                                        )}
                                                    </div>
                                                    {/* Auth Icon */}
                                                    <div title={student.authProvider === 'google' ? 'Google Account' : student.authProvider === 'mobile' ? 'Mobile OTP Account' : 'Email Account'}>
                                                        {student.authProvider === 'google' ? (
                                                            <FcGoogle size={18} />
                                                        ) : student.authProvider === 'mobile' ? (
                                                            <FiSmartphone className="text-primary" size={18} />
                                                        ) : (
                                                            <div className="position-relative">
                                                                <FiMail className="text-danger" size={18} />
                                                                <SiGmail className="position-absolute" style={{ top: '-2px', right: '-8px', fontSize: '8px', color: '#EA4335' }} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge rounded-pill ${student.status === 'active' ? 'bg-success' :
                                                    student.status === 'inactive' ? 'bg-secondary' :
                                                        'bg-danger'
                                                    }`} style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                                                    {student.status}
                                                </span>
                                            </td>
                                            <td className="text-end">
                                                <div className="btn-group btn-group-sm">
                                                    <button
                                                        className="btn btn-light"
                                                        onClick={() => handleView(student)}
                                                        title="View Profile"
                                                    >
                                                        <FiEye />
                                                    </button>
                                                    <button
                                                        className="btn btn-light"
                                                        onClick={() => handleEdit(student)}
                                                        title="Edit Profile"
                                                    >
                                                        <FiEdit2 />
                                                    </button>
                                                    <button
                                                        className="btn btn-light text-danger"
                                                        onClick={() => handleDelete(student)}
                                                        title="Delete Student"
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="text-center py-5">
                                            <div className="text-muted">
                                                <FiSearch size={40} className="mb-3 opacity-25" />
                                                <p>No students found matching your criteria</p>
                                            </div>
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
                                            Prev
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
