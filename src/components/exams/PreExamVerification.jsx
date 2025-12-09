'use client'
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import FaceVerification from './FaceVerification'
import IdentityVerification from './IdentityVerification'
import { FiAlertTriangle, FiCheckCircle, FiXCircle } from 'react-icons/fi'
import { toast } from 'react-toastify'

const PreExamVerification = ({ exam, onVerificationComplete, onCancel }) => {
    const { user } = useAuth()
    const [currentStep, setCurrentStep] = useState(1)
    const [verificationData, setVerificationData] = useState({
        faceVerification: null,
        identityVerification: null
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const faceVerificationEnabled = exam?.settings?.faceVerification?.enabled
    const faceVerificationRequired = exam?.settings?.faceVerification?.required
    const identityVerificationEnabled = exam?.settings?.identityVerification?.enabled
    const identityVerificationRequired = exam?.settings?.identityVerification?.required
    const useProfileImage = exam?.settings?.identityVerification?.useProfileImage

    // Determine total steps
    const totalSteps = (identityVerificationEnabled ? 1 : 0) + (faceVerificationEnabled ? 1 : 0)

    useEffect(() => {
        // If identity verification is enabled, start with it; otherwise, start with face verification
        if (identityVerificationEnabled) {
            setCurrentStep(1)
        } else if (faceVerificationEnabled) {
            setCurrentStep(2)
        }
    }, [identityVerificationEnabled, faceVerificationEnabled])

    const handleIdentityVerificationComplete = (data) => {
        setVerificationData(prev => ({
            ...prev,
            identityVerification: data
        }))

        // Check if identity verification failed and is required
        if (identityVerificationRequired && !data.verified && !data.skipped) {
            toast.error('Identity verification is required to proceed with this exam')
            return
        }

        // Move to face verification if enabled
        if (faceVerificationEnabled) {
            setCurrentStep(2)
        } else {
            // Complete verification process
            completeVerification({ identityVerification: data })
        }
    }

    const handleFaceVerificationComplete = (data) => {
        setVerificationData(prev => ({
            ...prev,
            faceVerification: data
        }))

        // Check if face verification failed and is required
        if (faceVerificationRequired && !data.verified && !data.skipped) {
            toast.error('Face verification is required to proceed with this exam')
            return
        }

        // Complete verification process
        completeVerification({ 
            ...verificationData, 
            faceVerification: data 
        })
    }

    const completeVerification = async (finalData) => {
        setIsSubmitting(true)

        try {
            // Check authorization
            const faceVerified = finalData.faceVerification?.verified
            const identityVerified = finalData.identityVerification?.verified
            
            let isAuthorized = true
            let unauthorizedReason = null

            // Check if face verification was required and failed
            if (faceVerificationRequired && !faceVerified) {
                isAuthorized = false
                unauthorizedReason = 'Face verification failed or was not completed'
            }

            // Check if identity verification was required and failed
            if (identityVerificationRequired && !identityVerified) {
                isAuthorized = false
                unauthorizedReason = 'Identity verification failed or was not completed'
            }

            // Save verification data to backend
            const response = await fetch('/api/exam-attempts/verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    examId: exam._id,
                    userId: user._id,
                    verification: {
                        faceVerification: {
                            enabled: faceVerificationEnabled,
                            verified: faceVerified || false,
                            selfieImage: finalData.faceVerification?.faceImage || finalData.faceVerification?.selfieImage,
                            capturedAt: finalData.faceVerification?.capturedAt || finalData.faceVerification?.verifiedAt,
                            verificationScore: finalData.faceVerification?.verificationScore
                        },
                        identityVerification: {
                            enabled: identityVerificationEnabled,
                            verified: identityVerified || false,
                            identityImage: finalData.identityVerification?.idCardImage || finalData.identityVerification?.identityImage,
                            verifiedAt: finalData.identityVerification?.verifiedAt,
                            documentType: finalData.identityVerification?.documentType
                        }
                    },
                    isAuthorized,
                    unauthorizedReason
                })
            })

            const result = await response.json()

            if (!isAuthorized) {
                toast.error('Student not authorized: ' + unauthorizedReason)
                // Show unauthorized modal
                showUnauthorizedModal(unauthorizedReason)
                return
            }

            if (result.success) {
                toast.success('Verification completed successfully!')
                onVerificationComplete({
                    ...finalData,
                    isAuthorized,
                    verificationId: result.verificationId
                })
            } else {
                toast.error(result.message || 'Failed to save verification data')
            }
        } catch (error) {
            console.error('Verification submission error:', error)
            toast.error('Failed to complete verification process')
        } finally {
            setIsSubmitting(false)
        }
    }

    const showUnauthorizedModal = (reason) => {
        // This will be shown as a modal/alert
        const shouldRetry = window.confirm(
            `Authorization Failed\n\n${reason}\n\nWould you like to retry the verification process?`
        )
        
        if (shouldRetry) {
            // Reset and restart
            setCurrentStep(identityVerificationEnabled ? 1 : 2)
            setVerificationData({
                faceVerification: null,
                identityVerification: null
            })
        } else {
            onCancel()
        }
    }

    if (isSubmitting) {
        return (
            <div className="verification-container">
                <div className="card">
                    <div className="card-body text-center py-5">
                        <div className="spinner-border text-primary mb-3" role="status">
                            <span className="visually-hidden">Processing...</span>
                        </div>
                        <h6>Processing Verification...</h6>
                        <p className="text-muted">Please wait while we verify your information.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="pre-exam-verification-container">
            <div className="verification-header mb-4">
                <div className="card bg-info text-white">
                    <div className="card-body">
                        <div className="d-flex align-items-center">
                            <FiAlertTriangle size={40} className="me-3" />
                            <div>
                                <h5 className="mb-1 text-white">Exam Verification Required</h5>
                                <p className="mb-0">
                                    Please complete the following verification steps before starting the exam: <strong>{exam?.name}</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="verification-steps mb-4">
                <div className="row">
                    {identityVerificationEnabled && (
                        <div className="col-md-6">
                            <div className={`step-card ${currentStep === 1 ? 'active' : ''} ${verificationData.identityVerification ? 'completed' : ''}`}>
                                <div className="d-flex align-items-center">
                                    <div className="step-number me-3">
                                        {verificationData.identityVerification?.verified ? (
                                            <FiCheckCircle size={24} className="text-success" />
                                        ) : (
                                            <span className="badge bg-primary rounded-circle" style={{width: '32px', height: '32px', lineHeight: '32px'}}>1</span>
                                        )}
                                    </div>
                                    <div>
                                        <h6 className="mb-0">Identity Verification</h6>
                                        <small className="text-muted">
                                            {identityVerificationRequired ? 'Required' : 'Optional'}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {faceVerificationEnabled && (
                        <div className="col-md-6">
                            <div className={`step-card ${currentStep === 2 ? 'active' : ''} ${verificationData.faceVerification ? 'completed' : ''}`}>
                                <div className="d-flex align-items-center">
                                    <div className="step-number me-3">
                                        {verificationData.faceVerification?.verified ? (
                                            <FiCheckCircle size={24} className="text-success" />
                                        ) : (
                                            <span className="badge bg-primary rounded-circle" style={{width: '32px', height: '32px', lineHeight: '32px'}}>
                                                {identityVerificationEnabled ? '2' : '1'}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <h6 className="mb-0">Face Verification</h6>
                                        <small className="text-muted">
                                            {faceVerificationRequired ? 'Required' : 'Optional'}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Verification Components */}
            <div className="verification-content">
                {currentStep === 1 && identityVerificationEnabled && (
                    <IdentityVerification
                        onVerificationComplete={handleIdentityVerificationComplete}
                        userProfileImage={user?.profileImage}
                        userName={user?.name}
                        useProfileImage={useProfileImage}
                        required={identityVerificationRequired}
                    />
                )}

                {currentStep === 2 && faceVerificationEnabled && (
                    <FaceVerification
                        onVerificationComplete={handleFaceVerificationComplete}
                        profileImage={verificationData.identityVerification?.identityImage || user?.profileImage}
                        required={faceVerificationRequired}
                    />
                )}
            </div>

            {/* Cancel Button */}
            <div className="text-center mt-4">
                <button 
                    className="btn btn-outline-secondary"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    Cancel and Exit
                </button>
            </div>

            <style jsx>{`
                .step-card {
                    padding: 1rem;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    transition: all 0.3s ease;
                }
                .step-card.active {
                    border-color: var(--bs-primary);
                    background-color: rgba(13, 110, 253, 0.05);
                }
                .step-card.completed {
                    border-color: var(--bs-success);
                    background-color: rgba(25, 135, 84, 0.05);
                }
            `}</style>
        </div>
    )
}

export default PreExamVerification
