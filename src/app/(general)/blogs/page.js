'use client'

import React, { useState, useEffect, useRef } from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import MediaLibraryModal from '@/components/MediaLibraryModal'
import Swal from 'sweetalert2'
import dynamic from 'next/dynamic'
import { FiPlus, FiEdit, FiTrash2, FiImage, FiUpload, FiX } from 'react-icons/fi'

// Import quill styles
import 'react-quill/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

const BlogsPage = () => {
    const [blogs, setBlogs] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false)
    const [selectedBlog, setSelectedBlog] = useState(null)
    const [form, setForm] = useState({ title: '', content: '', image: '', category: 'General', status: 'draft' })
    const [saving, setSaving] = useState(false)
    const fileInputRef = useRef(null)

    const fetchBlogs = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/blogs')
            const data = await res.json()
            if (data.success) {
                setBlogs(data.data)
            }
        } catch (e) {
            console.error('Failed to fetch blogs')
        } finally {
            setLoading(false)
        }
    }

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/academic-categories?format=admin')
            const data = await res.json()
            if (data.success) setCategories(data.data)
        } catch (e) {
            console.error('Failed to load categories')
        }
    }

    useEffect(() => {
        fetchBlogs()
        fetchCategories()
    }, [])

    const openCreate = () => {
        setSelectedBlog(null)
        setForm({ title: '', content: '', image: '', category: categories[0]?.name || 'General', status: 'draft' })
        setIsFormOpen(true)
    }

    const openEdit = (blog) => {
        setSelectedBlog(blog)
        setForm({
            title: blog.title,
            content: blog.content,
            image: blog.image || '',
            category: blog.category || 'General',
            status: blog.status || 'draft'
        })
        setIsFormOpen(true)
    }

    const handleFileUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        Swal.fire({
            title: 'Uploading...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading()
            }
        })

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('folder', 'blogs')

            const res = await fetch('/api/storage/upload', {
                method: 'POST',
                body: formData
            })
            const data = await res.json()
            if (data.success && data.url) {
                setForm(f => ({ ...f, image: data.url }))
                Swal.fire({
                    icon: 'success',
                    title: 'Uploaded!',
                    timer: 1000,
                    showConfirmButton: false
                })
            } else {
                Swal.fire('Error', data.message || 'Upload failed', 'error')
            }
        } catch (error) {
            console.error('Upload error:', error)
            Swal.fire('Error', 'Upload error', 'error')
        }
    }

    const handleSave = async () => {
        if (!form.title || !form.content) return Swal.fire('Validation', 'Title and content are required', 'warning')
        setSaving(true)

        // For compatibility with backend that might still expect 'name'
        const payload = { ...form, name: form.title };

        try {
            const url = selectedBlog ? `/api/admin/blogs/${selectedBlog._id}` : '/api/admin/blogs'
            const method = selectedBlog ? 'PUT' : 'POST'
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            const data = await res.json()
            if (data.success) {
                Swal.fire('Saved!', '', 'success')
                setIsFormOpen(false)
                fetchBlogs()
            } else {
                Swal.fire('Error', data.message, 'error')
            }
        } catch {
            Swal.fire('Error', 'Failed to save blog', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id) => {
        const result = await Swal.fire({ title: 'Delete Blog?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Yes, delete' })
        if (result.isConfirmed) {
            const res = await fetch(`/api/admin/blogs/${id}`, { method: 'DELETE' })
            const data = await res.json()
            if (data.success) { Swal.fire('Deleted!', '', 'success'); fetchBlogs() }
            else Swal.fire('Error', data.message, 'error')
        }
    }

    const statusBadge = (status) => status === 'published'
        ? <span className="badge bg-success">Published</span>
        : <span className="badge bg-secondary">Draft</span>

    return (
        <>
            <PageHeader title="Blogs" breadcrumb={[{ name: 'Dashboard', path: '/' }, { name: 'Blogs' }]} />
            <div className="main-content">
                <div className="row">
                    <div className="col-lg-12">
                        <div className="card stretch stretch-full">
                            <div className="card-body p-0">
                                <div className="d-flex justify-content-between align-items-center p-4 border-bottom">
                                    <h5 className="fw-bold mb-0">Blog Posts</h5>
                                    <button className="btn btn-primary d-flex align-items-center" onClick={openCreate}>
                                        <FiPlus className="me-2" /> Add Blog
                                    </button>
                                </div>

                                {loading ? (
                                    <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                                ) : blogs.length === 0 ? (
                                    <div className="text-center p-5 text-muted">No blogs yet. Click &quot;Add Blog&quot; to create one.</div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="bg-light">
                                                <tr>
                                                    <th style={{ width: 80 }}>Image</th>
                                                    <th>Title</th>
                                                    <th>Category</th>
                                                    <th>Status</th>
                                                    <th>Date</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {blogs.map(b => (
                                                    <tr key={b._id}>
                                                        <td>
                                                            {b.image ? <img src={b.image} alt={b.title} style={{ width: 70, height: 45, objectFit: 'cover', borderRadius: 4 }} />
                                                                : <div style={{ width: 70, height: 45, background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiImage className="text-muted" /></div>}
                                                        </td>
                                                        <td className="fw-semibold">{b.title}</td>
                                                        <td><span className="badge bg-info text-dark">{b.category}</span></td>
                                                        <td>{statusBadge(b.status)}</td>
                                                        <td><small className="text-muted">{new Date(b.createdAt).toLocaleDateString()}</small></td>
                                                        <td>
                                                            <div className="d-flex gap-2">
                                                                <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(b)}><FiEdit /></button>
                                                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(b._id)}><FiTrash2 /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Blog Form Modal */}
            {isFormOpen && (
                <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-xl">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">{selectedBlog ? 'Edit Blog' : 'Add Blog'}</h5>
                                <button className="btn-close" onClick={() => setIsFormOpen(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="row">
                                    <div className="col-md-7 mb-3">
                                        <label className="form-label fw-semibold">Blog Title *</label>
                                        <input className="form-control" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Enter blog title" />
                                    </div>
                                    <div className="col-md-5 mb-3">
                                        <label className="form-label fw-semibold">Category</label>
                                        <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                                            {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                                            {categories.length === 0 && <option value="General">General</option>}
                                        </select>
                                    </div>

                                    {/* Image Selection */}
                                    <div className="col-md-7 mb-3">
                                        <label className="form-label fw-semibold">Feature Image</label>
                                        <div className="input-group">
                                            <input className="form-control" value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} placeholder="Image URL or upload" />
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="d-none"
                                                accept="image/*"
                                                onChange={handleFileUpload}
                                            />
                                            <button className="btn btn-outline-primary d-flex align-items-center" onClick={() => fileInputRef.current.click()}>
                                                <FiUpload className="me-1" /> Upload
                                            </button>
                                            <button className="btn btn-outline-info d-flex align-items-center" onClick={() => setIsMediaModalOpen(true)}>
                                                <FiImage className="me-1" /> Library
                                            </button>
                                        </div>
                                        {form.image && (
                                            <div className="mt-2 position-relative d-inline-block">
                                                <img src={form.image} alt="preview" style={{ maxHeight: 120, borderRadius: 6, border: '1px solid #dee2e6' }} />
                                                <button className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 p-1 rounded-circle d-flex align-items-center" onClick={() => setForm(f => ({ ...f, image: '' }))}>
                                                    <FiX size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-md-5 mb-3">
                                        <label className="form-label fw-semibold">Status</label>
                                        <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                                            <option value="draft">Draft</option>
                                            <option value="published">Published</option>
                                        </select>
                                    </div>

                                    <div className="col-12 mb-3">
                                        <label className="form-label fw-semibold">Content *</label>
                                        <div style={{ height: '400px', marginBottom: '50px' }}>
                                            <ReactQuill
                                                theme="snow"
                                                value={form.content}
                                                onChange={content => setForm(f => ({ ...f, content }))}
                                                style={{ height: '100%' }}
                                                modules={{
                                                    toolbar: [
                                                        [{ 'header': [1, 2, 3, false] }],
                                                        ['bold', 'italic', 'underline', 'strike'],
                                                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                        ['link', 'image', 'video'],
                                                        ['clean']
                                                    ],
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-light" onClick={() => setIsFormOpen(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                    {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : 'Save Blog'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Media Library Modal */}
            <MediaLibraryModal
                isOpen={isMediaModalOpen}
                onClose={() => setIsMediaModalOpen(false)}
                onSelect={(file) => {
                    setForm(f => ({ ...f, image: file.path }))
                    setIsMediaModalOpen(false)
                }}
                fileType="image"
            />
        </>
    )
}

export default BlogsPage
