'use client'
import React, { useState, useEffect } from 'react'
import { FiEye, FiEyeOff, FiInfo, FiExternalLink, FiCheck, FiX } from 'react-icons/fi'
import Image from 'next/image'
import Swal from 'sweetalert2'

const IntegrationsSettings = () => {
    const [formData, setFormData] = useState({
        googleOAuth: {
            enabled: false,
            clientId: '',
            clientSecret: ''
        },
        recaptcha: {
            enabled: false,
            siteKey: '',
            secretKey: ''
        },
        cloudinary: {
            enabled: false,
            cloudName: '',
            apiKey: '',
            apiSecret: '',
            folder: 'exam-portal'
        }
    })

    const [loading, setLoading] = useState({
        save: false,
        testOAuth: false,
        testRecaptcha: false,
        testCloudinary: false
    })

    const [showSecrets, setShowSecrets] = useState({
        clientSecret: false,
        secretKey: false,
        apiSecret: false
    })

    // Load settings on component mount
    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/settings')
            const data = await response.json()
            if (data.success && data.data.integrations) {
                console.log('Loaded integrations settings:', data.data.integrations)
                setFormData(prev => ({
                    ...prev,
                    ...data.data.integrations
                }))
            } else {
                console.log('No integrations settings found in database')
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error)
        }
    }

    const handleInputChange = (section, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }))
    }

    const handleToggle = (section) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                enabled: !prev[section].enabled
            }
        }))
    }

    const validateGoogleOAuth = () => {
        const { clientId, clientSecret } = formData.googleOAuth
        if (!clientId || !clientSecret) {
            Swal.fire({
                icon: 'error',
                title: 'Missing Configuration',
                text: 'Please provide both Client ID and Client Secret for Google OAuth',
                timer: 3000
            })
            return false
        }
        return true
    }

    const validateRecaptcha = () => {
        const { siteKey, secretKey } = formData.recaptcha
        if (!siteKey || !secretKey) {
            Swal.fire({
                icon: 'error',
                title: 'Missing Configuration',
                text: 'Please provide both Site Key and Secret Key for reCAPTCHA',
                timer: 3000
            })
            return false
        }
        return true
    }

    const testGoogleOAuth = async () => {
        if (!validateGoogleOAuth()) return

        setLoading(prev => ({ ...prev, testOAuth: true }))
        try {
            const response = await fetch('/api/integrations/test-google-oauth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData.googleOAuth)
            })
            const result = await response.json()

            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Google OAuth Test Successful!',
                    text: 'Configuration is working correctly',
                    timer: 2000
                })
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Google OAuth Test Failed',
                    text: result.message || 'Invalid configuration',
                    timer: 3000
                })
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Test Failed',
                text: 'Unable to test Google OAuth configuration',
                timer: 2000
            })
        }
        setLoading(prev => ({ ...prev, testOAuth: false }))
    }

    const testRecaptcha = async () => {
        if (!validateRecaptcha()) return

        setLoading(prev => ({ ...prev, testRecaptcha: true }))
        try {
            const response = await fetch('/api/integrations/test-recaptcha', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData.recaptcha)
            })
            const result = await response.json()

            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'reCAPTCHA Test Successful!',
                    text: 'Configuration is working correctly',
                    timer: 2000
                })
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'reCAPTCHA Test Failed',
                    text: result.message || 'Invalid configuration',
                    timer: 3000
                })
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Test Failed',
                text: 'Unable to test reCAPTCHA configuration',
                timer: 2000
            })
        }
        setLoading(prev => ({ ...prev, testRecaptcha: false }))
    }

    const testCloudinary = async () => {
        const { cloudName, apiKey, apiSecret } = formData.cloudinary
        if (!cloudName || !apiKey || !apiSecret) {
            Swal.fire({
                icon: 'error',
                title: 'Missing Configuration',
                text: 'Please fill in all Cloudinary credentials',
                timer: 2000
            })
            return
        }

        setLoading(prev => ({ ...prev, testCloudinary: true }))
        try {
            const response = await fetch('/api/integrations/test-cloudinary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData.cloudinary)
            })
            const result = await response.json()

            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Cloudinary Test Successful!',
                    html: `
                        <p>Configuration is working correctly</p>
                        <small>Cloud: ${cloudName}</small>
                    `,
                    timer: 3000
                })
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Cloudinary Test Failed',
                    text: result.message || 'Invalid configuration',
                    timer: 3000
                })
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Test Failed',
                text: 'Unable to test Cloudinary configuration',
                timer: 2000
            })
        }
        setLoading(prev => ({ ...prev, testCloudinary: false }))
    }

    const showHowToModal = (type) => {
        let content = ''
        
        if (type === 'oauth') {
            content = `
                <div style="text-align: left; line-height: 1.6;">
                    <h4 style="color: #667eea; margin-bottom: 15px;">Google OAuth Setup Steps:</h4>
                    <ol style="padding-left: 20px;">
                        <li style="margin-bottom: 10px;">Go to <a href="https://console.developers.google.com" target="_blank" style="color: #667eea;">Google Developer Console</a></li>
                        <li style="margin-bottom: 10px;">Create a new project or select existing</li>
                        <li style="margin-bottom: 10px;">Enable Google+ API</li>
                        <li style="margin-bottom: 10px;">Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"</li>
                        <li style="margin-bottom: 10px;">Set Application Type as "Web Application"</li>
                        <li style="margin-bottom: 10px;">Add authorized origins: <code style="background: #f5f5f5; padding: 2px 6px;">http://localhost:3000</code></li>
                        <li style="margin-bottom: 10px;">Add redirect URIs: <code style="background: #f5f5f5; padding: 2px 6px;">http://localhost:3000</code></li>
                        <li style="margin-bottom: 10px;">Copy Client ID and Client Secret</li>
                        <li style="margin-bottom: 10px;">Paste them in the form above</li>
                    </ol>
                    <p style="margin-top: 15px; color: #666;"><strong>Note:</strong> For production, replace localhost with your actual domain.</p>
                </div>
            `
        } else if (type === 'recaptcha') {
            content = `
                <div style="text-align: left; line-height: 1.6;">
                    <h4 style="color: #667eea; margin-bottom: 15px;">Google reCAPTCHA v3 Setup Steps:</h4>
                    <ol style="padding-left: 20px;">
                        <li style="margin-bottom: 10px;">Go to <a href="https://www.google.com/recaptcha/admin" target="_blank" style="color: #667eea;">Google reCAPTCHA Admin</a></li>
                        <li style="margin-bottom: 10px;">Click "+" to create a new site</li>
                        <li style="margin-bottom: 10px;">Enter a Label for your site</li>
                        <li style="margin-bottom: 10px;">Select <strong>reCAPTCHA v3</strong> (not v2 with images)</li>
                        <li style="margin-bottom: 10px;">Add domains: <code style="background: #f5f5f5; padding: 2px 6px;">localhost</code> and your production domain</li>
                        <li style="margin-bottom: 10px;">Accept Terms of Service</li>
                        <li style="margin-bottom: 10px;">Click "Submit"</li>
                        <li style="margin-bottom: 10px;">Copy Site Key and Secret Key</li>
                        <li style="margin-bottom: 10px;">Paste them in the form above</li>
                    </ol>
                    <p style="margin-top: 15px; color: #666;"><strong>Note:</strong> reCAPTCHA v3 works invisibly in the background without showing puzzles to users.</p>
                </div>
            `
        }

        Swal.fire({
            html: content,
            width: '600px',
            showCloseButton: true,
            showConfirmButton: false,
            customClass: {
                popup: 'swal-wide'
            }
        })
    }

    const saveSettings = async () => {
        setLoading(prev => ({ ...prev, save: true }))
        
        try {
            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tab: 'integrations',
                    data: formData
                })
            })

            const result = await response.json()
            
            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Settings Saved!',
                    text: 'Integration settings updated successfully',
                    timer: 2000
                })
            } else {
                throw new Error(result.message || 'Failed to save settings')
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Save Failed',
                text: error.message || 'Failed to save integration settings',
                timer: 2000
            })
        }

        setLoading(prev => ({ ...prev, save: false }))
    }

    return (
        <div className="row">
            <div className="col-12">
                <div className="card">
                    <div className="card-header">
                        <h5 className="card-title mb-0">Integration Settings</h5>
                    </div>
                    <div className="card-body">
                        
                        {/* Google OAuth Section */}
                        <div className="mb-5">
                            <div className="d-flex align-items-center justify-content-between mb-4">
                                <div className="d-flex align-items-center">
                                    <Image 
                                        src="https://www.gstatic.com/marketing-cms/assets/images/5b/b0/3a62c7b4486e943fceeeb3fe90df/g-about-gatg.png=n-w128-h131-fcrop64=1,000005f5ffffffff-rw" 
                                        alt="Google" 
                                        width={32} 
                                        height={32} 
                                        className="me-2"
                                    />
                                    <h6 className="mb-0 me-3">Google OAuth Login</h6>
                                    <div className="form-check form-switch">
                                        <input 
                                            className="form-check-input" 
                                            type="checkbox" 
                                            checked={formData.googleOAuth.enabled}
                                            onChange={() => handleToggle('googleOAuth')}
                                        />
                                        <label className="form-check-label">
                                            {formData.googleOAuth.enabled ? (
                                                <span className="text-success d-flex align-items-center">
                                                    <FiCheck className="me-1" /> Enabled
                                                </span>
                                            ) : (
                                                <span className="text-muted d-flex align-items-center">
                                                    <FiX className="me-1" /> Disabled
                                                </span>
                                            )}
                                        </label>
                                    </div>
                                </div>
                                <button 
                                    type="button" 
                                    className="btn btn-outline-info btn-sm"
                                    onClick={() => showHowToModal('oauth')}
                                >
                                    <FiInfo className="me-1" /> How to Setup
                                </button>
                            </div>

                            <div className="row">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label">Google Client ID</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.googleOAuth.clientId}
                                            onChange={(e) => handleInputChange('googleOAuth', 'clientId', e.target.value)}
                                            placeholder="Your Google OAuth Client ID"
                                            disabled={!formData.googleOAuth.enabled}
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label">Google Client Secret</label>
                                        <div className="input-group">
                                            <input
                                                type={showSecrets.clientSecret ? "text" : "password"}
                                                className="form-control"
                                                value={formData.googleOAuth.clientSecret}
                                                onChange={(e) => handleInputChange('googleOAuth', 'clientSecret', e.target.value)}
                                                placeholder="Your Google OAuth Client Secret"
                                                disabled={!formData.googleOAuth.enabled}
                                            />
                                            <button
                                                className="btn btn-outline-secondary"
                                                type="button"
                                                onClick={() => setShowSecrets(prev => ({
                                                    ...prev, 
                                                    clientSecret: !prev.clientSecret
                                                }))}
                                                disabled={!formData.googleOAuth.enabled}
                                            >
                                                {showSecrets.clientSecret ? <FiEyeOff /> : <FiEye />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {formData.googleOAuth.enabled && (
                                <div className="d-flex gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={testGoogleOAuth}
                                        disabled={loading.testOAuth}
                                    >
                                        {loading.testOAuth ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-1"></span>
                                                Testing...
                                            </>
                                        ) : (
                                            <>
                                                <FiExternalLink className="me-1" /> Test Configuration
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        <hr />

                        {/* Google reCAPTCHA Section */}
                        <div className="mb-5">
                            <div className="d-flex align-items-center justify-content-between mb-4">
                                <div className="d-flex align-items-center">
                                    <Image 
                                        src="https://www.gstatic.com/images/icons/material/product/2x/recaptcha_48dp.png" 
                                        alt="reCAPTCHA" 
                                        width={30} 
                                        height={30} 
                                        className="me-2"
                                    />
                                    <h6 className="mb-0 me-3">Google reCAPTCHA v3</h6>
                                    <div className="form-check form-switch">
                                        <input 
                                            className="form-check-input" 
                                            type="checkbox" 
                                            checked={formData.recaptcha.enabled}
                                            onChange={() => handleToggle('recaptcha')}
                                        />
                                        <label className="form-check-label">
                                            {formData.recaptcha.enabled ? (
                                                <span className="text-success d-flex align-items-center">
                                                    <FiCheck className="me-1" /> Enabled
                                                </span>
                                            ) : (
                                                <span className="text-muted d-flex align-items-center">
                                                    <FiX className="me-1" /> Disabled
                                                </span>
                                            )}
                                        </label>
                                    </div>
                                </div>
                                <button 
                                    type="button" 
                                    className="btn btn-outline-info btn-sm"
                                    onClick={() => showHowToModal('recaptcha')}
                                >
                                    <FiInfo className="me-1" /> How to Setup
                                </button>
                            </div>

                            <div className="alert alert-info">
                                <FiInfo className="me-2" />
                                <strong>reCAPTCHA v3:</strong> Works invisibly in the background without showing puzzles to users. Provides bot protection globally across all pages.
                            </div>

                            <div className="row">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label">Site Key (Public)</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.recaptcha.siteKey}
                                            onChange={(e) => handleInputChange('recaptcha', 'siteKey', e.target.value)}
                                            placeholder="Your reCAPTCHA Site Key"
                                            disabled={!formData.recaptcha.enabled}
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label">Secret Key (Private)</label>
                                        <div className="input-group">
                                            <input
                                                type={showSecrets.secretKey ? "text" : "password"}
                                                className="form-control"
                                                value={formData.recaptcha.secretKey}
                                                onChange={(e) => handleInputChange('recaptcha', 'secretKey', e.target.value)}
                                                placeholder="Your reCAPTCHA Secret Key"
                                                disabled={!formData.recaptcha.enabled}
                                            />
                                            <button
                                                className="btn btn-outline-secondary"
                                                type="button"
                                                onClick={() => setShowSecrets(prev => ({
                                                    ...prev, 
                                                    secretKey: !prev.secretKey
                                                }))}
                                                disabled={!formData.recaptcha.enabled}
                                            >
                                                {showSecrets.secretKey ? <FiEyeOff /> : <FiEye />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {formData.recaptcha.enabled && (
                                <div className="d-flex gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={testRecaptcha}
                                        disabled={loading.testRecaptcha}
                                    >
                                        {loading.testRecaptcha ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-1"></span>
                                                Testing...
                                            </>
                                        ) : (
                                            <>
                                                <FiExternalLink className="me-1" /> Test Configuration
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Cloudinary Section */}
                        <div className="mb-5">
                            <div className="d-flex align-items-center justify-content-between mb-4">
                                <div className="d-flex align-items-center">
                                    <Image 
                                        src="https://res.cloudinary.com/cloudinary-marketing/image/upload/v1/creative_staging/cloudinary_internal/Website_Assets/Brand_Assets/Logo/Cloudinary-Blue-Icon.png" 
                                        alt="Cloudinary" 
                                        width={32} 
                                        height={32} 
                                        className="me-2"
                                    />
                                    <h6 className="mb-0 me-3">Cloudinary Storage</h6>
                                    <div className="form-check form-switch">
                                        <input 
                                            className="form-check-input" 
                                            type="checkbox" 
                                            checked={formData.cloudinary.enabled}
                                            onChange={() => handleToggle('cloudinary')}
                                        />
                                        <label className="form-check-label">
                                            {formData.cloudinary.enabled ? (
                                                <span className="text-success d-flex align-items-center">
                                                    <FiCheck className="me-1" /> Enabled
                                                </span>
                                            ) : (
                                                <span className="text-muted d-flex align-items-center">
                                                    <FiX className="me-1" /> Disabled
                                                </span>
                                            )}
                                        </label>
                                    </div>
                                </div>
                                <a 
                                    href="https://cloudinary.com/console" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="btn btn-outline-info btn-sm"
                                >
                                    <FiExternalLink className="me-1" /> Get Credentials
                                </a>
                            </div>

                            <div className="alert alert-info mb-3">
                                <FiInfo className="me-2" />
                                Cloudinary provides cloud storage for images, videos, and other files. When enabled, all file uploads will be stored in Cloudinary instead of local storage. This is required for production deployment.
                            </div>

                            <div className="row">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label">Cloud Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.cloudinary.cloudName}
                                            onChange={(e) => handleInputChange('cloudinary', 'cloudName', e.target.value)}
                                            placeholder="your-cloud-name"
                                            disabled={!formData.cloudinary.enabled}
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label">API Key</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.cloudinary.apiKey}
                                            onChange={(e) => handleInputChange('cloudinary', 'apiKey', e.target.value)}
                                            placeholder="123456789012345"
                                            disabled={!formData.cloudinary.enabled}
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label">API Secret</label>
                                        <div className="input-group">
                                            <input
                                                type={showSecrets.apiSecret ? "text" : "password"}
                                                className="form-control"
                                                value={formData.cloudinary.apiSecret}
                                                onChange={(e) => handleInputChange('cloudinary', 'apiSecret', e.target.value)}
                                                placeholder="Your API Secret"
                                                disabled={!formData.cloudinary.enabled}
                                            />
                                            <button
                                                className="btn btn-outline-secondary"
                                                type="button"
                                                onClick={() => setShowSecrets(prev => ({ ...prev, apiSecret: !prev.apiSecret }))}
                                                disabled={!formData.cloudinary.enabled}
                                            >
                                                {showSecrets.apiSecret ? <FiEyeOff /> : <FiEye />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label">Upload Folder (Optional)</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.cloudinary.folder}
                                            onChange={(e) => handleInputChange('cloudinary', 'folder', e.target.value)}
                                            placeholder="exam-portal"
                                            disabled={!formData.cloudinary.enabled}
                                        />
                                        <small className="text-muted">Files will be organized in this folder</small>
                                    </div>
                                </div>
                            </div>

                            {formData.cloudinary.enabled && (
                                <div className="d-flex gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={testCloudinary}
                                        disabled={loading.testCloudinary}
                                    >
                                        {loading.testCloudinary ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-1"></span>
                                                Testing...
                                            </>
                                        ) : (
                                            <>
                                                <FiExternalLink className="me-1" /> Test Connection
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Save Button */}
                        <div className="d-flex justify-content-end">
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={saveSettings}
                                disabled={loading.save}
                            >
                                {loading.save ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-1"></span>
                                        Saving...
                                    </>
                                ) : (
                                    'Save Integration Settings'
                                )}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}

export default IntegrationsSettings