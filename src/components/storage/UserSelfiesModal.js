import React, { useState, useEffect } from 'react';
import { exportFilesAsZip } from '@/utils/exportUtils';
import Swal from 'sweetalert2';

const UserSelfiesModal = ({ user, show, onClose }) => {
    const [selfies, setSelfies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [deleting, setDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'courses', 'free_materials'
    const [subTab, setSubTab] = useState('pdf'); // 'pdf', 'test' - for free_materials

    const getSecureUrl = (filePath) => {
        if (!filePath) return ''
        // Ensure path starts with / only if it's NOT an external URL
        const normalizedPath = (filePath.startsWith('http://') || filePath.startsWith('https://'))
            ? filePath
            : (filePath.startsWith('/') ? filePath : '/' + filePath)

        return `/api/storage/secure-file?path=${encodeURIComponent(normalizedPath)}`
    }

    useEffect(() => {
        if (show && user) {
            fetchSelfies();
            setSelectedImage(null);
            setSelectedIds([]);
            setActiveTab('all');
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

    // Filter Logic
    const filteredSelfies = selfies.filter(selfie => {
        const dummyId = '000000000000000000000000';
        // Check if it is a free material selfie
        // Our backend uses dummyId for course AND sets captureType.
        // Also check if course is 'free_material' string just in case.
        const isFreeMaterial =
            selfie.course === dummyId ||
            selfie.course?._id === dummyId ||
            selfie.courseName === 'Free Material' ||
            selfie.course === 'free_material' ||
            selfie.metadata?.isFreeMaterial === true;

        if (activeTab === 'courses') return !isFreeMaterial;
        if (activeTab === 'free_materials') {
            if (!isFreeMaterial) return false;

            const isTestSelfie = selfie.captureType?.startsWith('test_');
            if (subTab === 'test') return isTestSelfie;
            return !isTestSelfie; // Default to PDF for free_materials
        }
        return true;
    });

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredSelfies.length && filteredSelfies.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredSelfies.map(s => s._id));
        }
    };

    const handleExport = async (ids) => {
        const selectedSelfies = selfies.filter(s => ids.includes(s._id));

        try {
            Swal.fire({
                title: 'Preparing Export...',
                text: `Bundling ${ids.length} selfies.`,
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const exportData = selectedSelfies.map(s => ({
                path: s.imageUrl,
                name: `${user.name}_${s.courseName || 'selfie'}_${new Date(s.createdAt).getTime()}.jpg`
            }));

            await exportFilesAsZip(exportData, `${user.name}-selfies-${Date.now()}.zip`);

            Swal.fire({
                icon: 'success',
                title: 'Export Ready!',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Export Failed',
                text: 'An error occurred while preparing the ZIP file.'
            });
        }
    };

    const handleDelete = async (ids) => {
        const result = await Swal.fire({
            title: 'Delete Selected Images?',
            text: `Are you sure you want to delete ${ids.length} image(s)?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete them!'
        });

        if (!result.isConfirmed) return;

        setDeleting(true);
        try {
            // Prepare items for deletion
            const itemsToDelete = ids.map(id => {
                const selfie = selfies.find(s => s._id === id);
                if (!selfie) return null;

                const isCloudinary = selfie.imagePath === 'cloudinary' || selfie.course === '000000000000000000000000';

                let publicId = null;
                if (isCloudinary && selfie.imageUrl) {
                    try {
                        const regex = /\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/;
                        const match = selfie.imageUrl.match(regex);
                        if (match && match[1]) {
                            publicId = match[1];
                        }
                    } catch (e) {
                        console.error('Failed to extract public ID', e);
                    }
                }

                return {
                    path: selfie.imagePath,
                    publicId: publicId,
                    isCloudinary: isCloudinary,
                    id: selfie._id // Include ID for accurate record deletion if needed
                };
            }).filter(item => item !== null);

            const response = await fetch('/api/storage/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: itemsToDelete })
            });

            const data = await response.json();
            if (data.success) {
                setSelfies(prev => prev.filter(s => !ids.includes(s._id)));
                setSelectedIds([]);
                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: data.message || 'Images deleted successfully',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Delete Failed',
                    text: data.message || 'Failed to delete images'
                });
            }
        } catch (error) {
            console.error('Delete error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'An error occurred while deleting'
            });
        } finally {
            setDeleting(false);
        }
    };

    if (!show || !user) return null;

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content" style={{ maxHeight: '90vh' }}>
                    <div className="modal-header d-flex justify-content-between align-items-center flex-wrap">
                        <div className="d-flex align-items-center mb-2 mb-md-0">
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
                                <small className="text-muted">{selfies.length} total captures</small>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            {selfies.length > 0 && (
                                <>
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={toggleSelectAll}
                                    >
                                        {selectedIds.length === filteredSelfies.length && filteredSelfies.length > 0 ? 'Deselect All' : 'Select All'} ({selectedIds.length}/{filteredSelfies.length})
                                    </button>
                                    {selectedIds.length > 0 && (
                                        <div className="d-flex gap-2">
                                            <button
                                                className="btn btn-sm btn-outline-info"
                                                onClick={() => handleExport(selectedIds)}
                                            >
                                                <i className="fas fa-download me-1"></i>
                                                Export ({selectedIds.length})
                                            </button>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => {
                                                    handleDelete(selectedIds);
                                                }}
                                                disabled={deleting}
                                            >
                                                <i className="fas fa-trash-alt me-1"></i>
                                                Delete ({selectedIds.length})
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>
                    </div>

                    {/* TABS */}
                    <div className="px-3 pt-3 border-bottom">
                        <ul className="nav nav-tabs border-0">
                            <li className="nav-item">
                                <button
                                    className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('all')}
                                >
                                    All
                                </button>
                            </li>
                            <li className="nav-item">
                                <button
                                    className={`nav-link ${activeTab === 'courses' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('courses')}
                                >
                                    Courses
                                </button>
                            </li>
                            <li className="nav-item">
                                <button
                                    className={`nav-link ${activeTab === 'free_materials' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('free_materials')}
                                >
                                    Free Materials
                                </button>
                            </li>
                        </ul>
                    </div>

                    {activeTab === 'free_materials' && (
                        <div className="px-3 pt-2 bg-light border-bottom">
                            <ul className="nav nav-pills nav-fill bg-white p-1 rounded-pill shadow-sm" style={{ maxWidth: '300px' }}>
                                <li className="nav-item">
                                    <button
                                        className={`nav-link rounded-pill py-1 ${subTab === 'pdf' ? 'active' : ''}`}
                                        onClick={() => setSubTab('pdf')}
                                    >
                                        PDF
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button
                                        className={`nav-link rounded-pill py-1 ${subTab === 'test' ? 'active' : ''}`}
                                        onClick={() => setSubTab('test')}
                                    >
                                        Test
                                    </button>
                                </li>
                            </ul>
                        </div>
                    )}

                    <div className="modal-body p-4 bg-light">
                        {loading ? (
                            <div className="text-center p-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : filteredSelfies.length === 0 ? (
                            <div className="text-center p-5">
                                <i className="fas fa-camera-retro fa-3x text-muted mb-3"></i>
                                <p className="text-muted">No selfies found for this view.</p>
                            </div>
                        ) : (
                            <div className="row g-3">
                                {filteredSelfies.map((selfie) => (
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
                                                        handleDelete([selfie._id]);
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
                                                <SelfieImage src={getSecureUrl(selfie.imageUrl)} />
                                            </div>
                                            <div className="card-body p-2" onClick={() => toggleSelect(selfie._id)} style={{ cursor: 'pointer' }}>
                                                <div className="d-flex justify-content-between align-items-start small">
                                                    <div>
                                                        <span className={`badge ${selfie.captureType === 'enrollment' ? 'bg-success' :
                                                            selfie.captureType?.startsWith('test_') ? 'bg-danger' :
                                                                selfie.captureType === 'pdf_periodic' ? 'bg-info' : 'bg-warning'
                                                            } mb-1`}>
                                                            {selfie.captureType?.startsWith('test_') ? 'Test' : selfie.captureType?.replace('_', ' ')}
                                                        </span>
                                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                            {new Date(selfie.createdAt).toLocaleDateString()}
                                                        </div>
                                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                            {new Date(selfie.createdAt).toLocaleTimeString()}
                                                        </div>
                                                    </div>
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
                        src={getSecureUrl(selectedImage.imageUrl)}
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
