'use client'
import React, { useState, useRef, useEffect } from 'react'
import { FiCheckCircle, FiUser, FiAlertCircle, FiCamera } from 'react-icons/fi'

const FaceVerification = ({ 
    onVerificationComplete, 
    required = false 
}) => {
    const [capturedFace, setCapturedFace] = useState(null)
    const [isCameraActive, setIsCameraActive] = useState(false)
    const [error, setError] = useState(null)
    const [isVerified, setIsVerified] = useState(false)
    
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const streamRef = useRef(null)

    // Start camera
    const startCamera = async () => {
        try {
            setIsCameraActive(true)
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user', width: 640, height: 480 } 
            })
            streamRef.current = stream
            
            // Wait for next tick to ensure video element is rendered
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                    videoRef.current.play().catch(err => {
                        console.error('Video play error:', err)
                    })
                    setError(null)
                }
            }, 100)
        } catch (err) {
            setError('Unable to access camera. Please check permissions.')
            console.error('Camera error:', err)
            setIsCameraActive(false)
        }
    }

    // Stop camera
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
        setIsCameraActive(false)
    }

    // Capture image from camera
    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current
            const video = videoRef.current
            
            // Check if video has valid dimensions
            if (video.videoWidth === 0 || video.videoHeight === 0) {
                setError('Camera not ready. Please wait a moment and try again.')
                return
            }
            
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            const ctx = canvas.getContext('2d')
            ctx.drawImage(video, 0, 0)
            const imageData = canvas.toDataURL('image/jpeg')
            
            setCapturedFace(imageData)
            stopCamera()
            setError(null)
        } else {
            setError('Camera not initialized properly. Please try again.')
        }
    }

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera()
        }
    }, [])

    const confirmVerification = () => {
        if (capturedFace) {
            setIsVerified(true)
            onVerificationComplete({
                verified: true,
                faceImage: capturedFace,
                documentType: 'face',
                verifiedAt: new Date().toISOString()
            })
        }
    }

    const skipVerification = () => {
        if (!required) {
            stopCamera()
            onVerificationComplete({
                verified: false,
                skipped: true,
                verifiedAt: new Date().toISOString()
            })
        }
    }

    const retakeFace = () => {
        setCapturedFace(null)
        setError(null)
        startCamera()
    }

    if (isVerified) {
        return (
            <div className="card">
                <div className="card-header">
                    <h5 className="card-title mb-0">
                        <FiUser className="me-2" />
                        Face Verification
                    </h5>
                </div>
                <div className="card-body">
                    <div className="alert alert-success d-flex align-items-center" role="alert">
                        <FiCheckCircle size={24} className="me-3" />
                        <div>
                            <h6 className="mb-1">Face Verified Successfully!</h6>
                            <small>Your face photo has been verified.</small>
                        </div>
                    </div>
                    <div className="text-center">
                        <h6 className="mb-2">Face Photo</h6>
                        <img 
                            src={capturedFace}
                            alt="Face verification"
                            className="img-thumbnail"
                            style={{ maxWidth: '300px', maxHeight: '300px' }}
                        />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="face-verification-container">
            <div className="card">
                <div className="card-header">
                    <h5 className="card-title mb-0">
                        <FiCamera className="me-2" />
                        Face Verification
                    </h5>
                </div>
                <div className="card-body">
                    <p className="text-muted mb-4 text-center">
                        Please capture your face photo for verification
                    </p>

                    {error && (
                        <div className="alert alert-danger" role="alert">
                            <FiAlertCircle className="me-2" />
                            {error}
                        </div>
                    )}

                    {/* Face Photo Card */}
                    <div className="verification-card mx-auto" style={{ maxWidth: '600px' }}>
                        <div className="verification-card-header">
                            <h6 className="mb-0 text-center">
                                <FiUser className="me-2" />
                                Face Photo
                            </h6>
                        </div>
                        <div className="verification-card-body">
                            {!capturedFace ? (
                                <div className="live-preview">
                                    {isCameraActive ? (
                                        <>
                                            <video 
                                                ref={videoRef} 
                                                autoPlay 
                                                playsInline
                                                className="camera-video-live"
                                            ></video>
                                            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                                        </>
                                    ) : (
                                        <div className="capture-placeholder">
                                            <FiCamera size={60} className="text-muted mb-3" />
                                            <p className="text-muted mb-3">Click to start camera</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="captured-preview">
                                    <img 
                                        src={capturedFace}
                                        alt="Captured face"
                                        className="img-fluid rounded"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="verification-card-footer">
                            {!capturedFace ? (
                                isCameraActive ? (
                                    <button 
                                        className="btn btn-success w-100"
                                        onClick={captureImage}
                                    >
                                        <FiCamera className="me-2" />
                                        Capture Image
                                    </button>
                                ) : (
                                    <button 
                                        className="btn btn-primary w-100"
                                        onClick={startCamera}
                                    >
                                        <FiCamera className="me-2" />
                                        Start Camera
                                    </button>
                                )
                            ) : (
                                <button 
                                    className="btn btn-outline-primary w-100"
                                    onClick={retakeFace}
                                >
                                    Retake Photo
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="text-center mt-4">
                        <button 
                            className="btn btn-outline-secondary btn-lg me-2"
                            onClick={() => window.history.back()}
                        >
                            Back
                        </button>
                        
                        <button 
                            className="btn btn-success btn-lg"
                            onClick={confirmVerification}
                            disabled={!capturedFace}
                        >
                            <FiCheckCircle className="me-2" />
                            Verify & Next
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .verification-card {
                    border: 2px solid #e9ecef;
                    border-radius: 12px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                .verification-card-header {
                    padding: 1rem;
                    background: #f8f9fa;
                    border-bottom: 1px solid #dee2e6;
                }
                .verification-card-body {
                    padding: 1rem;
                    min-height: 400px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #000;
                }
                .verification-card-footer {
                    padding: 1rem;
                    background: #f8f9fa;
                    border-top: 1px solid #dee2e6;
                }
                .capture-placeholder {
                    text-align: center;
                    width: 100%;
                    color: #6c757d;
                }
                .captured-preview {
                    text-align: center;
                    width: 100%;
                }
                .captured-preview img {
                    max-height: 350px;
                    width: 100%;
                    object-fit: contain;
                    border: 2px solid #dee2e6;
                }
                .live-preview {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .camera-video-live {
                    width: 100%;
                    height: 100%;
                    max-height: 400px;
                    object-fit: cover;
                    border-radius: 8px;
                }
            `}</style>
        </div>
    )
}

export default FaceVerification
