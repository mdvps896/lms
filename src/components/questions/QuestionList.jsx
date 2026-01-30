'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { FiPlus, FiSearch, FiEdit2, FiEye, FiTrash2, FiFilter, FiDownload, FiUpload, FiCheck, FiDatabase } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import AddQuestionModal from './AddQuestionModal';
import EditQuestionModal from './EditQuestionModal';
import ViewQuestionModal from './ViewQuestionModal';
import CSVImportModal from './CSVImportModal';
import CSVExportModal from './CSVExportModal';
import JSONImportModal from './JSONImportModal';
import RecycleBinModal from './RecycleBinModal';

const QuestionList = () => {
    const searchParams = useSearchParams();
    const fileInputRef = useRef(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showJsonImportModal, setShowJsonImportModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showRecycleBin, setShowRecycleBin] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [userRole, setUserRole] = useState(null); // 'admin', 'teacher', etc.

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [questionsPerPage, setQuestionsPerPage] = useState(10);

    // Bulk Selection
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [selectAll, setSelectAll] = useState(false);

    // Import/Export
    const [importing, setImporting] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Filters
    const [categories, setCategories] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [questionGroups, setQuestionGroups] = useState([]);

    const [filters, setFilters] = useState({
        category: 'all',
        subject: 'all',
        questionGroup: 'all',
        type: 'all',
        status: 'all'
    });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Get search term from URL parameter
        const urlSearch = searchParams.get('search');
        if (urlSearch) {
            setSearchTerm(urlSearch);
        }

        fetchUserInfo();
        fetchQuestions();
        fetchCategories();
    }, [searchParams]);

    const fetchUserInfo = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setUserRole(data.data.role);
                }
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, [filters, currentPage, questionsPerPage, searchTerm]);

    // Bulk Selection Functions
    const handleSelectAll = (e) => {
        const checked = e.target.checked;
        setSelectAll(checked);
        if (checked) {
            setSelectedQuestions(questions.map(q => q._id));
        } else {
            setSelectedQuestions([]);
        }
    };

    const handleSelectQuestion = (questionId, checked) => {
        if (checked) {
            setSelectedQuestions([...selectedQuestions, questionId]);
        } else {
            setSelectedQuestions(selectedQuestions.filter(id => id !== questionId));
            setSelectAll(false);
        }
    };

    // Bulk Delete
    const handleBulkDelete = async () => {
        if (selectedQuestions.length === 0) {
            Swal.fire('Warning', 'Please select questions to delete', 'warning');
            return;
        }

        const result = await Swal.fire({
            title: `Delete ${selectedQuestions.length} questions?`,
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete them!'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch('/api/questions/bulk-delete', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ questionIds: selectedQuestions })
                });

                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }

                const text = await res.text();
                if (!text) {
                    throw new Error('Empty response from server');
                }

                const data = JSON.parse(text);

                if (data.success) {
                    fetchQuestions();
                    setSelectedQuestions([]);
                    setSelectAll(false);
                    toast.success(`${selectedQuestions.length} questions deleted successfully!`);
                } else {
                    throw new Error(data.message || 'Failed to delete questions');
                }
            } catch (error) {
                console.error('Delete error:', error);
                toast.error(error.message || 'Failed to delete questions');
            }
        }
    };

    useEffect(() => {
        // Update selectAll state when selectedQuestions change
        if (questions.length > 0 && selectedQuestions.length === questions.length) {
            setSelectAll(true);
        } else {
            setSelectAll(false);
        }
    }, [selectedQuestions, questions]);

    useEffect(() => {
        if (filters.category !== 'all') {
            fetchSubjects(filters.category);
        } else {
            setSubjects([]);
            setQuestionGroups([]);
        }
    }, [filters.category]);

    useEffect(() => {
        if (filters.subject !== 'all') {
            fetchQuestionGroups(filters.subject);
        } else {
            setQuestionGroups([]);
        }
    }, [filters.subject]);

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                ...filters,
                page: currentPage,
                limit: questionsPerPage,
                search: searchTerm
            }).toString();

            const res = await fetch(`/api/questions?${queryParams}`);

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const text = await res.text();
            if (!text) {
                throw new Error('Empty response from server');
            }

            const data = JSON.parse(text);

            if (data.success) {
                setQuestions(data.data || []);
                setTotalPages(data.totalPages || 1);
                setTotalQuestions(data.total || 0);
                // Reset selections when questions change
                setSelectedQuestions([]);
                setSelectAll(false);
            } else {
                throw new Error(data.message || 'Failed to fetch questions');
            }
        } catch (error) {
            console.error('Error fetching questions:', error);
            if (error.message.includes('JSON')) {
                toast.error('Invalid response from server. Please try again.');
            } else {
                toast.error(error.message || 'Failed to fetch questions');
            }
            // Set empty state on error
            setQuestions([]);
            setTotalPages(1);
            setTotalQuestions(0);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories?status=active');
            if (!res.ok) return;

            const text = await res.text();
            if (!text) return;

            const data = JSON.parse(text);
            if (data.success) setCategories(data.data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchSubjects = async (categoryId) => {
        try {
            const res = await fetch(`/api/subjects?category=${categoryId}&status=active`);
            if (!res.ok) return;

            const text = await res.text();
            if (!text) return;

            const data = JSON.parse(text);
            if (data.success) setSubjects(data.data || []);
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const fetchQuestionGroups = async (subjectId) => {
        try {
            const res = await fetch(`/api/question-groups?subject=${subjectId}&status=active`);
            if (!res.ok) return;

            const text = await res.text();
            if (!text) return;

            const data = JSON.parse(text);
            const groups = Array.isArray(data) ? data : (data.data || []);
            const filteredGroups = groups.filter(g => g.subject?._id === subjectId || g.subject === subjectId);
            setQuestionGroups(filteredGroups);
        } catch (error) {
            console.error('Error fetching question groups:', error);
        }
    };

    const handleEdit = (question) => {
        setSelectedQuestion(question);
        setShowEditModal(true);
    };

    const handleView = (question) => {
        setSelectedQuestion(question);
        setShowViewModal(true);
    };

    const handleUpdate = (updatedQuestion) => {
        setQuestions(questions.map(q => q._id === updatedQuestion._id ? updatedQuestion : q));
        fetchQuestions(); // Refresh to get updated data
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/questions/${id}`, { method: 'DELETE' });

                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }

                const text = await res.text();
                if (!text) {
                    throw new Error('Empty response from server');
                }

                const data = JSON.parse(text);

                if (data.success) {
                    fetchQuestions();
                    setSelectedQuestions(selectedQuestions.filter(qId => qId !== id));
                    toast.success('Question deleted successfully!');
                } else {
                    throw new Error(data.message || 'Failed to delete question');
                }
            } catch (error) {
                console.error('Delete error:', error);
                toast.error(error.message || 'Failed to delete question');
            }
        }
    };

    // Pagination handlers
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handlePerPageChange = (newPerPage) => {
        setQuestionsPerPage(newPerPage);
        setCurrentPage(1); // Reset to first page
    };

    const handleOnRefresh = () => {
        fetchQuestions();
        setSelectedQuestions([]);
        setSelectAll(false);
        toast.success('Questions refreshed!');
    };

    const filteredQuestions = questions; // Remove local filtering since we're using API pagination

    const stripHtml = (html) => {
        if (!html) return "";
        return html.replace(/<[^>]*>?/gm, "");
    };

    return (
        <div className="card">
            <div className="card-header">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div className="d-flex align-items-center gap-3">
                        <h5 className="mb-0">Questions Bank</h5>
                        {totalQuestions > 0 && (
                            <span className="badge bg-primary fs-6">{totalQuestions} Total</span>
                        )}
                        {selectedQuestions.length > 0 && (
                            <span className="badge bg-success fs-6">{selectedQuestions.length} Selected</span>
                        )}
                    </div>
                    <div className="d-flex gap-2">
                        {selectedQuestions.length > 0 && (
                            <>
                                <button className="btn btn-outline-danger btn-sm" onClick={handleBulkDelete}>
                                    <FiTrash2 className="me-1" />
                                    Delete ({selectedQuestions.length})
                                </button>
                                <button className="btn btn-outline-success btn-sm" onClick={() => setShowExportModal(true)}>
                                    <FiDownload className="me-1" />
                                    Export Selected
                                </button>
                            </>
                        )}
                        {userRole === 'admin' && (
                            <button className="btn btn-outline-danger btn-sm" onClick={() => setShowRecycleBin(true)}>
                                <FiTrash2 className="me-1" />
                                Recycle Bin
                            </button>
                        )}
                        <button className="btn btn-outline-info btn-sm text-dark" onClick={() => setShowJsonImportModal(true)}>
                            <FiDatabase className="me-1" />
                            Import JSON
                        </button>
                        <button className="btn btn-outline-primary btn-sm" onClick={() => setShowImportModal(true)}>
                            <FiUpload className="me-1" />
                            Import CSV
                        </button>
                        <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowExportModal(true)}>
                            <FiDownload className="me-1" />
                            Export
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
                            <FiPlus className="me-1" />
                            Add Question
                        </button>
                    </div>
                </div>

                <div className="row g-3 mt-3">
                    <div className="col-md-3">
                        <select
                            className="form-select"
                            value={filters.category}
                            onChange={(e) => setFilters({ ...filters, category: e.target.value, subject: 'all', questionGroup: 'all' })}
                        >
                            <option value="all">All Categories</option>
                            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="col-md-3">
                        <select
                            className="form-select"
                            value={filters.subject}
                            onChange={(e) => setFilters({ ...filters, subject: e.target.value, questionGroup: 'all' })}
                            disabled={filters.category === 'all'}
                        >
                            <option value="all">All Subjects</option>
                            {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="col-md-3">
                        <select
                            className="form-select"
                            value={filters.questionGroup}
                            onChange={(e) => setFilters({ ...filters, questionGroup: e.target.value })}
                            disabled={filters.subject === 'all'}
                        >
                            <option value="all">All Groups</option>
                            {questionGroups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                        </select>
                    </div>
                    <div className="col-md-3">
                        <select
                            className="form-select"
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                        >
                            <option value="all">All Types</option>
                            <option value="mcq">MCQ</option>
                            <option value="multiple_choice">Multiple Choice</option>
                            <option value="true_false">True / False</option>
                            <option value="short_answer">Short Answer</option>
                            <option value="long_answer">Long Answer</option>
                        </select>
                    </div>
                    <div className="col-12">
                        <div className="input-group">
                            <span className="input-group-text"><FiSearch /></span>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by question text..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="card-body p-0">
                {/* Pagination Controls Top */}
                <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                    <div className="d-flex align-items-center gap-2">
                        <span className="text-muted">Show</span>
                        <select
                            className="form-select form-select-sm"
                            style={{ width: 'auto' }}
                            value={questionsPerPage}
                            onChange={(e) => handlePerPageChange(Number(e.target.value))}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span className="text-muted">entries</span>
                    </div>

                    <div className="text-muted">
                        Showing {questions.length > 0 ? ((currentPage - 1) * questionsPerPage) + 1 : 0} to {Math.min(currentPage * questionsPerPage, totalQuestions)} of {totalQuestions} entries
                    </div>

                    <button className="btn btn-outline-secondary btn-sm" onClick={handleOnRefresh}>
                        <i className="fas fa-sync-alt me-1"></i>
                        Refresh
                    </button>
                </div>

                <div className="table-responsive">
                    <table className="table table-hover mb-0">
                        <thead className="table-light">
                            <tr>
                                <th style={{ width: '50px' }}>
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={selectAll}
                                            onChange={handleSelectAll}
                                        />
                                    </div>
                                </th>
                                <th>#</th>
                                <th style={{ width: '40%' }}>Question</th>
                                <th>Type</th>
                                <th>Group</th>
                                <th>Marks</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                // Skeleton loading
                                Array.from({ length: questionsPerPage }).map((_, index) => (
                                    <tr key={index}>
                                        <td>
                                            <div className="form-check">
                                                <div className="skeleton" style={{ width: '16px', height: '16px' }}></div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="skeleton skeleton-text" style={{ width: '20px', height: '16px' }}></div>
                                        </td>
                                        <td>
                                            <div className="skeleton skeleton-text" style={{ width: '100%', height: '16px', marginBottom: '4px' }}></div>
                                            <div className="skeleton skeleton-text" style={{ width: '70%', height: '16px' }}></div>
                                        </td>
                                        <td>
                                            <div className="skeleton skeleton-badge" style={{ width: '60px', height: '20px' }}></div>
                                        </td>
                                        <td>
                                            <div className="skeleton skeleton-text" style={{ width: '80px', height: '16px' }}></div>
                                        </td>
                                        <td>
                                            <div className="skeleton skeleton-text" style={{ width: '30px', height: '16px' }}></div>
                                        </td>
                                        <td>
                                            <div className="skeleton skeleton-badge" style={{ width: '50px', height: '20px' }}></div>
                                        </td>
                                        <td>
                                            <div className="d-flex gap-1">
                                                <div className="skeleton skeleton-btn" style={{ width: '30px', height: '30px' }}></div>
                                                <div className="skeleton skeleton-btn" style={{ width: '30px', height: '30px' }}></div>
                                                <div className="skeleton skeleton-btn" style={{ width: '30px', height: '30px' }}></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredQuestions.length === 0 ? (
                                <tr><td colSpan="8" className="text-center py-4">No questions found</td></tr>
                            ) : (
                                filteredQuestions.map((q, index) => (
                                    <tr key={q._id} className={selectedQuestions.includes(q._id) ? 'table-active' : ''}>
                                        <td>
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={selectedQuestions.includes(q._id)}
                                                    onChange={(e) => handleSelectQuestion(q._id, e.target.checked)}
                                                />
                                            </div>
                                        </td>
                                        <td>{((currentPage - 1) * questionsPerPage) + index + 1}</td>
                                        <td>
                                            <div className="text-truncate" style={{ maxWidth: '300px' }} title={stripHtml(q.questionText)}>
                                                {stripHtml(q.questionText)}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge bg-info text-uppercase">{q.type.replace('_', ' ')}</span>
                                        </td>
                                        <td>{q.questionGroup?.name || 'N/A'}</td>
                                        <td>{q.marks}</td>
                                        <td>
                                            <span className={`badge bg-${q.status === 'active' ? 'success' : 'secondary'}`}>
                                                {q.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="btn-group btn-group-sm">
                                                <button className="btn btn-light" onClick={() => handleView(q)} title="View"><FiEye /></button>
                                                <button className="btn btn-light" onClick={() => handleEdit(q)} title="Edit"><FiEdit2 /></button>
                                                <button className="btn btn-light text-danger" onClick={() => handleDelete(q._id)} title="Delete"><FiTrash2 /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls Bottom */}
                {totalPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center p-3 border-top">
                        <div className="text-muted">
                            Showing {questions.length > 0 ? ((currentPage - 1) * questionsPerPage) + 1 : 0} to {Math.min(currentPage * questionsPerPage, totalQuestions)} of {totalQuestions} entries
                        </div>

                        <nav aria-label="Questions pagination">
                            <ul className="pagination pagination-sm mb-0">
                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => handlePageChange(1)}
                                        disabled={currentPage === 1}
                                    >
                                        First
                                    </button>
                                </li>
                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </button>
                                </li>

                                {/* Page numbers */}
                                {(() => {
                                    const pages = [];
                                    const startPage = Math.max(1, currentPage - 2);
                                    const endPage = Math.min(totalPages, currentPage + 2);

                                    for (let i = startPage; i <= endPage; i++) {
                                        pages.push(
                                            <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
                                                <button
                                                    className="page-link"
                                                    onClick={() => handlePageChange(i)}
                                                >
                                                    {i}
                                                </button>
                                            </li>
                                        );
                                    }
                                    return pages;
                                })()}

                                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </button>
                                </li>
                                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => handlePageChange(totalPages)}
                                        disabled={currentPage === totalPages}
                                    >
                                        Last
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                )}
            </div>

            <AddQuestionModal
                show={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={(newQ) => {
                    fetchQuestions(); // Refresh list instead of manual update
                }}
            />

            <EditQuestionModal
                show={showEditModal}
                onClose={() => setShowEditModal(false)}
                onUpdate={handleUpdate}
                question={selectedQuestion}
            />

            <ViewQuestionModal
                show={showViewModal}
                onClose={() => setShowViewModal(false)}
                question={selectedQuestion}
            />

            {/* CSV Import Modal */}
            <CSVImportModal
                show={showImportModal}
                onHide={() => setShowImportModal(false)}
                onImportSuccess={() => {
                    fetchQuestions();
                    setShowImportModal(false);
                }}
            />

            {/* JSON Import Modal */}
            <JSONImportModal
                show={showJsonImportModal}
                onClose={() => setShowJsonImportModal(false)}
                onImportSuccess={() => {
                    fetchQuestions();
                    setShowJsonImportModal(false);
                    toast.success('JSON Questions imported successfully!');
                }}
            />

            {/* Recycle Bin Modal */}
            <RecycleBinModal
                show={showRecycleBin}
                onClose={() => setShowRecycleBin(false)}
                onRestore={() => {
                    fetchQuestions(); // Refresh main list if something restored
                    // Maybe keep modal open? Restoring removes from bin list inside component.
                }}
            />

            {/* CSV Export Modal */}
            <CSVExportModal
                show={showExportModal}
                onHide={() => setShowExportModal(false)}
                selectedQuestions={selectedQuestions}
            />

            {/* Hidden file input - kept for compatibility */}
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".csv"
            />
        </div>
    );
};

export default QuestionList;
