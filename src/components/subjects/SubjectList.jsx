'use client'

import React, { useState, useEffect } from 'react'
import { FiDownload, FiUpload, FiPlus, FiSearch, FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi'
import Swal from 'sweetalert2'
import SkeletonLoader from './SkeletonLoader'
import AddSubjectModal from './AddSubjectModal'
import EditSubjectModal from './EditSubjectModal'
import ViewSubjectModal from './ViewSubjectModal'

const SubjectList = () => {
    const [subjects, setSubjects] = useState([])
    const [filteredSubjects, setFilteredSubjects] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [subjectsPerPage] = useState(10)
    
    // Modals
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showViewModal, setShowViewModal] = useState(false)
    const [selectedSubject, setSelectedSubject] = useState(null)

    // Load subjects and categories
    useEffect(() => {
        loadSubjects()
        loadCategories()
    }, [])

    const loadCategories = async () => {
        try {
            const response = await fetch('/api/categories')
            const data = await response.json()
            
            if (data.success) {
                setCategories(data.data.filter(cat => cat.status === 'active'))
            }
        } catch (error) {
            console.error('Error loading categories:', error)
        }
    }

    const loadSubjects = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/subjects')
            const data = await response.json()
            
            if (data.success) {
                const subjectsData = data.data.map(subject => ({
                    id: subject._id,
                    name: subject.name,
                    categoryId: subject.category?._id,
                    categoryName: subject.category?.name || 'N/A',
                    description: subject.description || '',
                    createdDate: new Date(subject.createdAt).toLocaleDateString(),
                    status: subject.status
                }))
                setSubjects(subjectsData)
                setFilteredSubjects(subjectsData)
            }
        } catch (error) {
            console.error('Error loading subjects:', error)
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load subjects',
                timer: 2000
            })
        } finally {
            setLoading(false)
        }
    }

    // Search and filter
    useEffect(() => {
        let result = subjects

        // Search filter
        if (searchTerm) {
            result = result.filter(subject =>
                subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                subject.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                subject.description.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Status filter
        if (statusFilter !== 'all') {
            result = result.filter(subject => subject.status === statusFilter)
        }

        // Category filter
        if (categoryFilter !== 'all') {
            result = result.filter(subject => subject.categoryId === categoryFilter)
        }

        setFilteredSubjects(result)
        setCurrentPage(1)
    }, [searchTerm, statusFilter, categoryFilter, subjects])

    // Pagination
    const indexOfLastSubject = currentPage * subjectsPerPage
    const indexOfFirstSubject = indexOfLastSubject - subjectsPerPage
    const currentSubjects = filteredSubjects.slice(indexOfFirstSubject, indexOfLastSubject)
    const totalPages = Math.ceil(filteredSubjects.length / subjectsPerPage)

    // Export CSV
    const exportToCSV = () => {
        const headers = ['ID', 'Name', 'Category', 'Description', 'Created Date', 'Status']
        const csvData = filteredSubjects.map(s => [
            s.id, s.name, s.categoryName, s.description, s.createdDate, s.status
        ])

        let csvContent = headers.join(',') + '\n'
        csvData.forEach(row => {
            csvContent += row.map(field => `"${field}"`).join(',') + '\n'
        })

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `subjects_${new Date().toISOString().split('T')[0]}.csv`
        a.click()

        Swal.fire({
            icon: 'success',
            title: 'Exported!',
            text: 'Subjects data exported successfully',
            timer: 2000
        })
    }

    // Delete subject
    const handleDelete = async (subject) => {
        const result = await Swal.fire({
            title: 'Delete Subject?',
            text: `Are you sure you want to delete "${subject.name}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        })

        if (result.isConfirmed) {
            try {
                const response = await fetch(`/api/subjects/${subject.id}`, {
                    method: 'DELETE',
                })

                const data = await response.json()

                if (data.success) {
                    loadSubjects()
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'Subject has been deleted',
                        timer: 2000
                    })
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.message || 'Failed to delete subject',
                        timer: 2000
                    })
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to delete subject',
                    timer: 2000
                })
            }
        }
    }

    // View subject
    const handleView = (subject) => {
        setSelectedSubject(subject)
        setShowViewModal(true)
    }

    // Edit subject
    const handleEdit = (subject) => {
        setSelectedSubject(subject)
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
                                    placeholder="Search subjects..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-md-6 text-end">
                            <button 
                                className="btn btn-sm btn-success me-2"
                                onClick={exportToCSV}
                                disabled={filteredSubjects.length === 0}
                            >
                                <FiDownload className="me-1" /> Export CSV
                            </button>
                            <button 
                                className="btn btn-sm btn-primary"
                                onClick={() => setShowAddModal(true)}
                            >
                                <FiPlus className="me-1" /> Add Subject
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="row mb-3">
                        <div className="col-md-3">
                            <select
                                className="form-select form-select-sm"
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                <option value="all">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <select
                                className="form-select form-select-sm"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <div className="col-md-6 text-end">
                            <small className="text-muted">
                                Showing {indexOfFirstSubject + 1} to {Math.min(indexOfLastSubject, filteredSubjects.length)} of {filteredSubjects.length} subjects
                            </small>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Subject Name</th>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th>Created Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <SkeletonLoader rows={subjectsPerPage} />
                                ) : currentSubjects.length > 0 ? (
                                    currentSubjects.map((subject, index) => (
                                        <tr key={subject.id}>
                                            <td>{indexOfFirstSubject + index + 1}</td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="avatar avatar-sm bg-soft-primary text-primary me-2">
                                                        {subject.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="fw-semibold">{subject.name}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge bg-info">{subject.categoryName}</span>
                                            </td>
                                            <td>
                                                <div className="text-muted" style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {subject.description || 'N/A'}
                                                </div>
                                            </td>
                                            <td>{subject.createdDate}</td>
                                            <td>
                                                <span className={`badge ${
                                                    subject.status === 'active' ? 'bg-success' : 'bg-secondary'
                                                }`}>
                                                    {subject.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="btn-group btn-group-sm">
                                                    <button
                                                        className="btn btn-light"
                                                        onClick={() => handleView(subject)}
                                                        title="View"
                                                    >
                                                        <FiEye />
                                                    </button>
                                                    <button
                                                        className="btn btn-light"
                                                        onClick={() => handleEdit(subject)}
                                                        title="Edit"
                                                    >
                                                        <FiEdit2 />
                                                    </button>
                                                    <button
                                                        className="btn btn-light text-danger"
                                                        onClick={() => handleDelete(subject)}
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
                                            <p className="text-muted">No subjects found</p>
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
                <AddSubjectModal
                    show={showAddModal}
                    categories={categories}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={loadSubjects}
                />
            )}

            {showEditModal && selectedSubject && (
                <EditSubjectModal
                    show={showEditModal}
                    subject={selectedSubject}
                    categories={categories}
                    onClose={() => {
                        setShowEditModal(false)
                        setSelectedSubject(null)
                    }}
                    onSuccess={loadSubjects}
                />
            )}

            {showViewModal && selectedSubject && (
                <ViewSubjectModal
                    show={showViewModal}
                    subject={selectedSubject}
                    onClose={() => {
                        setShowViewModal(false)
                        setSelectedSubject(null)
                    }}
                />
            )}
        </>
    )
}

export default SubjectList
