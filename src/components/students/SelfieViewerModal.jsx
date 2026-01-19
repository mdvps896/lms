'use client'

import React, { useState, useEffect } from 'react'
import { FiX, FiDownload, FiTrash2, FiCamera, FiCheck } from 'react-icons/fi'
import Swal from 'sweetalert2'

const SelfieViewerModal = ({ show, sessionId, onClose }) => {
    const [selfies, setSelfies] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedImage, setSelectedImage] = useState(null)

    useEffect(() => {
        if (show && sessionId) {
            fetchSelfies()
        }
    }, [show, sessionId])

    const fetchSelfies = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/student/selfies/${sessionId}`)
            const data = await response.json()
            if (data.success) {
                setSelfies(data.data)
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: data.message || 'Failed to fetch selfies', timer: 2000 })
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Error connecting to server', timer: 2000 })
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (selfieId) => {
        if (!window.confirm('Are you sure you want to delete this selfie?')) return

        try {
            const response = await fetch(`/api/student/selfies/manage/${selfieId}`, {
                method: 'DELETE'
            })
            const data = await response.json()
            if (data.success) {
                Swal.fire({ icon: 'success', title: 'Deleted', text: 'Selfie deleted', timer: 1500, showConfirmButton: false })
                setSelfies(selfies.filter(s => s._id !== selfieId))
                if (selectedImage?._id === selfieId) setSelectedImage(null)
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: data.message || 'Failed to delete', timer: 2000 })
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Error deleting selfie', timer: 2000 })
        }
    }

    const handleDownload = (url, filename) => {
        const link = document.createElement('a')
        link.href = url
        link.download = filename || 'selfie.jpg'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    if (!show) return null

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1100 }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px', overflow: 'hidden' }}>

                    {/* Header */}
                    <div className="modal-header bg-dark text-white border-0 py-3">
                        <h5 className="modal-title d-flex align-items-center gap-2">
                            <FiCamera /> Attendance Selfies
                            <span className="badge bg-primary fs-12 ms-2">{selfies.length} Photos</span>
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>

                    {/* Body */}
                    <div className="modal-body p-4 bg-light" style={{ minHeight: '400px', maxHeight: '70vh', overflowY: 'auto' }}>
                        {loading ? (
                            <div className="d-flex flex-column justify-content-center align-items-center p-5">
                                <div className="spinner-border text-primary mb-3" role="status"></div>
                                <p className="text-muted">Loading attendance photos...</p>
                            </div>
                        ) : selfies.length === 0 ? (
                            <div className="text-center py-5">
                                <div className="avatar avatar-xl bg-soft-secondary text-secondary mb-3 mx-auto rounded-circle d-flex align-items-center justify-content-center">
                                    <FiCamera size={40} />
                                </div>
                                <h5>No Selfies Found</h5>
                                <p className="text-muted">No attendance photos were captured during this session.</p>
                            </div>
                        ) : (
                            <div className="row g-3">
                                {selfies.map((selfie) => (
                                    <div key={selfie._id} className="col-6 col-md-4 col-lg-3">
                                        <div className="card h-100 border-0 shadow-sm hover-shadow transition-all group position-relative overflow-hidden rounded-3">
                                            {/* Image Container */}
                                            <div
                                                className="ratio ratio-1x1 cursor-pointer"
                                                onClick={() => setSelectedImage(selfie)}
                                            >
                                                <img
                                                    src={selfie.imageUrl}
                                                    alt="Selfie"
                                                    className="object-fit-cover w-100 h-100"
                                                    onError={(e) => e.target.src = 'https://placehold.co/400x400?text=Error+Loading'}
                                                />
                                            </div>

                                            {/* Badge for capture type */}
                                            <div className="position-absolute top-0 start-0 m-2">
                                                <span className={`badge ${selfie.captureType === 'pdf_initial' ? 'bg-success' : 'bg-primary'
                                                    } fs-10 opacity-75`}>
                                                    {selfie.captureType === 'pdf_initial' ? 'Entry' : 'Middle'}
                                                </span>
                                            </div>

                                            {/* Actions Overlay */}
                                            <div className="position-absolute bottom-0 start-0 w-100 bg-dark bg-opacity-75 p-2 d-flex justify-content-center gap-2 transform translate-y-full transition-transform group-hover:translate-y-0" style={{ transition: '0.3s' }}>
                                                <button
                                                    className="btn btn-sm btn-info text-white p-1 rounded-circle"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDownload(selfie.imageUrl, `selfie_${selfie._id}.jpg`);
                                                    }}
                                                    title="Download"
                                                >
                                                    <FiDownload size={14} />
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-danger p-1 rounded-circle"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(selfie._id);
                                                    }}
                                                    title="Delete"
                                                >
                                                    <FiTrash2 size={14} />
                                                </button>
                                            </div>

                                            {/* Timestamp footer */}
                                            <div className="card-footer p-2 border-0 bg-white text-center">
                                                <div className="text-muted fs-10">
                                                    Page {selfie.currentPage || 1} • {new Date(selfie.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="modal-footer border-0 bg-white py-3">
                        <button type="button" className="btn btn-outline-secondary px-4" onClick={onClose}>Close</button>
                    </div>
                </div>
            </div>

            {/* Full Image Viewer Lightbox */}
            {selectedImage && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1200 }}>
                    <div className="position-absolute top-0 end-0 m-4">
                        <button className="btn btn-link text-white text-decoration-none shadow-none" onClick={() => setSelectedImage(null)}>
                            <FiX size={40} />
                        </button>
                    </div>
                    <div className="text-center">
                        <img
                            src={selectedImage.imageUrl}
                            alt="Full Size"
                            className="img-fluid rounded shadow-lg"
                            style={{ maxHeight: '85vh', maxWidth: '90vw' }}
                        />
                        <div className="mt-4 text-white">
                            <h5 className="mb-1">{selectedImage.captureType === 'pdf_initial' ? 'Initial Attendance' : 'Periodic Check'}</h5>
                            <p className="opacity-75">Captured on Page {selectedImage.currentPage} at {new Date(selectedImage.createdAt).toLocaleString()}</p>
                            <div className="d-flex justify-content-center gap-3 mt-3">
                                <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => handleDownload(selectedImage.imageUrl)}>
                                    <FiDownload /> Download
                                </button>
                                <button className="btn btn-danger d-flex align-items-center gap-2" onClick={() => handleDelete(selectedImage._id)}>
                                    <FiTrash2 /> Delete Photo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .group:hover .translate-y-full {
                    transform: translateY(0);
                }
                .cursor-pointer {
                    cursor: pointer;
                }
                .hover-shadow:hover {
                    box-shadow: 0 .5rem 1rem rgba(0,0,0,.15) !important;
                    transform: translateY(-2px);
                }
                .transition-all {
                    transition: all 0.3s ease;
                }
                .object-fit-cover {
                    object-fit: cover;
                }
            `}</style>
        </div>
    )
}

export default SelfieViewerModal
