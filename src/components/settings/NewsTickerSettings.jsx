'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiArrowUp, FiArrowDown, FiExternalLink, FiBook, FiFileText } from 'react-icons/fi';
import { toast } from 'react-toastify';

const NewsTickerSettings = () => {
    const [tickers, setTickers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [courses, setCourses] = useState([]);
    const [blogs, setBlogs] = useState([]);
    const [form, setForm] = useState({
        content: '',
        link: '',
        linkType: 'external',
        referenceId: '',
        order: 0,
        active: true,
    });

    const fetchTickers = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/news-ticker');
            const data = await res.json();
            if (data.success) {
                setTickers(data.data || []);
            }
        } catch (error) {
            toast.error('Failed to fetch ticker items');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchCoursesAndBlogs = useCallback(async () => {
        try {
            const [coursesRes, blogsRes] = await Promise.all([
                fetch('/api/admin/courses'),
                fetch('/api/admin/blogs'),
            ]);
            const coursesData = await coursesRes.json();
            const blogsData = await blogsRes.json();

            if (coursesData.success) {
                // Only active courses
                const activeCourses = (coursesData.data || []).filter(c => c.status === 'active');
                setCourses(activeCourses);
            }
            if (blogsData.success) {
                // Only published blogs
                const publishedBlogs = (blogsData.data || []).filter(b => b.status === 'published');
                setBlogs(publishedBlogs);
            }
        } catch (error) {
            console.error('Error fetching courses/blogs:', error);
        }
    }, []);

    useEffect(() => {
        fetchTickers();
        fetchCoursesAndBlogs();
    }, [fetchTickers, fetchCoursesAndBlogs]);

    const resetForm = () => {
        setForm({
            content: '',
            link: '',
            linkType: 'external',
            referenceId: '',
            order: 0,
            active: true,
        });
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (ticker) => {
        setForm({
            content: ticker.content || '',
            link: ticker.link || '',
            linkType: ticker.linkType || 'external',
            referenceId: ticker.referenceId || '',
            order: ticker.order ?? 0,
            active: ticker.active !== false,
        });
        setEditingId(ticker._id);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.content.trim()) {
            toast.error('Content is required');
            return;
        }

        setSaving(true);
        try {
            const url = editingId
                ? `/api/admin/news-ticker/${editingId}`
                : '/api/admin/news-ticker';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();

            if (data.success) {
                toast.success(editingId ? 'Ticker updated!' : 'Ticker created!');
                resetForm();
                fetchTickers();
            } else {
                toast.error(data.message || 'Failed to save');
            }
        } catch (error) {
            toast.error('Error saving ticker');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this ticker item?')) return;
        try {
            const res = await fetch(`/api/admin/news-ticker/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                toast.success('Deleted');
                fetchTickers();
            } else {
                toast.error(data.message);
            }
        } catch {
            toast.error('Error deleting');
        }
    };

    const handleToggleActive = async (ticker) => {
        try {
            const res = await fetch(`/api/admin/news-ticker/${ticker._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: !ticker.active }),
            });
            const data = await res.json();
            if (data.success) {
                fetchTickers();
            }
        } catch {
            toast.error('Error toggling status');
        }
    };

    const getLinkTypeIcon = (type) => {
        switch (type) {
            case 'course': return <FiBook className="text-primary" />;
            case 'blog': return <FiFileText className="text-success" />;
            default: return <FiExternalLink className="text-secondary" />;
        }
    };

    const getLinkTypeBadge = (type) => {
        const colors = { course: 'primary', blog: 'success', external: 'secondary' };
        return (
            <span className={`badge bg-${colors[type] || 'secondary'} bg-opacity-10 text-${colors[type] || 'secondary'}`}>
                {type?.charAt(0).toUpperCase() + type?.slice(1)}
            </span>
        );
    };

    // Helper to get reference name for display in list
    const getReferenceName = (ticker) => {
        if (ticker.linkType === 'course' && ticker.referenceId) {
            const course = courses.find(c => c._id === ticker.referenceId);
            return course ? course.title : ticker.referenceId;
        }
        if (ticker.linkType === 'blog' && ticker.referenceId) {
            const blog = blogs.find(b => b._id === ticker.referenceId);
            return blog ? blog.title : ticker.referenceId;
        }
        return null;
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h6 className="fw-bold mb-1">News Ticker Management</h6>
                    <small className="text-muted">Manage scrolling news ticker items shown on the mobile app home screen</small>
                </div>
                <button
                    className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                    onClick={() => { resetForm(); setShowForm(true); }}
                >
                    <FiPlus /> Add Ticker
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body">
                        <h6 className="fw-bold mb-3">{editingId ? 'Edit Ticker' : 'New Ticker'}</h6>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label fw-semibold">Content <span className="text-danger">*</span></label>
                                <textarea
                                    className="form-control"
                                    rows="2"
                                    value={form.content}
                                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                                    placeholder="📢 Enter news ticker text..."
                                    maxLength={300}
                                />
                                <small className="text-muted">{form.content.length}/300 characters</small>
                            </div>

                            <div className="row mb-3">
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">Link Type</label>
                                    <select
                                        className="form-select"
                                        value={form.linkType}
                                        onChange={(e) => setForm({ ...form, linkType: e.target.value, referenceId: '', link: '' })}
                                    >
                                        <option value="external">External URL</option>
                                        <option value="course">Course</option>
                                        <option value="blog">Blog</option>
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">
                                        {form.linkType === 'external' ? 'URL' : form.linkType === 'course' ? 'Select Course' : 'Select Blog'}
                                    </label>
                                    {form.linkType === 'external' ? (
                                        <input
                                            type="url"
                                            className="form-control"
                                            value={form.link}
                                            onChange={(e) => setForm({ ...form, link: e.target.value })}
                                            placeholder="https://example.com"
                                        />
                                    ) : form.linkType === 'course' ? (
                                        <select
                                            className="form-select"
                                            value={form.referenceId}
                                            onChange={(e) => setForm({ ...form, referenceId: e.target.value })}
                                        >
                                            <option value="">-- Select a Course --</option>
                                            {courses.map((course) => (
                                                <option key={course._id} value={course._id}>
                                                    {course.title}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <select
                                            className="form-select"
                                            value={form.referenceId}
                                            onChange={(e) => setForm({ ...form, referenceId: e.target.value })}
                                        >
                                            <option value="">-- Select a Blog --</option>
                                            {blogs.map((blog) => (
                                                <option key={blog._id} value={blog._id}>
                                                    {blog.title}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label fw-semibold">Order</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={form.order}
                                        onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label fw-semibold">Status</label>
                                    <div className="form-check form-switch mt-2">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={form.active}
                                            onChange={(e) => setForm({ ...form, active: e.target.checked })}
                                        />
                                        <label className="form-check-label">
                                            {form.active ? 'Active' : 'Inactive'}
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="d-flex gap-2">
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : (editingId ? 'Update' : 'Create')}
                                </button>
                                <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Ticker List */}
            {tickers.length === 0 ? (
                <div className="text-center py-5 text-muted">
                    <FiFileText size={48} className="mb-3 opacity-50" />
                    <p>No ticker items yet. Click "Add Ticker" to create one.</p>
                </div>
            ) : (
                <div className="list-group">
                    {tickers.map((ticker, index) => (
                        <div
                            key={ticker._id}
                            className={`list-group-item d-flex align-items-center gap-3 ${!ticker.active ? 'opacity-50' : ''}`}
                        >
                            <div className="d-flex flex-column align-items-center" style={{ minWidth: 30 }}>
                                <span className="badge bg-light text-dark fw-bold">{ticker.order}</span>
                            </div>

                            <div className="flex-grow-1">
                                <div className="d-flex align-items-center gap-2 mb-1">
                                    {getLinkTypeIcon(ticker.linkType)}
                                    <span className="fw-semibold text-truncate" style={{ maxWidth: 400 }}>
                                        {ticker.content}
                                    </span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    {getLinkTypeBadge(ticker.linkType)}
                                    {ticker.link && (
                                        <small className="text-muted text-truncate" style={{ maxWidth: 200 }}>
                                            {ticker.link}
                                        </small>
                                    )}
                                    {ticker.referenceId && (
                                        <small className="text-muted text-truncate" style={{ maxWidth: 250 }}>
                                            📎 {getReferenceName(ticker)}
                                        </small>
                                    )}
                                </div>
                            </div>

                            <div className="d-flex align-items-center gap-2">
                                <div className="form-check form-switch">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={ticker.active}
                                        onChange={() => handleToggleActive(ticker)}
                                    />
                                </div>
                                <button
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() => handleEdit(ticker)}
                                    title="Edit"
                                >
                                    <FiEdit2 size={14} />
                                </button>
                                <button
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => handleDelete(ticker._id)}
                                    title="Delete"
                                >
                                    <FiTrash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NewsTickerSettings;
