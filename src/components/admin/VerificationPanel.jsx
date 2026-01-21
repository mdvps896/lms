'use client'
import React, { useState, useEffect } from 'react'
import { FiUser, FiCamera, FiCheckCircle, FiXCircle, FiAlertTriangle, FiEye } from 'react-icons/fi'

const VerificationPanel = ({ attemptId, studentData }) => {
    const [verificationData, setVerificationData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showFullImage, setShowFullImage] = useState(null)

    useEffect(() => {
        if (attemptId) {
            fetchVerificationData()
            // Refresh every 30 seconds for periodic checks
            const interval = setInterval(fetchVerificationData, 30000)
            return () => clearInterval(interval)
        }
    }, [attemptId])

    const fetchVerificationData = async () => {
        try {
            const response = await fetch(`/api/exam-attempts/verification?attemptId=${attemptId}`)
            const data = await response.json()

            if (data.success) {
                setVerificationData(data.data)
                }
        } catch (error) {
            console.error('Error fetching verification data:', error)
        } finally {
            setLoading(false)
        }
    }

    const renderVerificationStatus = (verified, label) => {
        if (verified === undefined || verified === null) {
            return (
                <span className="badge bg-secondary">
                    <FiAlertTriangle className="me-1" size={12} />
                    Not Available
                </span>
            )
        }

        return verified ? (
            <span className="badge bg-success">
                <FiCheckCircle className="me-1" size={12} />
                {label} Verified
            </span>
        ) : (
            <span className="badge bg-danger">
                <FiXCircle className="me-1" size={12} />
                {label} Failed
            </span>
        )
    }

    if (loading) {
        return (
            <div className="verification-panel card">
                <div className="card-body text-center py-4">
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-muted mt-2 mb-0 small">Loading verification data...</p>
                </div>
            </div>
        )
    }

    if (!verificationData?.verification) {
        return (
            <div className="verification-panel card">
                <div className="card-body text-center py-4">
                    <FiAlertTriangle size={30} className="text-muted mb-2" />
                    <p className="text-muted mb-0 small">No verification data available</p>
                    {verificationData && (
                        <details className="mt-2">
                            <summary className="text-muted small" style={{ cursor: 'pointer' }}>Debug Info</summary>
                            <pre className="text-start mt-2 small" style={{ maxHeight: '200px', overflow: 'auto' }}>
                                {JSON.stringify(verificationData, null, 2)}
                            </pre>
                        </details>
                    )}
                </div>
            </div>
        )
    }

    const { faceVerification, identityVerification } = verificationData.verification

    return (
        <div className="verification-panel">
            <div className="card mb-3">
                <div className="card-header bg-primary text-white">
                    <h6 className="mb-0">
                        <FiEye className="me-2" />
                        Verification Status
                    </h6>
                </div>
                <div className="card-body">
                    {/* Student Info */}
                    <div className="d-flex align-items-center mb-3 pb-3 border-bottom">
                        <img
                            src={studentData?.userPhoto || studentData?.profileImage || verificationData.user?.profileImage || '/images/profile/default-avatar.svg'}
                            alt={verificationData.user?.name}
                            className="rounded-circle border me-3"
                            style={{ 
                                width: '50px', 
                                height: '50px', 
                                objectFit: 'cover',
                                backgroundColor: '#f8f9fa'
                            }}
                            onError={(e) => {
                                e.target.src = '/images/profile/default-avatar.svg';
                            }}
                        />
                        <div>
                            <h6 className="mb-0">{verificationData.user?.name}</h6>
                            <small className="text-muted">{verificationData.user?.email}</small>
                        </div>
                    </div>

                    {/* Identity Verification */}
                    {identityVerification?.enabled && (
                        <div className="verification-section mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <div className="d-flex align-items-center">
                                    <FiUser className="me-2 text-primary" />
                                    <strong>Identity Verification</strong>
                                </div>
                                {renderVerificationStatus(identityVerification.verified, 'Identity')}
                            </div>

                            {identityVerification.identityImage && (
                                <div className="identity-image-container mt-2">
                                    <p className="small text-muted mb-2">
                                        Document Type: <span className="badge bg-info">{identityVerification.documentType}</span>
                                    </p>
                                    <div 
                                        className="position-relative cursor-pointer"
                                        onClick={() => setShowFullImage({
                                            src: identityVerification.identityImage,
                                            title: 'Identity Document'
                                        })}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <img
                                            src={identityVerification.identityImage}
                                            alt="Identity"
                                            className="img-thumbnail"
                                            style={{ width: '100%', maxHeight: '150px', objectFit: 'cover' }}
                                        />
                                        <div className="position-absolute top-50 start-50 translate-middle">
                                            <span className="badge bg-dark bg-opacity-75">
                                                <FiEye className="me-1" /> Click to view
                                            </span>
                                        </div>
                                    </div>
                                    {identityVerification.verifiedAt && (
                                        <small className="text-muted d-block mt-1">
                                            Verified: {new Date(identityVerification.verifiedAt).toLocaleString()}
                                        </small>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Face Verification */}
                    {faceVerification?.enabled && (
                        <div className="verification-section">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <div className="d-flex align-items-center">
                                    <FiCamera className="me-2 text-primary" />
                                    <strong>Face Verification</strong>
                                </div>
                                {renderVerificationStatus(faceVerification.verified, 'Face')}
                            </div>

                            {faceVerification.selfieImage && (
                                <div className="face-image-container mt-2">
                                    {faceVerification.verificationScore && (
                                        <p className="small text-muted mb-2">
                                            Confidence Score: 
                                            <span className="badge bg-success ms-2">
                                                {(faceVerification.verificationScore * 100).toFixed(1)}%
                                            </span>
                                        </p>
                                    )}
                                    <div 
                                        className="position-relative cursor-pointer"
                                        onClick={() => setShowFullImage({
                                            src: faceVerification.selfieImage,
                                            title: 'Face Selfie'
                                        })}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <img
                                            src={faceVerification.selfieImage}
                                            alt="Face"
                                            className="img-thumbnail"
                                            style={{ width: '100%', maxHeight: '150px', objectFit: 'cover' }}
                                        />
                                        <div className="position-absolute top-50 start-50 translate-middle">
                                            <span className="badge bg-dark bg-opacity-75">
                                                <FiEye className="me-1" /> Click to view
                                            </span>
                                        </div>
                                    </div>
                                    {faceVerification.capturedAt && (
                                        <small className="text-muted d-block mt-1">
                                            Captured: {new Date(faceVerification.capturedAt).toLocaleString()}
                                        </small>
                                    )}
                                </div>
                            )}

                            {/* Periodic Checks */}
                            {faceVerification.periodicChecks && faceVerification.periodicChecks.length > 0 && (
                                <div className="periodic-checks mt-3">
                                    <h6 className="small fw-bold mb-2">Periodic Face Checks ({faceVerification.periodicChecks.length})</h6>
                                    <div className="checks-timeline" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                        {faceVerification.periodicChecks.map((check, index) => (
                                            <div key={index} className="check-item d-flex align-items-start mb-2 p-2 bg-light rounded">
                                                <img
                                                    src={check.selfieImage}
                                                    alt={`Check ${index + 1}`}
                                                    className="rounded me-2"
                                                    style={{ width: '40px', height: '40px', objectFit: 'cover', cursor: 'pointer' }}
                                                    onClick={() => setShowFullImage({
                                                        src: check.selfieImage,
                                                        title: `Periodic Check #${index + 1}`
                                                    })}
                                                />
                                                <div className="flex-grow-1">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <small className="fw-semibold">Check #{index + 1}</small>
                                                        {check.warning ? (
                                                            <span className="badge bg-danger badge-sm">
                                                                <FiAlertTriangle size={10} /> Warning
                                                            </span>
                                                        ) : (
                                                            <span className="badge bg-success badge-sm">
                                                                <FiCheckCircle size={10} /> OK
                                                            </span>
                                                        )}
                                                    </div>
                                                    <small className="text-muted d-block">
                                                        {new Date(check.capturedAt).toLocaleTimeString()}
                                                    </small>
                                                    {check.verificationScore && (
                                                        <small className="text-muted">
                                                            Score: {(check.verificationScore * 100).toFixed(1)}%
                                                        </small>
                                                    )}
                                                    {check.warning && check.warningReason && (
                                                        <small className="text-danger d-block">
                                                            {check.warningReason}
                                                        </small>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Warnings */}
                    {verificationData.warnings && verificationData.warnings.length > 0 && (
                        <div className="warnings-section mt-3 pt-3 border-top">
                            <h6 className="small fw-bold text-danger mb-2">
                                <FiAlertTriangle className="me-1" />
                                Warnings ({verificationData.warnings.length})
                            </h6>
                            <div className="warnings-list" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                {verificationData.warnings.map((warning, index) => (
                                    <div key={index} className="alert alert-warning alert-sm py-2 px-3 mb-2">
                                        <small>
                                            <strong>{warning.type}:</strong> {warning.message}
                                            <br />
                                            <span className="text-muted">
                                                {new Date(warning.sentAt).toLocaleString()}
                                            </span>
                                        </small>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Full Image Modal */}
            {showFullImage && (
                <div 
                    className="modal d-block" 
                    style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
                    onClick={() => setShowFullImage(null)}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{showFullImage.title}</h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setShowFullImage(null)}
                                ></button>
                            </div>
                            <div className="modal-body text-center">
                                <img 
                                    src={showFullImage.src} 
                                    alt={showFullImage.title}
                                    className="img-fluid"
                                    style={{ maxHeight: '70vh' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default VerificationPanel
