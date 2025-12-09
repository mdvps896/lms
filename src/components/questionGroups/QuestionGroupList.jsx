'use client';
import React, { useState, useEffect } from 'react';
import { FiPlus, FiDownload, FiUpload, FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import Swal from 'sweetalert2';
import SkeletonLoader from './SkeletonLoader';
import AddQuestionGroupModal from './AddQuestionGroupModal';
import EditQuestionGroupModal from './EditQuestionGroupModal';
import ViewQuestionGroupModal from './ViewQuestionGroupModal';

const QuestionGroupList = () => {
    const [questionGroups, setQuestionGroups] = useState([]);
    const [filteredGroups, setFilteredGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [categories, setCategories] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchQuestionGroups();
        fetchCategories();
    }, []);

    useEffect(() => {
        filterGroups();
    }, [questionGroups, searchTerm, statusFilter, categoryFilter]);

    const fetchQuestionGroups = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/question-groups');
            const data = await res.json();
            if (data.success) {
                setQuestionGroups(data.data || []);
            } else {
                setQuestionGroups([]);
            }
        } catch (error) {
            console.error('Error fetching question groups:', error);
            setQuestionGroups([]);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch question groups'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            if (data.success) {
                setCategories(data.data.filter(c => c.status === 'active'));
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const filterGroups = () => {
        let filtered = questionGroups;

        if (searchTerm) {
            filtered = filtered.filter(group =>
                group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                group.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(group => group.status === statusFilter);
        }

        if (categoryFilter !== 'all') {
            filtered = filtered.filter(group => group.category?._id === categoryFilter);
        }

        setFilteredGroups(filtered);
        setCurrentPage(1);
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
                const res = await fetch(`/api/question-groups/${id}`, {
                    method: 'DELETE'
                });

                if (res.ok) {
                    setQuestionGroups(questionGroups.filter(g => g._id !== id));
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'Question group has been deleted.',
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to delete question group'
                });
            }
        }
    };

    const handleExportCSV = () => {
        const csvContent = [
            ['Name', 'Category', 'Subject', 'Description', 'Status', 'Created At'],
            ...filteredGroups.map(g => [
                g.name,
                g.category?.name || '',
                g.subject?.name || '',
                g.description || '',
                g.status,
                new Date(g.createdAt).toLocaleDateString()
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `question-groups-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const handleImportCSV = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target.result;
                const rows = text.split('\n').slice(1);

                for (const row of rows) {
                    if (!row.trim()) continue;
                    const [name, categoryName, subjectName, description, status] = row.split(',');
                    
                    const category = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
                    if (!category) continue;

                    const subjectsRes = await fetch('/api/subjects');
                    const subjectsData = await subjectsRes.json();
                    const subjects = subjectsData.success ? subjectsData.data : [];
                    const subject = subjects.find(s => s.name.toLowerCase() === subjectName.toLowerCase());
                    if (!subject) continue;

                    await fetch('/api/question-groups', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: name.trim(),
                            category: category._id,
                            subject: subject._id,
                            description: description?.trim() || '',
                            status: status?.trim() || 'active'
                        })
                    });
                }

                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'CSV imported successfully!',
                    timer: 2000,
                    showConfirmButton: false
                });
                fetchQuestionGroups();
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to import CSV'
                });
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const paginatedGroups = filteredGroups.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(filteredGroups.length / itemsPerPage);

    return (
        <div className="card">
            <div className="card-header">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div className="flex-grow-1">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search question groups..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                        <select
                            className="form-select"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            style={{ width: '200px' }}
                        >
                            <option value="all">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                            ))}
                        </select>
                        <select
                            className="form-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ width: '150px' }}
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <button className="btn btn-success" onClick={handleExportCSV}>
                            <FiDownload /> Export CSV
                        </button>
                        <label className="btn btn-warning mb-0">
                            <FiUpload /> Import CSV
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleImportCSV}
                                style={{ display: 'none' }}
                            />
                        </label>
                        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                            <FiPlus /> Add Question Group
                        </button>
                    </div>
                </div>
            </div>

            <div className="card-body p-0">
                <div className="table-responsive">
                    <table className="table table-hover mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Subject</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <SkeletonLoader />
                            ) : paginatedGroups.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-4">No question groups found</td>
                                </tr>
                            ) : (
                                paginatedGroups.map((group, index) => (
                                    <tr key={group._id}>
                                        <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                        <td className="fw-bold">{group.name}</td>
                                        <td>
                                            <span className="badge bg-primary">{group.category?.name || 'N/A'}</span>
                                        </td>
                                        <td>
                                            <span className="badge bg-info">{group.subject?.name || 'N/A'}</span>
                                        </td>
                                        <td>{group.description?.substring(0, 50) || 'N/A'}</td>
                                        <td>
                                            <span className={`badge bg-${group.status === 'active' ? 'success' : 'danger'}`}>
                                                {group.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <button
                                                    className="btn btn-sm btn-info"
                                                    onClick={() => {
                                                        setSelectedGroup(group);
                                                        setShowViewModal(true);
                                                    }}
                                                >
                                                    <FiEye />
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-warning"
                                                    onClick={() => {
                                                        setSelectedGroup(group);
                                                        setShowEditModal(true);
                                                    }}
                                                >
                                                    <FiEdit2 />
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => handleDelete(group._id)}
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {totalPages > 1 && (
                <div className="card-footer">
                    <div className="d-flex justify-content-between align-items-center">
                        <p className="mb-0">
                            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                            {Math.min(currentPage * itemsPerPage, filteredGroups.length)} of{' '}
                            {filteredGroups.length} entries
                        </p>
                        <nav>
                            <ul className="pagination mb-0">
                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>
                                        Previous
                                    </button>
                                </li>
                                {[...Array(totalPages)].map((_, i) => (
                                    <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                                        <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                                            {i + 1}
                                        </button>
                                    </li>
                                ))}
                                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>
                                        Next
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            )}

            <AddQuestionGroupModal
                show={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={(newGroup) => setQuestionGroups([newGroup, ...questionGroups])}
            />

            <EditQuestionGroupModal
                show={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedGroup(null);
                }}
                onUpdate={(updatedGroup) => {
                    setQuestionGroups(questionGroups.map(g =>
                        g._id === updatedGroup._id ? updatedGroup : g
                    ));
                    setSelectedGroup(null);
                }}
                group={selectedGroup}
            />

            <ViewQuestionGroupModal
                show={showViewModal}
                onClose={() => {
                    setShowViewModal(false);
                    setSelectedGroup(null);
                }}
                group={selectedGroup}
            />
        </div>
    );
};

export default QuestionGroupList;
