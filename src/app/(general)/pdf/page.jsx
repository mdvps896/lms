'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import PDFCard from '@/components/pdf/PDFCard';
import PDFModal from '@/components/pdf/PDFModal';
import Swal from 'sweetalert2';

export default function PDFManagementPage() {
    const [pdfs, setPdfs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [courses, setCourses] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPDF, setEditingPDF] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [filterCategory, setFilterCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        accessType: 'global',
        assignedCourses: [],
        assignedUsers: [],
        file: null,
        isPremium: false,
        price: 0,
        description: '',
        courses: [],
        users: []
    });

    useEffect(() => {
        fetchPDFs();
        fetchCategories();
        fetchCourses();
        fetchUsers();
    }, []);

    const fetchPDFs = async () => {
        try {
            const response = await fetch('/api/pdfs');
            const data = await response.json();
            if (data.success) {
                setPdfs(data.data);
            }
        } catch (error) {
            toast.error('Failed to fetch PDFs');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/categories');
            const data = await response.json();
            if (data.success) {
                setCategories(data.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchCourses = async () => {
        try {
            const response = await fetch('/api/courses');
            const data = await response.json();
            if (data.success) {
                setCourses(data.data);
                setFormData(prev => ({ ...prev, courses: data.data }));
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users');
            const data = await response.json();
            if (data.success) {
                setUsers(data.data);
                setFormData(prev => ({ ...prev, users: data.data }));
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchSubjectsByCategory = async (categoryId) => {
        if (!categoryId) {
            setSubjects([]);
            return;
        }
        try {
            const response = await fetch(`/api/subjects?category=${categoryId}`);
            const data = await response.json();
            if (data.success) {
                setSubjects(data.data);
            }
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const handleCategoryChange = (categoryId) => {
        setFormData({ ...formData, category: categoryId, subjects: [] });
        fetchSubjectsByCategory(categoryId);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            setFormData({ ...formData, file });
        } else {
            toast.error('Please select a valid PDF file');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name) {
            toast.error('Please enter PDF name');
            return;
        }

        if (formData.accessType === 'course' && (!formData.assignedCourses || formData.assignedCourses.length === 0)) {
            toast.error('Please select at least one course');
            return;
        }

        if (formData.accessType === 'user' && (!formData.assignedUsers || formData.assignedUsers.length === 0)) {
            toast.error('Please select at least one user');
            return;
        }

        if (formData.isPremium && (!formData.price || formData.price <= 0)) {
            toast.error('Please enter a valid price for premium PDF');
            return;
        }

        if (!editingPDF && !formData.file) {
            toast.error('Please select a PDF file');
            return;
        }

        setUploading(true);

        try {
            let fileUrl = editingPDF?.fileUrl || '';
            let fileName = editingPDF?.fileName || '';
            let fileSize = editingPDF?.fileSize || 0;

            if (formData.file) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', formData.file);

                const uploadResponse = await fetch('/api/upload', {
                    method: 'POST',
                    body: uploadFormData
                });

                const uploadData = await uploadResponse.json();

                // Check for success or if URL is present (fallback for legacy API response)
                if (!uploadData.success && !uploadData.url) {
                    throw new Error(uploadData.message || 'File upload failed');
                }

                fileUrl = uploadData.url;
                fileName = formData.file.name;
                fileSize = formData.file.size;
            }

            const pdfData = {
                name: formData.name,
                accessType: formData.accessType,
                assignedCourses: formData.assignedCourses || [],
                assignedUsers: formData.assignedUsers || [],
                fileUrl,
                fileName,
                fileSize,
                isPremium: formData.isPremium,
                price: formData.isPremium ? formData.price : 0,
                description: formData.description
            };

            const url = editingPDF ? `/api/pdfs/${editingPDF._id}` : '/api/pdfs';
            const method = editingPDF ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pdfData)
            });

            const data = await response.json();

            if (data.success) {
                toast.success(editingPDF ? 'PDF updated successfully' : 'PDF uploaded successfully');
                setShowModal(false);
                resetForm();
                fetchPDFs();
            } else {
                toast.error(data.message || 'Operation failed');
            }
        } catch (error) {
            toast.error('An error occurred');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handleEdit = (pdf) => {
        setEditingPDF(pdf);
        setFormData({
            name: pdf.name,
            category: pdf.category._id,
            subjects: pdf.subjects.map(s => s._id),
            file: null,
            isPremium: pdf.isPremium,
            description: pdf.description || ''
        });
        fetchSubjectsByCategory(pdf.category._id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Delete PDF?',
            text: 'This action cannot be undone!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (!result.isConfirmed) return;

        try {
            const response = await fetch(`/api/pdfs?id=${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                toast.success('PDF deleted successfully');
                fetchPDFs();
            } else {
                toast.error(data.message || 'Delete failed');
            }
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            accessType: 'global',
            assignedCourses: [],
            assignedUsers: [],
            file: null,
            isPremium: false,
            price: 0,
            description: '',
            courses: [...courses], // Create new array
            users: [...users] // Create new array
        });
        setEditingPDF(null);
    };

    const handleSubjectToggle = (subjectId) => {
        const newSubjects = formData.subjects.includes(subjectId)
            ? formData.subjects.filter(id => id !== subjectId)
            : [...formData.subjects, subjectId];
        setFormData({ ...formData, subjects: newSubjects });
    };

    // Filter PDFs
    const filteredPDFs = pdfs.filter(pdf => {
        const matchesCategory = !filterCategory || pdf.category?._id === filterCategory;
        const matchesSearch = !searchQuery ||
            pdf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            pdf.fileName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="container-fluid">
                {/* Page Header */}
                <div className="page-header">
                    <div className="page-header-left d-flex align-items-center">
                        <div className="page-header-title">
                            <h5 className="m-b-10">PDF Management</h5>
                        </div>
                        <ul className="breadcrumb">
                            <li className="breadcrumb-item"><a href="/">Home</a></li>
                            <li className="breadcrumb-item">PDF Management</li>
                        </ul>
                    </div>
                    <div className="page-header-right ms-auto">
                        <button
                            onClick={() => {
                                resetForm();
                                setShowModal(true);
                            }}
                            className="btn btn-primary"
                        >
                            <i className="feather-plus me-2"></i>
                            Add PDF
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="row mb-4">
                    <div className="col-md-4">
                        <div className="input-group">
                            <span className="input-group-text">
                                <i className="feather-search"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search PDFs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="col-md-4">
                        <select
                            className="form-select"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat._id} value={cat._id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-4 text-end">
                        <span className="text-muted">
                            Showing {filteredPDFs.length} of {pdfs.length} PDFs
                        </span>
                    </div>
                </div>

                {/* PDF Grid */}
                {filteredPDFs.length === 0 ? (
                    <div className="card">
                        <div className="card-body text-center py-5">
                            <i className="feather-file-text" style={{ fontSize: '64px', color: '#ddd' }}></i>
                            <h5 className="mt-3 text-muted">No PDFs found</h5>
                            <p className="text-muted">
                                {searchQuery || filterCategory
                                    ? 'Try adjusting your filters'
                                    : 'Click "Add PDF" to upload your first PDF'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="row">
                        {filteredPDFs.map((pdf) => (
                            <PDFCard
                                key={pdf._id}
                                pdf={pdf}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}

                {/* Modal */}
                <PDFModal
                    show={showModal}
                    onClose={() => {
                        setShowModal(false);
                        resetForm();
                    }}
                    formData={formData}
                    setFormData={setFormData}
                    categories={categories}
                    subjects={subjects}
                    onSubmit={handleSubmit}
                    uploading={uploading}
                    editingPDF={editingPDF}
                    onCategoryChange={handleCategoryChange}
                    onSubjectToggle={handleSubjectToggle}
                    onFileChange={handleFileChange}
                />
            </div>
        </div>
    );
}
