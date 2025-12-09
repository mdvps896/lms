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
<svg xmlns="http://www.w3.org/2000/svg" width="156" height="30" version="1.1" viewBox="0 0 500 96.77">
<desc>American digital media management company</desc>
 <path d="M160.53 30.41a17.14 17.14 0 0 1 13.56 6.7.69.69 0 0 0 1 .11l5.71-4.55a.71.71 0 0 0 .11-1 26 26 0 0 0-20.61-10.13c-14.91 0-27 12.85-27 28.65s12.13 28.65 27 28.65a25.85 25.85 0 0 0 20.6-10.12.69.69 0 0 0-.12-1l-5.7-4.5a.71.71 0 0 0-1 .11A17.26 17.26 0 0 1 160.53 70c-10.19 0-18.16-8.7-18.16-19.79s7.97-19.8 18.16-19.8ZM188.27 19.91h7.16a.71.71 0 0 1 .71.71V77.4a.7.7 0 0 1-.7.7h-7.16a.71.71 0 0 1-.71-.71V20.62a.7.7 0 0 1 .7-.71ZM220.54 39.55c-9.49 0-19.09 6.72-19.09 19.57 0 11.29 8.21 19.81 19.09 19.81s19.17-8.52 19.17-19.81-8.24-19.57-19.17-19.57Zm10.53 19.57c0 6.52-4.53 11.44-10.53 11.44s-10.44-4.92-10.44-11.44 4.49-11.2 10.44-11.2 10.53 4.81 10.53 11.2ZM278.3 40.37h-7.16a.7.7 0 0 0-.71.7v19c0 7.42-5.12 10.05-9.51 10.05-3.88 0-7.79-2.93-7.79-9.48V41.07a.7.7 0 0 0-.71-.7h-7.16a.7.7 0 0 0-.7.7v20.5c0 11.25 5.09 17.44 14.34 17.44 3.36 0 8.8-1.93 10.84-6.19l.69.14v4.44a.71.71 0 0 0 .71.71h7.16a.71.71 0 0 0 .71-.71V41.07a.7.7 0 0 0-.71-.7ZM322.27 19.91h-7.17a.7.7 0 0 0-.7.71V46l-.44-.7c-2.18-3.51-6.87-5.78-11.95-5.78-8.76 0-17.62 6.75-17.62 19.65 0 11.25 7.61 19.73 17.69 19.73 3.84 0 9.25-1.54 11.88-5.86l.44-.72v5.08a.7.7 0 0 0 .7.71h7.17a.7.7 0 0 0 .7-.71V20.62a.7.7 0 0 0-.7-.71Zm-8 39.21a11 11 0 0 1-10.75 11.36c-5.86 0-10.45-5-10.45-11.36s4.59-11.2 10.45-11.2a11 11 0 0 1 10.72 11.2ZM333 40.37h7.16a.7.7 0 0 1 .7.7V77.4a.7.7 0 0 1-.7.7H333a.71.71 0 0 1-.71-.71V41.07a.71.71 0 0 1 .71-.7ZM336.61 21.06a5.57 5.57 0 0 0-5.69 5.57 5.64 5.64 0 0 0 5.69 5.58 5.54 5.54 0 0 0 5.61-5.58 5.48 5.48 0 0 0-5.61-5.57ZM370.35 39.55c-3.14 0-8.72 1.69-10.85 6.19l-.69-.14v-4.53a.7.7 0 0 0-.71-.7h-7.16a.7.7 0 0 0-.7.7V77.4a.7.7 0 0 0 .7.71h7.16a.71.71 0 0 0 .71-.71v-19c0-7.36 5.12-10 9.51-10 3.88 0 7.79 2.91 7.79 9.4v19.6a.71.71 0 0 0 .71.71H384a.71.71 0 0 0 .71-.71V56.91c-.02-11.19-5.12-17.36-14.36-17.36ZM427.48 40.37h-7.16a.7.7 0 0 0-.71.7v5l-.43-.7c-2.19-3.51-6.88-5.78-12-5.78-8.75 0-17.62 6.75-17.62 19.65 0 11.25 7.61 19.73 17.7 19.73 3.83 0 9.24-1.54 11.88-5.86l.43-.72v5.01a.71.71 0 0 0 .71.71h7.16a.7.7 0 0 0 .7-.71V41.07a.7.7 0 0 0-.66-.7Zm-8 18.75a11 11 0 0 1-10.78 11.36c-5.86 0-10.44-5-10.44-11.36s4.58-11.2 10.44-11.2a11 11 0 0 1 10.76 11.2ZM460.15 40.5a13.66 13.66 0 0 0-5.14-1c-4.76 0-8.22 2.85-10 8.25l-.64-.09v-6.59a.7.7 0 0 0-.71-.7h-7.16a.7.7 0 0 0-.71.7V77.4a.71.71 0 0 0 .71.71h7.24a.7.7 0 0 0 .7-.71V65c0-14.8 5.91-17 9.44-17a11 11 0 0 1 4.33.9.72.72 0 0 0 .61 0 .7.7 0 0 0 .36-.48l1.42-7.11a.71.71 0 0 0-.45-.81ZM499.88 40.68a.69.69 0 0 0-.59-.31h-7.71a.72.72 0 0 0-.66.45L481.59 65l-9.42-24.18a.72.72 0 0 0-.66-.45h-7.86a.69.69 0 0 0-.58.31.7.7 0 0 0-.07.66l14 34.38-7.73 20.09a.71.71 0 0 0 .66 1h7.5a.69.69 0 0 0 .65-.45l21.86-55a.69.69 0 0 0-.06-.68ZM97.91 28.11A40.38 40.38 0 0 0 59.73 0 39.62 39.62 0 0 0 24.6 20.87a29.88 29.88 0 0 0-7.21 56.56l.75.34h.05v-8.5a22.29 22.29 0 0 1 9.29-41.16l2.1-.22.92-1.89A32.15 32.15 0 0 1 59.73 7.57a32.7 32.7 0 0 1 31.55 25l.72 2.86h3a18.53 18.53 0 0 1 18.15 18.46c0 7.05-4.07 12.82-11 15.74v8.06l.5-.16c11.14-3.65 18.06-12.71 18.06-23.64a26.19 26.19 0 0 0-22.8-25.78Z" fill="#3448c5"/>
 <path d="m45.07 76.79 1.66 1.66a.33.33 0 0 1-.23.56H33.4a6 6 0 0 1-6-6V47.57a.33.33 0 0 0-.33-.33h-2.8a.33.33 0 0 1-.24-.56l11.12-11.12a.33.33 0 0 1 .47 0l11.11 11.12a.33.33 0 0 1-.23.56h-2.84a.34.34 0 0 0-.34.33v25a6 6 0 0 0 1.75 4.22ZM69.64 76.79l1.67 1.66a.33.33 0 0 1-.24.56H58a6 6 0 0 1-6-6V54a.34.34 0 0 0-.33-.34h-2.83a.33.33 0 0 1-.23-.56L59.72 42a.33.33 0 0 1 .47 0l11.12 11.08a.33.33 0 0 1-.24.56h-2.84a.34.34 0 0 0-.33.34v18.59a6 6 0 0 0 1.74 4.22ZM94.22 76.79l1.66 1.66a.33.33 0 0 1-.23.56H82.54a6 6 0 0 1-6-6V60.38a.33.33 0 0 0-.33-.33h-2.8a.33.33 0 0 1-.23-.57L84.3 48.37a.32.32 0 0 1 .46 0l11.12 11.11a.33.33 0 0 1-.23.57H92.8a.33.33 0 0 0-.33.33v12.19a6 6 0 0 0 1.75 4.22Z" fill="#3448c5"/>
</svg>
                                    
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