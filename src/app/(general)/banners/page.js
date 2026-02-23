'use client'

import React, { useState, useEffect, useRef } from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import Swal from 'sweetalert2'
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi'

const BannersPage = () => {
    const [banners, setBanners] = useState([])
    const [loading, setLoading] = useState(true)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [selectedBanner, setSelectedBanner] = useState(null)
    const [form, setForm] = useState({ name: '', image: '', linkType: 'none', link: '', order: 0, isActive: true })
    const [imageTab, setImageTab] = useState('url') // 'url' | 'upload' | 'gallery'
    const [gallery, setGallery] = useState([])
    const [galleryLoading, setGalleryLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [courses, setCourses] = useState([])
    const fileRef = useRef()

    const fetchBanners = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/banners')
            const data = await res.json()
            if (data.success) setBanners(data.data)
        } catch (e) {
            Swal.fire('Error', 'Failed to load banners', 'error')
        } finally {
            setLoading(false)
        }
    }

    const fetchGallery = async () => {
        setGalleryLoading(true)
        try {
            // Using existing files route
            const res = await fetch('/api/storage/files')
            const data = await res.json()
            if (data.success) {
                // Filter images and ensure they have a selectable URL
                const images = (data.files || []).filter(f => f.type === 'image').map(f => ({
                    ...f,
                    url: f.path // This matches the path property from /api/storage/files
                }))
                setGallery(images)
            }
        } catch (e) {
            setGallery([])
        } finally {
            setGalleryLoading(false)
        }
    }

    const fetchCourses = async () => {
        try {
            const res = await fetch('/api/admin/courses')
            const data = await res.json()
            if (data.success) setCourses(data.data || [])
        } catch (e) {
            console.error('Failed to fetch courses', e)
        }
    }

    useEffect(() => {
        fetchBanners()
        fetchCourses()
    }, [])
    useEffect(() => { if (imageTab === 'gallery') fetchGallery() }, [imageTab])

    const openCreate = () => {
        setSelectedBanner(null)
        setForm({ name: '', image: '', linkType: 'none', link: '', order: banners.length, isActive: true })
        setImageTab('url')
        setIsFormOpen(true)
    }

    const openEdit = (banner) => {
        setSelectedBanner(banner)
        setForm({ name: banner.name, image: banner.image, linkType: banner.linkType || 'none', link: banner.link || '', order: banner.order ?? 0, isActive: banner.isActive !== false })
        setImageTab('url')
        setIsFormOpen(true)
    }

    const handleFileUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'uploads/banners')

        try {
            const res = await fetch('/api/storage/upload', {
                method: 'POST',
                body: formData
            })
            const data = await res.json()
            if (data.success && data.url) {
                setForm(f => ({ ...f, image: data.url }))
                Swal.fire({ title: 'Uploaded!', icon: 'success', timer: 1000, showConfirmButton: false })
            } else {
                Swal.fire('Error', data.message || 'Upload failed', 'error')
            }
        } catch (err) {
            Swal.fire('Error', 'Upload error', 'error')
        }
    }

    const handleSave = async () => {
        if (!form.name || !form.image) return Swal.fire('Validation', 'Name and image are required', 'warning')
        setSaving(true)
        try {
            const url = selectedBanner ? `/api/admin/banners/${selectedBanner._id}` : '/api/admin/banners'
            const method = selectedBanner ? 'PUT' : 'POST'
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
            const data = await res.json()
            if (data.success) {
                Swal.fire('Saved!', '', 'success')
                setIsFormOpen(false)
                fetchBanners()
            } else {
                Swal.fire('Error', data.message, 'error')
            }
        } catch (e) {
            Swal.fire('Error', 'Failed to save banner', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id) => {
        const result = await Swal.fire({ title: 'Delete Banner?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Yes, delete' })
        if (result.isConfirmed) {
            const res = await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' })
            const data = await res.json()
            if (data.success) { Swal.fire('Deleted!', '', 'success'); fetchBanners() }
            else Swal.fire('Error', data.message, 'error')
        }
    }

    return (
        <>
            <PageHeader title="Banner Slider" breadcrumb={[{ name: 'Dashboard', path: '/' }, { name: 'Banners' }]} />
            <div className="main-content">
                <div className="row">
                    <div className="col-lg-12">
                        <div className="card stretch stretch-full">
                            <div className="card-body p-0">
                                <div className="d-flex justify-content-between align-items-center p-4 border-bottom">
                                    <h5 className="fw-bold mb-0">Home Banner Slider</h5>
                                    <button className="btn btn-primary d-flex align-items-center" onClick={openCreate}>
                                        <FiPlus className="me-2" /> Add Banner
                                    </button>
                                </div>

                                {loading ? (
                                    <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                                ) : banners.length === 0 ? (
                                    <div className="text-center p-5 text-muted">No banners yet. Click &quot;Add Banner&quot; to create one.</div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="bg-light">
                                                <tr>
                                                    <th style={{ width: 60 }}>Order</th>
                                                    <th style={{ width: 120 }}>Image</th>
                                                    <th>Name</th>
                                                    <th>Link Type</th>
                                                    <th>Link</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {banners.map(b => (
                                                    <tr key={b._id}>
                                                        <td><span className="badge bg-light text-dark">{b.order}</span></td>
                                                        <td>
                                                            <img src={b.image} alt={b.name} style={{ width: 100, height: 55, objectFit: 'cover', borderRadius: 6 }} />
                                                        </td>
                                                        <td className="fw-semibold">{b.name}</td>
                                                        <td><span className="badge bg-info text-dark">{b.linkType}</span></td>
                                                        <td>
                                                            <small className="text-muted text-truncate d-block" style={{ maxWidth: 200 }}>
                                                                {b.linkType === 'course'
                                                                    ? (courses.find(c => c._id === b.link)?.title || b.link || '—')
                                                                    : (b.link || '—')
                                                                }
                                                            </small>
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${b.isActive ? 'bg-success' : 'bg-secondary'}`}>
                                                                {b.isActive ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
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

            {/* Banner Form Modal */}
            {isFormOpen && (
                <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{selectedBanner ? 'Edit Banner' : 'Add Banner'}</h5>
                                <button className="btn-close" onClick={() => setIsFormOpen(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Banner Name *</label>
                                    <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Summer Sale Banner" />
                                </div>

                                {/* Image Selection */}
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Banner Image *</label>
                                    <div className="d-flex gap-2 mb-2">
                                        {['url', 'upload', 'gallery'].map(tab => (
                                            <button key={tab} className={`btn btn-sm ${imageTab === tab ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setImageTab(tab)}>
                                                {tab === 'url' ? '🔗 URL' : tab === 'upload' ? '⬆ Upload' : '🖼 Gallery'}
                                            </button>
                                        ))}
                                    </div>
                                    {imageTab === 'url' && (
                                        <input className="form-control" value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} placeholder="https://example.com/banner.jpg" />
                                    )}
                                    {imageTab === 'upload' && (
                                        <>
                                            <input ref={fileRef} type="file" accept="image/*" className="form-control" onChange={handleFileUpload} />
                                        </>
                                    )}
                                    {imageTab === 'gallery' && (
                                        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                                            {galleryLoading ? <div className="text-center py-3"><div className="spinner-border spinner-border-sm"></div></div> : (
                                                <div className="d-flex flex-wrap gap-2">
                                                    {gallery.length === 0 && <p className="text-muted small">No images found in gallery.</p>}
                                                    {gallery.map((img, i) => (
                                                        <img key={i} src={img.url} alt="" onClick={() => setForm(f => ({ ...f, image: img.url }))}
                                                            style={{ width: 80, height: 50, objectFit: 'cover', cursor: 'pointer', borderRadius: 4, border: form.image === img.url ? '2px solid #0d6efd' : '2px solid transparent' }} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {form.image && (
                                        <div className="mt-2">
                                            <small className="text-muted d-block mb-1">Preview:</small>
                                            <img src={form.image} alt="preview" style={{ maxHeight: 120, maxWidth: '100%', borderRadius: 6, border: '1px solid #dee2e6' }} />
                                        </div>
                                    )}
                                </div>

                                {/* Link */}
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Link Type</label>
                                    <select className="form-select" value={form.linkType} onChange={e => setForm(f => ({ ...f, linkType: e.target.value }))}>
                                        <option value="none">No Link</option>
                                        <option value="course">Course (enter Course ID)</option>
                                        <option value="external">External URL</option>
                                    </select>
                                </div>
                                {form.linkType !== 'none' && (
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">{form.linkType === 'course' ? 'Select Course' : 'External URL'}</label>
                                        {form.linkType === 'course' ? (
                                            <select
                                                className="form-select"
                                                value={form.link}
                                                onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
                                            >
                                                <option value="">-- Choose Course --</option>
                                                {courses.filter(course => course.status === 'active').map(course => (
                                                    <option key={course._id} value={course._id}>
                                                        {course.title}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                className="form-control"
                                                value={form.link}
                                                onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
                                                placeholder="https://..."
                                            />
                                        )}
                                    </div>
                                )}

                                {/* Order & Status */}
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-semibold">Display Order</label>
                                        <input type="number" className="form-control" value={form.order} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))} min={0} />
                                    </div>
                                    <div className="col-md-6 mb-3 d-flex align-items-center gap-2 pt-4">
                                        <div className="form-check form-switch">
                                            <input className="form-check-input" type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                                            <label className="form-check-label fw-semibold">Active</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                    {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : 'Save Banner'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default BannersPage
