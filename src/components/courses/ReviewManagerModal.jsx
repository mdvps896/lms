'use client';
import { useState, useEffect } from 'react';
import { FiTrash2, FiPlus, FiStar, FiUser, FiCalendar, FiEdit2 } from 'react-icons/fi';
import Swal from 'sweetalert2';

export default function ReviewManagerModal({ course, onClose }) {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionInProgress, setActionInProgress] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);

    // Form State
    const [form, setForm] = useState({
        userName: '',
        rating: 5,
        review: ''
    });

    useEffect(() => {
        fetchReviews();
    }, [course]);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/courses/${course._id}/reviews`);
            const data = await res.json();
            if (data.success) {
                setReviews(data.data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenForm = (review = null) => {
        if (review) {
            setSelectedReview(review);
            setForm({
                userName: review.userName || review.user?.name || '',
                rating: review.rating || 5,
                review: review.review || ''
            });
        } else {
            setSelectedReview(null);
            setForm({ userName: '', rating: 5, review: '' });
        }
        setIsFormOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setActionInProgress(true);
        try {
            const url = selectedReview
                ? `/api/admin/courses/${course._id}/reviews/${selectedReview._id}`
                : `/api/admin/courses/${course._id}/reviews`;

            const method = selectedReview ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            const data = await res.json();
            if (data.success) {
                Swal.fire({ icon: 'success', title: 'Success', text: data.message, timer: 1500 });
                fetchReviews();
                setIsFormOpen(false);
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: data.message });
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Something went wrong' });
        } finally {
            setActionInProgress(false);
        }
    };

    const handleDelete = async (reviewId) => {
        const result = await Swal.fire({
            title: 'Delete Review?',
            text: 'Are you sure you want to delete this review?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            setActionInProgress(true);
            try {
                const res = await fetch(`/api/admin/courses/${course._id}/reviews/${reviewId}`, {
                    method: 'DELETE'
                });
                const data = await res.json();
                if (data.success) {
                    Swal.fire({ icon: 'success', title: 'Deleted!', text: 'Review has been deleted', timer: 1500 });
                    fetchReviews();
                }
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete' });
            } finally {
                setActionInProgress(false);
            }
        }
    };

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content border-0 shadow-lg">
                    <div className="modal-header bg-light">
                        <h5 className="modal-title d-flex align-items-center">
                            <FiStar className="text-warning me-2" />
                            Manage Reviews: {course.title}
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>

                    <div className="modal-body p-0" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        {isFormOpen ? (
                            <form onSubmit={handleSave} className="p-4">
                                <div className="d-flex align-items-center mb-4 p-3 bg-light rounded">
                                    <div className="me-3">
                                        {selectedReview?.user?.profileImage ? (
                                            <img
                                                src={selectedReview.user.profileImage}
                                                alt="profile"
                                                className="rounded-circle"
                                                style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                                                <FiUser size={24} />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h6 className="mb-1">{selectedReview ? 'Editing Review' : 'New Custom Review'}</h6>
                                        <p className="text-muted small m-0">
                                            {selectedReview?.user?.name ? `Original Student: ${selectedReview.user.name}` : 'Adding review as Administrator'}
                                        </p>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold">Display Name (Visible in App)</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-white"><FiUser /></span>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="e.g. Rahul Sharma"
                                            value={form.userName}
                                            onChange={e => setForm({ ...form, userName: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <small className="text-muted">This name will be shown to other students.</small>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold d-block">Rating</label>
                                    <div className="d-flex gap-1">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <FiStar
                                                key={star}
                                                size={30}
                                                className={`cursor-pointer ${star <= form.rating ? 'text-warning' : 'text-muted opacity-25'}`}
                                                style={{
                                                    cursor: 'pointer',
                                                    fill: star <= form.rating ? 'currentColor' : 'none',
                                                    transition: 'all 0.2s'
                                                }}
                                                onClick={() => setForm({ ...form, rating: star })}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold">Review Content</label>
                                    <textarea
                                        className="form-control"
                                        rows="4"
                                        placeholder="Write review here..."
                                        value={form.review}
                                        onChange={e => setForm({ ...form, review: e.target.value })}
                                        required
                                    ></textarea>
                                </div>

                                <div className="d-flex justify-content-end gap-2">
                                    <button type="button" className="btn btn-light" onClick={() => setIsFormOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={actionInProgress}>
                                        {actionInProgress ? 'Saving...' : (selectedReview ? 'Update Review' : 'Add Review')}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="p-4">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h6 className="m-0 text-muted">{reviews.length} Total Reviews</h6>
                                    <button className="btn btn-primary btn-sm d-flex align-items-center" onClick={() => handleOpenForm()}>
                                        <FiPlus className="me-1" /> Add New Review
                                    </button>
                                </div>

                                {loading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status"></div>
                                        <p className="mt-2 text-muted">Loading reviews...</p>
                                    </div>
                                ) : reviews.length === 0 ? (
                                    <div className="text-center py-5 border rounded bg-light">
                                        <FiStar size={40} className="text-muted mb-3 opacity-25" />
                                        <p className="text-muted m-0">No reviews found for this course.</p>
                                    </div>
                                ) : (
                                    <div className="row g-3">
                                        {reviews.map((review) => (
                                            <div key={review._id} className="col-12">
                                                <div className="card border-light shadow-sm hover-shadow transition-all">
                                                    <div className="card-body p-3">
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <div>
                                                                <h6 className="mb-1 fw-bold">
                                                                    {review.userName || review.user?.name || 'Anonymous Student'}
                                                                </h6>
                                                                <div className="d-flex align-items-center mb-2">
                                                                    <div className="text-warning me-2 d-flex">
                                                                        {[...Array(5)].map((_, i) => (
                                                                            <FiStar
                                                                                key={i}
                                                                                size={12}
                                                                                className={i < review.rating ? 'fill-warning' : 'text-muted'}
                                                                                style={{ fill: i < review.rating ? 'currentColor' : 'none' }}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                    <small className="text-muted d-flex align-items-center">
                                                                        <FiCalendar className="me-1" />
                                                                        {new Date(review.createdAt).toLocaleDateString()}
                                                                    </small>
                                                                </div>
                                                                <p className="card-text text-secondary small m-0" style={{ lineHeight: '1.5' }}>
                                                                    {review.review}
                                                                </p>
                                                            </div>
                                                            <div className="btn-group">
                                                                <button
                                                                    className="btn btn-sm btn-light text-primary"
                                                                    onClick={() => handleOpenForm(review)}
                                                                >
                                                                    <FiEdit2 size={14} />
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-light text-danger"
                                                                    onClick={() => handleDelete(review._id)}
                                                                >
                                                                    <FiTrash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {!isFormOpen && (
                        <div className="modal-footer bg-light">
                            <button className="btn btn-secondary" onClick={onClose}>Close</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
