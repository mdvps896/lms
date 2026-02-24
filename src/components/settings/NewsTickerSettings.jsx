'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiExternalLink, FiBook, FiFileText, FiX, FiSave, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { toast } from 'react-toastify';

const EMPTY_FORM = {
    content: '',
    link: '',
    linkType: 'external',
    referenceId: '',
    order: 0,
    active: true,
};

const NewsTickerSettings = () => {
    const [tickers, setTickers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [courses, setCourses] = useState([]);
    const [blogs, setBlogs] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);

    const fetchTickers = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/news-ticker');
            const data = await res.json();
            if (data.success) setTickers(data.data || []);
        } catch {
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
            if (coursesData.success) setCourses((coursesData.data || []).filter(c => c.status === 'active'));
            if (blogsData.success) setBlogs((blogsData.data || []).filter(b => b.status === 'published'));
        } catch (err) {
            console.error('Error fetching courses/blogs:', err);
        }
    }, []);

    useEffect(() => {
        fetchTickers();
        fetchCoursesAndBlogs();
    }, [fetchTickers, fetchCoursesAndBlogs]);

    const openAddModal = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setShowModal(true);
    };

    const openEditModal = (ticker) => {
        setForm({
            content: ticker.content || '',
            link: ticker.link || '',
            linkType: ticker.linkType || 'external',
            referenceId: ticker.referenceId || '',
            order: ticker.order ?? 0,
            active: ticker.active !== false,
        });
        setEditingId(ticker._id);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.content.trim()) { toast.error('Content is required'); return; }
        setSaving(true);
        try {
            const url = editingId ? `/api/admin/news-ticker/${editingId}` : '/api/admin/news-ticker';
            const method = editingId ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(editingId ? 'Ticker updated!' : 'Ticker created!');
                closeModal();
                fetchTickers();
            } else {
                toast.error(data.message || 'Failed to save');
            }
        } catch {
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
            if (data.success) { toast.success('Deleted'); fetchTickers(); }
            else toast.error(data.message);
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
            if (data.success) fetchTickers();
        } catch {
            toast.error('Error toggling status');
        }
    };

    const getLinkTypeIcon = (type) => {
        if (type === 'course') return <FiBook className="text-primary" />;
        if (type === 'blog') return <FiFileText className="text-success" />;
        return <FiExternalLink className="text-secondary" />;
    };

    const getLinkTypeBadge = (type) => {
        const colors = { course: 'primary', blog: 'success', external: 'secondary' };
        return (
            <span className={`badge bg-${colors[type] || 'secondary'} text-capitalize`}>{type}</span>
        );
    };

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

    if (loading) return (
        <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );

    return (
        <div>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h6 className="fw-bold mb-1">News Ticker Management</h6>
                    <small className="text-muted">Manage scrolling news ticker items shown on the mobile app home screen</small>
                </div>
                <button className="btn btn-primary btn-sm d-flex align-items-center gap-1" onClick={openAddModal}>
                    <FiPlus /> Add Ticker
                </button>
            </div>

            {/* Ticker List */}
            {tickers.length === 0 ? (
                <div className="text-center py-5 text-muted">
                    <FiFileText size={48} className="mb-3 opacity-50" />
                    <p>No ticker items yet. Click &quot;Add Ticker&quot; to create one.</p>
                </div>
            ) : (
                <div className="card border-0 shadow-sm">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: 50 }}>#</th>
                                    <th>Content</th>
                                    <th style={{ width: 90 }}>Type</th>
                                    <th>Link / Reference</th>
                                    <th style={{ width: 80 }}>Status</th>
                                    <th style={{ width: 100 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickers.map((ticker) => (
                                    <tr key={ticker._id} className={!ticker.active ? 'opacity-50' : ''}>
                                        <td>
                                            <span className="badge bg-light text-dark fw-bold border">{ticker.order}</span>
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                {getLinkTypeIcon(ticker.linkType)}
                                                <span className="fw-semibold" style={{ maxWidth: 350 }}>
                                                    {ticker.content}
                                                </span>
                                            </div>
                                        </td>
                                        <td>{getLinkTypeBadge(ticker.linkType)}</td>
                                        <td>
                                            <small className="text-muted">
                                                {ticker.link || (ticker.referenceId ? `📎 ${getReferenceName(ticker)}` : '—')}
                                            </small>
                                        </td>
                                        <td>
                                            <button
                                                className={`btn btn-sm ${ticker.active ? 'btn-success' : 'btn-secondary'} d-flex align-items-center gap-1`}
                                                onClick={() => handleToggleActive(ticker)}
                                                title={ticker.active ? 'Click to Deactivate' : 'Click to Activate'}
                                            >
                                                {ticker.active ? <FiToggleRight size={14} /> : <FiToggleLeft size={14} />}
                                                {ticker.active ? 'Active' : 'Off'}
                                            </button>
                                        </td>
                                        <td>
                                            <div className="d-flex gap-1">
                                                <button
                                                    className="btn btn-outline-primary btn-sm"
                                                    onClick={() => openEditModal(ticker)}
                                                    title="Edit"
                                                >
                                                    <FiEdit2 size={13} />
                                                </button>
                                                <button
                                                    className="btn btn-outline-danger btn-sm"
                                                    onClick={() => handleDelete(ticker._id)}
                                                    title="Delete"
                                                >
                                                    <FiTrash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Add / Edit MODAL ─────────────────────────────────── */}
            {showModal && (
                <div
                    className="modal show d-block"
                    style={{ backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1055 }}
                    onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
                >
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content border-0 shadow-lg">

                            {/* Modal Header */}
                            <div className="modal-header border-0 pb-0" style={{ background: 'linear-gradient(135deg,#3454d1 0%,#4f71f5 100%)' }}>
                                <div className="d-flex align-items-center gap-2 text-white">
                                    {editingId ? <FiEdit2 size={18} /> : <FiPlus size={18} />}
                                    <h5 className="modal-title fw-bold mb-0 text-white">
                                        {editingId ? 'Edit Ticker Item' : 'Add New Ticker Item'}
                                    </h5>
                                </div>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={closeModal}
                                />
                            </div>

                            {/* Modal Body */}
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body p-4">

                                    {/* Content */}
                                    <div className="mb-4">
                                        <label className="form-label fw-semibold">
                                            Ticker Content <span className="text-danger">*</span>
                                        </label>
                                        <textarea
                                            className="form-control"
                                            rows={3}
                                            value={form.content}
                                            onChange={(e) => setForm({ ...form, content: e.target.value })}
                                            placeholder="📢 Enter news ticker text..."
                                            maxLength={300}
                                            autoFocus
                                        />
                                        <div className="d-flex justify-content-between mt-1">
                                            <small className="text-muted">This text scrolls on the mobile app home screen</small>
                                            <small className={form.content.length > 270 ? 'text-danger' : 'text-muted'}>
                                                {form.content.length}/300
                                            </small>
                                        </div>
                                    </div>

                                    <div className="row g-3 mb-4">
                                        {/* Link Type */}
                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold">Link Type</label>
                                            <select
                                                className="form-select"
                                                value={form.linkType}
                                                onChange={(e) => setForm({ ...form, linkType: e.target.value, referenceId: '', link: '' })}
                                            >
                                                <option value="external">🌐 External URL</option>
                                                <option value="course">📚 Course</option>
                                                <option value="blog">📝 Blog</option>
                                            </select>
                                        </div>

                                        {/* Link target */}
                                        <div className="col-md-8">
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
                                                    {courses.map((c) => (
                                                        <option key={c._id} value={c._id}>{c.title}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <select
                                                    className="form-select"
                                                    value={form.referenceId}
                                                    onChange={(e) => setForm({ ...form, referenceId: e.target.value })}
                                                >
                                                    <option value="">-- Select a Blog --</option>
                                                    {blogs.map((b) => (
                                                        <option key={b._id} value={b._id}>{b.title}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>

                                    <div className="row g-3">
                                        {/* Order */}
                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold">Display Order</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={form.order}
                                                min={0}
                                                onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                                            />
                                            <small className="text-muted">Lower number = shown first</small>
                                        </div>

                                        {/* Status */}
                                        <div className="col-md-4 d-flex align-items-center">
                                            <div>
                                                <label className="form-label fw-semibold d-block">Status</label>
                                                <div className="form-check form-switch mt-1">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="activeToggle"
                                                        checked={form.active}
                                                        onChange={(e) => setForm({ ...form, active: e.target.checked })}
                                                        style={{ width: 48, height: 24 }}
                                                    />
                                                    <label className="form-check-label fw-semibold ms-2" htmlFor="activeToggle">
                                                        <span className={form.active ? 'text-success' : 'text-secondary'}>
                                                            {form.active ? '✓ Active' : '✗ Inactive'}
                                                        </span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="modal-footer border-0 bg-light">
                                    <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>
                                        <FiX className="me-1" /> Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        {saving ? (
                                            <><span className="spinner-border spinner-border-sm me-1" /> Saving...</>
                                        ) : (
                                            <><FiSave className="me-1" /> {editingId ? 'Update Ticker' : 'Create Ticker'}</>
                                        )}
                                    </button>
                                </div>
                            </form>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewsTickerSettings;
