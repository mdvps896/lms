import React, { useState, useEffect } from 'react';

const UserSelfiesModal = ({ user, show, onClose }) => {
    const [selfies, setSelfies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (show && user) {
            fetchSelfies();
            setSelectedImage(null);
            setSelectedIds([]);
        }
    }, [show, user]);

    const fetchSelfies = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/storage/users/${user._id}/selfies`);
            const data = await response.json();
            if (data.success) {
                setSelfies(data.files);
            }
        } catch (error) {
            console.error('Error fetching selfies:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === selfies.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(selfies.map(s => s._id));
        }
    };

    const handleDelete = async (filePaths) => {
        if (!confirm(`Are you sure you want to delete ${filePaths.length} image(s)? This action cannot be undone.`)) return;

        setDeleting(true);
        try {
            const response = await fetch('/api/storage/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePaths })
            });

            const data = await response.json();
            if (data.success) {
                // Remove deleted items from local state
                setSelfies(prev => prev.filter(s => !filePaths.includes(s.relativePath)));
                setSelectedIds([]);
                alert(data.message || 'Deleted successfully');
            } else {
                alert(data.message || 'Failed to delete');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('An error occurred while deleting');
        } finally {
            setDeleting(false);
        }
    };

    if (!show || !user) return null;

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content" style={{ maxHeight: '90vh' }}>
                    <div className="modal-header d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                            {user.profileImage ? (
                                <img
                                    src={user.profileImage}
                                    className="rounded-circle me-2"
                                    width="40"
                                    height="40"
                                    alt={user.name}
                                    style={{ objectFit: 'cover' }}
                                />
                            ) : (
                                <div
                                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
                                    style={{ width: '40px', height: '40px' }}
                                >
                                    {user.name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <h5 className="modal-title mb-0">{user.name}'s Selfies</h5>
                                <small className="text-muted">{selfies.length} potential selfies found</small>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            {selfies.length > 0 && (
                                <>
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={toggleSelectAll}
                                    >
                                        {selectedIds.length === selfies.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                    {selectedIds.length > 0 && (
                                        <button
                                            className="btn btn-sm btn-danger"
                                            onClick={() => {
                                                const paths = selfies
                                                    .filter(s => selectedIds.includes(s._id))
                                                    .map(s => s.relativePath);
                                                handleDelete(paths);
                                            }}
                                            disabled={deleting}
                                        >
                                            <i className="fas fa-trash-alt me-1"></i>
                                            Delete ({selectedIds.length})
                                        </button>
                                    )}
                                </>
                            )}
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>
                    </div>

                    <div className="modal-body p-4 bg-light">
                        {loading ? (
                            <div className="text-center p-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : selfies.length === 0 ? (
                            <div className="text-center p-5">
                                <i className="fas fa-camera-retro fa-3x text-muted mb-3"></i>
                                <p className="text-muted">No selfies found for this user.</p>
                            </div>
                        ) : (
                            <div className="row g-3">
                                {selfies.map((selfie) => (
                                    <div key={selfie._id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                                        <div className={`card h-100 shadow-sm border-0 position-relative group-hover ${selectedIds.includes(selfie._id) ? 'border border-primary' : ''}`}>
                                            {/* Checkbox for Selection */}
                                            <div className="position-absolute top-0 start-0 m-2" style={{ zIndex: 10 }}>
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                                        checked={selectedIds.includes(selfie._id)}
                                                        onChange={() => toggleSelect(selfie._id)}
                                                    />
                                                </div>
                                            </div>

                                            {/* Individual Delete Action */}
                                            <div className="position-absolute top-0 end-0 m-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ zIndex: 10 }}>
                                                <button
                                                    className="btn btn-sm btn-danger rounded-circle p-1"
                                                    style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete([selfie.relativePath]);
                                                    }}
                                                    title="Delete this image"
                                                >
                                                    <i className="fas fa-trash" style={{ fontSize: '0.75rem' }}></i>
                                                </button>
                                            </div>

                                            <div
                                                className="ratio ratio-4x3 cursor-pointer overflow-hidden rounded-top"
                                                onClick={() => setSelectedImage(selfie)}
                                            >
                                                <SelfieImage src={selfie.imageUrl} />
                                            </div>
                                            <div className="card-body p-2" onClick={() => toggleSelect(selfie._id)} style={{ cursor: 'pointer' }}>
                                                <div className="d-flex justify-content-between align-items-start small">
                                                    <div>
                                                        <span className={`badge ${selfie.captureType === 'enrollment' ? 'bg-success' :
                                                            selfie.captureType === 'pdf_periodic' ? 'bg-info' : 'bg-warning'
                                                            } mb-1`}>
                                                            {selfie.captureType?.replace('_', ' ')}
                                                        </span>
                                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                            {new Date(selfie.createdAt).toLocaleDateString()}
                                                        </div>
                                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                            {new Date(selfie.createdAt).toLocaleTimeString()}
                                                        </div>
                                                    </div>
                                                    {selfie.courseName && (
                                                        <span className="badge bg-light text-dark text-truncate" style={{ maxWidth: '80px' }} title={selfie.courseName}>
                                                            {selfie.courseName}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Full Screen Image Preview Overlay */}
            {selectedImage && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                    style={{ zIndex: 1060, backgroundColor: 'rgba(0,0,0,0.9)' }}
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="btn btn-close btn-close-white position-absolute top-0 end-0 m-4"
                        onClick={() => setSelectedImage(null)}
                    ></button>
                    <img
                        src={selectedImage.imageUrl}
                        alt="Full View"
                        style={{ maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain' }}
                        className="rounded shadow-lg"
                    />
                    <div className="position-absolute bottom-0 text-white p-3 text-center bg-black bg-opacity-50 w-100">
                        <p className="mb-0 fw-bold">Captured: {new Date(selectedImage.createdAt).toLocaleString()}</p>
                        <p className="mb-0 small text-white-50">{selectedImage.captureType} • {selectedImage.courseName}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const SelfieImage = ({ src }) => {
    const [error, setError] = useState(false);

    if (error) {
        return (
            <div className="w-100 h-100 bg-white d-flex align-items-center justify-content-center">
                <i className="fas fa-camera fa-2x text-muted opacity-25"></i>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt="Selfie"
            className="w-100 h-100 object-fit-cover transition-transform hover:scale-110"
            style={{ cursor: 'zoom-in', objectFit: 'cover' }}
            loading="lazy"
            onError={() => setError(true)}
        />
    );
};

export default UserSelfiesModal;
