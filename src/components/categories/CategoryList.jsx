'use client'

import React, { useState, useEffect } from 'react'
import { FiDownload, FiUpload, FiPlus, FiSearch, FiEdit2, FiEye, FiTrash2, FiFilter } from 'react-icons/fi'
import Swal from 'sweetalert2'
import SkeletonLoader from './SkeletonLoader'
import AddCategoryModal from './AddCategoryModal'
import EditCategoryModal from './EditCategoryModal'
import ViewCategoryModal from './ViewCategoryModal'

const CategoryList = () => {
    const [categories, setCategories] = useState([])
    const [filteredCategories, setFilteredCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [categoriesPerPage] = useState(10)

    // Modals
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showViewModal, setShowViewModal] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState(null)

    // Load categories
    useEffect(() => {
        loadCategories()
    }, [])

    const loadCategories = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/categories?format=admin')
            const data = await response.json()

            if (data.success) {
                const categoriesData = data.data.map(category => ({
                    id: category._id,
                    name: category.name,
                    description: category.description || '',
                    createdDate: new Date(category.createdAt).toLocaleDateString(),
                    status: category.status,
                    isPublished: category.isPublished
                }))
                setCategories(categoriesData)
                setFilteredCategories(categoriesData)
            }
        } catch (error) {
            console.error('Error loading categories:', error)
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load categories',
                timer: 2000
            })
        } finally {
            setLoading(false)
        }
    }

    // Search and filter
    useEffect(() => {
        let result = categories

        // Search filter
        if (searchTerm) {
            result = result.filter(category =>
                category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                category.description.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Status filter
        if (statusFilter !== 'all') {
            result = result.filter(category => category.status === statusFilter)
        }

        setFilteredCategories(result)
        setCurrentPage(1)
    }, [searchTerm, statusFilter, categories])

    // Pagination
    const indexOfLastCategory = currentPage * categoriesPerPage
    const indexOfFirstCategory = indexOfLastCategory - categoriesPerPage
    const currentCategories = filteredCategories.slice(indexOfFirstCategory, indexOfLastCategory)
    const totalPages = Math.ceil(filteredCategories.length / categoriesPerPage)

    // Export CSV
    const exportToCSV = () => {
        const headers = ['ID', 'Name', 'Description', 'Created Date', 'Status']
        const csvData = filteredCategories.map(c => [
            c.id, c.name, c.description, c.createdDate, c.status
        ])

        let csvContent = headers.join(',') + '\n'
        csvData.forEach(row => {
            csvContent += row.map(field => `"${field}"`).join(',') + '\n'
        })

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `categories_${new Date().toISOString().split('T')[0]}.csv`
        a.click()

        Swal.fire({
            icon: 'success',
            title: 'Exported!',
            text: 'Categories data exported successfully',
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

                const importedCategories = []
                for (let i = 1; i < rows.length; i++) {
                    const values = rows[i].split(',').map(v => v.replace(/"/g, '').trim())
                    if (values.length >= 2) {
                        const newCategory = {
                            id: Date.now() + i,
                            name: values[1],
                            description: values[2] || '',
                            createdDate: new Date().toLocaleDateString(),
                            status: values[4] || 'active',
                        }
                        importedCategories.push(newCategory)
                    }
                }

                if (importedCategories.length > 0) {
                    let successCount = 0

                    for (const category of importedCategories) {
                        try {
                            const response = await fetch('/api/categories', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(category),
                            })
                            const data = await response.json()
                            if (data.success) successCount++
                        } catch (error) {
                            console.error('Error importing category:', error)
                        }
                    }

                    loadCategories()

                    Swal.fire({
                        icon: 'success',
                        title: 'Imported!',
                        text: `${successCount} of ${importedCategories.length} categories imported successfully`,
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

    // Delete category
    const handleDelete = async (category) => {
        const result = await Swal.fire({
            title: 'Delete Category?',
            text: `Are you sure you want to delete "${category.name}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        })

        if (result.isConfirmed) {
            try {
                const response = await fetch(`/api/categories/${category.id}`, {
                    method: 'DELETE',
                })

                const data = await response.json()

                if (data.success) {
                    loadCategories()

                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'Category has been deleted',
                        timer: 2000
                    })
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.message || 'Failed to delete category',
                        timer: 2000
                    })
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to delete category',
                    timer: 2000
                })
            }
        }
    }

    // View category
    const handleView = (category) => {
        setSelectedCategory(category)
        setShowViewModal(true)
    }

    // Edit category
    const handleEdit = (category) => {
        setSelectedCategory(category)
        setShowEditModal(true)
    }

    // Add category success
    const handleAddSuccess = () => {
        loadCategories()
    }

    // Edit category success
    const handleEditSuccess = () => {
        loadCategories()
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
                                    placeholder="Search categories..."
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
                                    disabled={filteredCategories.length === 0}
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
                                <FiPlus className="me-1" /> Add Category
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
                            </select>
                        </div>
                        <div className="col-md-9 text-end">
                            <small className="text-muted">
                                Showing {indexOfFirstCategory + 1} to {Math.min(indexOfLastCategory, filteredCategories.length)} of {filteredCategories.length} categories
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
                                    <th>Description</th>
                                    <th>Created Date</th>
                                    <th>Status</th>
                                    <th>Published</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <SkeletonLoader rows={categoriesPerPage} />
                                ) : currentCategories.length > 0 ? (
                                    currentCategories.map((category, index) => (
                                        <tr key={category.id}>
                                            <td>{indexOfFirstCategory + index + 1}</td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="avatar avatar-sm bg-soft-primary text-primary me-2">
                                                        {category.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="fw-semibold">{category.name}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="text-muted" style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {category.description}
                                                </div>
                                            </td>
                                            <td>{category.createdDate}</td>
                                            <td>
                                                <span className={`badge ${category.status === 'active' ? 'bg-success' : 'bg-secondary'
                                                    }`}>
                                                    {category.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="form-check form-switch cursor-pointer">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={category.isPublished}
                                                        onChange={async () => {
                                                            try {
                                                                const res = await fetch(`/api/categories/${category.id}`, {
                                                                    method: 'PUT',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({
                                                                        ...category,
                                                                        name: category.name, // Required by API
                                                                        isPublished: !category.isPublished
                                                                    })
                                                                });
                                                                if (res.ok) loadCategories();
                                                            } catch (err) {
                                                                console.error(err);
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                            <td>
                                                <div className="btn-group btn-group-sm">
                                                    <button
                                                        className="btn btn-light"
                                                        onClick={() => handleView(category)}
                                                        title="View"
                                                    >
                                                        <FiEye />
                                                    </button>
                                                    <button
                                                        className="btn btn-light"
                                                        onClick={() => handleEdit(category)}
                                                        title="Edit"
                                                    >
                                                        <FiEdit2 />
                                                    </button>
                                                    <button
                                                        className="btn btn-light text-danger"
                                                        onClick={() => handleDelete(category)}
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
                                        <td colSpan="6" className="text-center py-4">
                                            <p className="text-muted">No categories found</p>
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
            </div >

            {/* Modals */}
            {
                showAddModal && (
                    <AddCategoryModal
                        show={showAddModal}
                        onClose={() => setShowAddModal(false)}
                        onSuccess={handleAddSuccess}
                    />
                )
            }

            {
                showEditModal && selectedCategory && (
                    <EditCategoryModal
                        show={showEditModal}
                        category={selectedCategory}
                        onClose={() => {
                            setShowEditModal(false)
                            setSelectedCategory(null)
                        }}
                        onSuccess={handleEditSuccess}
                    />
                )
            }

            {
                showViewModal && selectedCategory && (
                    <ViewCategoryModal
                        show={showViewModal}
                        category={selectedCategory}
                        onClose={() => {
                            setShowViewModal(false)
                            setSelectedCategory(null)
                        }}
                    />
                )
            }
        </>
    )
}

export default CategoryList
