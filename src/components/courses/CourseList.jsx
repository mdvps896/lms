'use client'

import React, { useState, useEffect } from 'react'
import { FiDownload, FiUpload, FiPlus, FiSearch, FiEdit2, FiTrash2, FiLayers, FiEye, FiCheckSquare } from 'react-icons/fi'
import Swal from 'sweetalert2'
import SkeletonLoader from '@/components/categories/SkeletonLoader' // Reusing the skeleton loader
import CourseFormModal from './CourseFormModal'
import LectureManagerModal from './LectureManagerModal'
import CourseViewModal from './CourseViewModal'
import CourseExamManagerModal from './CourseExamManagerModal'

const CourseList = () => {
    const [courses, setCourses] = useState([])
    const [filteredCourses, setFilteredCourses] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10)

    // Modals
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isLectureOpen, setIsLectureOpen] = useState(false)
    const [isExamManagerOpen, setIsExamManagerOpen] = useState(false)
    const [isViewOpen, setIsViewOpen] = useState(false) // New State
    const [selectedCourse, setSelectedCourse] = useState(null)

    useEffect(() => {
        fetchCourses()
    }, [])

    const fetchCourses = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/courses?format=admin')
            const data = await res.json()
            if (data.success) {
                setCourses(data.data)
                setFilteredCourses(data.data)
            }
        } catch (err) {
            console.error(err)
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load courses',
                timer: 2000
            })
        } finally {
            setLoading(false)
        }
    }

    // Search filter
    useEffect(() => {
        let result = courses
        if (searchTerm) {
            result = result.filter(c =>
                c.title.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }
        setFilteredCourses(result)
        setCurrentPage(1)
    }, [searchTerm, courses])

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const currentItems = filteredCourses.slice(indexOfFirstItem, indexOfLastItem)
    const totalPages = Math.ceil(filteredCourses.length / itemsPerPage)

    const handleDelete = async (course) => {
        const result = await Swal.fire({
            title: 'Delete Course?',
            text: `Are you sure you want to delete "${course.title}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        })

        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/courses/${course._id}`, { method: 'DELETE' })
                if (res.ok) {
                    fetchCourses()
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'Course has been deleted',
                        timer: 2000
                    })
                } else {
                    Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete' })
                }
            } catch (e) {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete' })
            }
        }
    }

    const [isCreating, setIsCreating] = useState(false)

    const handleCreate = () => {
        setIsCreating(true);
        // Simulate a small delay for better UX or just to show the loader
        setTimeout(() => {
            setSelectedCourse(null);
            setIsFormOpen(true);
            setIsCreating(false);
        }, 500);
    }
    const handleEdit = (course) => { setSelectedCourse(course); setIsFormOpen(true); }
    const handleLectures = (course) => { setSelectedCourse(course); setIsLectureOpen(true); }
    const handleExams = (course) => { setSelectedCourse(course); setIsExamManagerOpen(true); }
    const handleView = (course) => { setSelectedCourse(course); setIsViewOpen(true); }
    const handleFormSave = () => { setIsFormOpen(false); fetchCourses(); }

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
                                    placeholder="Search courses..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-md-6 text-end">
                            <button
                                className="btn btn-primary"
                                onClick={handleCreate}
                                disabled={isCreating}
                            >
                                {isCreating ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Loading...
                                    </>
                                ) : (
                                    <>
                                        <FiPlus className="me-1" /> Create New Course
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Thumbnail</th>
                                    <th>Title</th>
                                    <th>Category</th>
                                    <th>Subjects</th>
                                    <th>Price</th>
                                    <th>Duration</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <SkeletonLoader rows={itemsPerPage} />
                                ) : currentItems.length > 0 ? (
                                    currentItems.map((course, index) => (
                                        <tr key={course._id}>
                                            <td>{indexOfFirstItem + index + 1}</td>
                                            <td>
                                                <img
                                                    src={course.thumbnail || 'https://via.placeholder.com/50'}
                                                    alt="thumb"
                                                    style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                                                />
                                            </td>
                                            <td>
                                                <div className="fw-semibold">{course.title}</div>
                                            </td>
                                            <td>
                                                <span className="badge bg-light text-dark">
                                                    {course.category ? course.category.name : 'Global'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '250px' }}>
                                                    {course.subjects && course.subjects.length > 0 ? (
                                                        <>
                                                            {course.subjects.slice(0, 3).map((sub) => (
                                                                <span key={sub._id || sub.name} className="badge bg-light text-secondary border" style={{ fontSize: '11px', fontWeight: 'normal' }}>
                                                                    {sub.name}
                                                                </span>
                                                            ))}
                                                            {course.subjects.length > 3 && (
                                                                <span className="badge bg-light text-muted border" style={{ fontSize: '11px' }}>
                                                                    +{course.subjects.length - 3} more
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-muted small">-</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                {course.isFree ? <span className="text-success fw-bold">FREE</span> : `₹${course.price}`}
                                            </td>
                                            <td>{course.duration.value} {course.duration.unit}</td>
                                            <td>
                                                <span className={`badge ${course.isActive ? 'bg-success' : 'bg-secondary'}`}>
                                                    {course.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="btn-group btn-group-sm">
                                                    <button
                                                        className="btn btn-light text-info"
                                                        onClick={() => handleView(course)}
                                                        title="View Details"
                                                    >
                                                        <FiEye />
                                                    </button>
                                                    <button
                                                        className="btn btn-light text-primary"
                                                        onClick={() => handleLectures(course)}
                                                        title="Manage Curriculum"
                                                    >
                                                        <FiLayers />
                                                    </button>
                                                    <button
                                                        className="btn btn-light text-warning"
                                                        onClick={() => handleExams(course)}
                                                        title="Manage Exams"
                                                    >
                                                        <FiCheckSquare />
                                                    </button>
                                                    <button
                                                        className="btn btn-light"
                                                        onClick={() => handleEdit(course)}
                                                        title="Edit"
                                                    >
                                                        <FiEdit2 />
                                                    </button>
                                                    <button
                                                        className="btn btn-light text-danger"
                                                        onClick={() => handleDelete(course)}
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
                                        <td colSpan="8" className="text-center py-4">
                                            <p className="text-muted">No courses found</p>
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
                </div >
            </div >

            {isFormOpen && (
                <CourseFormModal
                    course={selectedCourse}
                    onClose={() => setIsFormOpen(false)}
                    onSave={handleFormSave}
                />
            )}

            {
                isLectureOpen && selectedCourse && (
                    <LectureManagerModal
                        course={selectedCourse}
                        onClose={() => setIsLectureOpen(false)}
                        onUpdate={fetchCourses}
                    />
                )
            }

            {
                isExamManagerOpen && selectedCourse && (
                    <CourseExamManagerModal
                        course={selectedCourse}
                        onClose={() => setIsExamManagerOpen(false)}
                        onUpdate={fetchCourses}
                    />
                )
            }

            {
                isViewOpen && selectedCourse && (
                    <CourseViewModal
                        course={selectedCourse}
                        onClose={() => setIsViewOpen(false)}
                    />
                )
            }
        </>
    )
}

export default CourseList
