'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const PermissionChecker = ({ exam, onPermissionsGranted, onCancel }) => {
    const [permissions, setPermissions] = useState({
        camera: { granted: false, required: false, requesting: false },
        microphone: { granted: false, required: false, requesting: false },
        screen: { granted: false, required: false, requesting: false }
    })
    const [allPermissionsGranted, setAllPermissionsGranted] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    useEffect(() => {
        // Set required permissions based on exam settings
        setPermissions(prev => ({
            ...prev,
            camera: { ...prev.camera, required: exam.settings?.allowCam || false },
            microphone: { ...prev.microphone, required: exam.settings?.allowMic || false },
            screen: { ...prev.screen, required: exam.settings?.allowScreenShare || false }
        }))

        // Check existing permissions
        checkExistingPermissions()
    }, [exam])

    useEffect(() => {
        // Check if all required permissions are granted
        const requiredPermissions = Object.entries(permissions).filter(([_, perm]) => perm.required)
        const allGranted = requiredPermissions.every(([_, perm]) => perm.granted)
        setAllPermissionsGranted(allGranted)
    }, [permissions])

    const checkExistingPermissions = async () => {
        try {
            // Check camera permission
            if (exam.settings?.allowCam) {
                const cameraResult = await navigator.permissions.query({ name: 'camera' })
                setPermissions(prev => ({
                    ...prev,
                    camera: { ...prev.camera, granted: cameraResult.state === 'granted' }
                }))
            }

            // Check microphone permission
            if (exam.settings?.allowMic) {
                const micResult = await navigator.permissions.query({ name: 'microphone' })
                setPermissions(prev => ({
                    ...prev,
                    microphone: { ...prev.microphone, granted: micResult.state === 'granted' }
                }))
            }
        } catch (error) {
            }
    }

    const requestCameraPermission = async () => {
        setPermissions(prev => ({
            ...prev,
            camera: { ...prev.camera, requesting: true }
        }))

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true })
            stream.getTracks().forEach(track => track.stop()) // Stop immediately after getting permission
            
            setPermissions(prev => ({
                ...prev,
                camera: { ...prev.camera, granted: true, requesting: false }
            }))
            setError('')
        } catch (err) {
            setError('Camera permission denied. Please enable camera access to continue.')
            setPermissions(prev => ({
                ...prev,
                camera: { ...prev.camera, granted: false, requesting: false }
            }))
        }
    }

    const requestMicrophonePermission = async () => {
        setPermissions(prev => ({
            ...prev,
            microphone: { ...prev.microphone, requesting: true }
        }))

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            stream.getTracks().forEach(track => track.stop()) // Stop immediately after getting permission
            
            setPermissions(prev => ({
                ...prev,
                microphone: { ...prev.microphone, granted: true, requesting: false }
            }))
            setError('')
        } catch (err) {
            setError('Microphone permission denied. Please enable microphone access to continue.')
            setPermissions(prev => ({
                ...prev,
                microphone: { ...prev.microphone, granted: false, requesting: false }
            }))
        }
    }

    const requestScreenPermission = async () => {
        setPermissions(prev => ({
            ...prev,
            screen: { ...prev.screen, requesting: true }
        }))

        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
            stream.getTracks().forEach(track => track.stop()) // Stop immediately after getting permission
            
            setPermissions(prev => ({
                ...prev,
                screen: { ...prev.screen, granted: true, requesting: false }
            }))
            setError('')
        } catch (err) {
            setError('Screen sharing permission denied. Please enable screen sharing to continue.')
            setPermissions(prev => ({
                ...prev,
                screen: { ...prev.screen, granted: false, requesting: false }
            }))
        }
    }

    const getPermissionIcon = (permType) => {
        const perm = permissions[permType]
        if (perm.requesting) return 'feather-loader spin'
        if (perm.granted) return 'feather-check-circle text-success'
        return 'feather-alert-circle text-warning'
    }

    const getPermissionStatus = (permType) => {
        const perm = permissions[permType]
        if (perm.requesting) return 'Requesting...'
        if (perm.granted) return 'Granted'
        return 'Required'
    }

    const handleProceedToExam = () => {
        if (allPermissionsGranted) {
            onPermissionsGranted()
        }
    }

    return (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title">
                            <i className="feather-shield me-2"></i>
                            Exam Permissions Required
                        </h5>
                    </div>
                    
                    <div className="modal-body">
                        <div className="alert alert-info">
                            <i className="feather-info me-2"></i>
                            <strong>{exam.name || exam.title}</strong> requires the following permissions for exam integrity and security.
                        </div>

                        {error && (
                            <div className="alert alert-danger">
                                <i className="feather-x-circle me-2"></i>
                                {error}
                            </div>
                        )}

                        <div className="row g-3">
                            {/* Camera Permission */}
                            {permissions.camera.required && (
                                <div className="col-12">
                                    <div className="card border">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div className="d-flex align-items-center">
                                                    <i className="feather-camera text-primary me-3" style={{ fontSize: '1.5rem' }}></i>
                                                    <div>
                                                        <h6 className="mb-1">Camera Access</h6>
                                                        <small className="text-muted">Required for exam proctoring and identity verification</small>
                                                    </div>
                                                </div>
                                                <div className="d-flex align-items-center">
                                                    <span className={`badge me-2 ${permissions.camera.granted ? 'bg-success' : 'bg-warning'}`}>
                                                        {getPermissionStatus('camera')}
                                                    </span>
                                                    {!permissions.camera.granted && (
                                                        <button 
                                                            className="btn btn-sm btn-primary"
                                                            onClick={requestCameraPermission}
                                                            disabled={permissions.camera.requesting}
                                                        >
                                                            {permissions.camera.requesting ? (
                                                                <i className="feather-loader spin me-1"></i>
                                                            ) : (
                                                                <i className="feather-video me-1"></i>
                                                            )}
                                                            Grant Access
                                                        </button>
                                                    )}
                                                    {permissions.camera.granted && (
                                                        <i className="feather-check-circle text-success" style={{ fontSize: '1.5rem' }}></i>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Microphone Permission */}
                            {permissions.microphone.required && (
                                <div className="col-12">
                                    <div className="card border">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div className="d-flex align-items-center">
                                                    <i className="feather-mic text-primary me-3" style={{ fontSize: '1.5rem' }}></i>
                                                    <div>
                                                        <h6 className="mb-1">Microphone Access</h6>
                                                        <small className="text-muted">Required for audio monitoring during the exam</small>
                                                    </div>
                                                </div>
                                                <div className="d-flex align-items-center">
                                                    <span className={`badge me-2 ${permissions.microphone.granted ? 'bg-success' : 'bg-warning'}`}>
                                                        {getPermissionStatus('microphone')}
                                                    </span>
                                                    {!permissions.microphone.granted && (
                                                        <button 
                                                            className="btn btn-sm btn-primary"
                                                            onClick={requestMicrophonePermission}
                                                            disabled={permissions.microphone.requesting}
                                                        >
                                                            {permissions.microphone.requesting ? (
                                                                <i className="feather-loader spin me-1"></i>
                                                            ) : (
                                                                <i className="feather-mic me-1"></i>
                                                            )}
                                                            Grant Access
                                                        </button>
                                                    )}
                                                    {permissions.microphone.granted && (
                                                        <i className="feather-check-circle text-success" style={{ fontSize: '1.5rem' }}></i>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Screen Share Permission */}
                            {permissions.screen.required && (
                                <div className="col-12">
                                    <div className="card border">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div className="d-flex align-items-center">
                                                    <i className="feather-monitor text-primary me-3" style={{ fontSize: '1.5rem' }}></i>
                                                    <div>
                                                        <h6 className="mb-1">Screen Sharing</h6>
                                                        <small className="text-muted">Required for screen monitoring and preventing cheating</small>
                                                    </div>
                                                </div>
                                                <div className="d-flex align-items-center">
                                                    <span className={`badge me-2 ${permissions.screen.granted ? 'bg-success' : 'bg-warning'}`}>
                                                        {getPermissionStatus('screen')}
                                                    </span>
                                                    {!permissions.screen.granted && (
                                                        <button 
                                                            className="btn btn-sm btn-primary"
                                                            onClick={requestScreenPermission}
                                                            disabled={permissions.screen.requesting}
                                                        >
                                                            {permissions.screen.requesting ? (
                                                                <i className="feather-loader spin me-1"></i>
                                                            ) : (
                                                                <i className="feather-share-2 me-1"></i>
                                                            )}
                                                            Grant Access
                                                        </button>
                                                    )}
                                                    {permissions.screen.granted && (
                                                        <i className="feather-check-circle text-success" style={{ fontSize: '1.5rem' }}></i>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Exam Restrictions */}
                        <div className="mt-4">
                            <h6 className="text-primary mb-3">
                                <i className="feather-alert-triangle me-2"></i>
                                Exam Restrictions
                            </h6>
                            <div className="row g-2">
                                {!exam.settings?.allowTabSwitch && (
                                    <div className="col-md-6">
                                        <div className="alert alert-warning py-2">
                                            <i className="feather-x-circle me-2"></i>
                                            <small>Tab switching is <strong>disabled</strong></small>
                                        </div>
                                    </div>
                                )}
                                {!exam.settings?.allowCopyPaste && (
                                    <div className="col-md-6">
                                        <div className="alert alert-warning py-2">
                                            <i className="feather-x-circle me-2"></i>
                                            <small>Copy/Paste is <strong>disabled</strong></small>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {allPermissionsGranted && (
                            <div className="alert alert-success mt-3">
                                <i className="feather-check-circle me-2"></i>
                                All required permissions have been granted. You can now proceed to the exam.
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button 
                            type="button" 
                            className="btn btn-secondary" 
                            onClick={onCancel}
                        >
                            <i className="feather-x me-1"></i>
                            Cancel
                        </button>
                        <button 
                            type="button" 
                            className={`btn ${allPermissionsGranted ? 'btn-success' : 'btn-primary'}`}
                            onClick={handleProceedToExam}
                            disabled={!allPermissionsGranted}
                        >
                            {allPermissionsGranted ? (
                                <>
                                    <i className="feather-arrow-right me-1"></i>
                                    Start Exam
                                </>
                            ) : (
                                <>
                                    <i className="feather-shield me-1"></i>
                                    Grant Permissions First
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PermissionChecker