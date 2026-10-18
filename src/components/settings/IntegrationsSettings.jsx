'use client'
import React, { useState, useEffect } from 'react'
import { FiEye, FiEyeOff, FiInfo, FiExternalLink, FiCheck, FiX, FiHardDrive, FiAlertTriangle, FiMessageSquare } from 'react-icons/fi'
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
        msg91: {
            authKey: '',
            sms: { enabled: false, widgetId: '', token: '' },
            whatsapp: { enabled: false, widgetId: '', token: '' }
        },
        localStorage: {
            enabled: true,
            maxImageSize: 10,
            maxVideoSize: 100,
            maxDocumentSize: 50
        }
    })

    const [loading, setLoading] = useState({
        save: false,
        testOAuth: false,
        testRecaptcha: false,
        testStorage: false,
        msg91Send: false,
        msg91Verify: false
    })

    const [showSecrets, setShowSecrets] = useState({
        clientSecret: false,
        secretKey: false,
        apiSecret: false,
        msg91AuthKey: false,
        msg91SmsToken: false,
        msg91WhatsappToken: false
    })

    // MSG91 test-OTP box
    const [msg91Test, setMsg91Test] = useState({ mobile: '', channel: 'sms', otp: '', sessionId: '' })

    // Load settings on component mount
    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/settings')
            const data = await response.json()
            if (data.success && data.data.integrations) {
                const saved = data.data.integrations
                setFormData(prev => {
                    // Merge each section over its defaults. A shallow spread let a saved
                    // section that lacked a field (e.g. localStorage.maxImageSize) turn
                    // a controlled input into an uncontrolled one.
                    const merged = { ...prev, ...saved }
                    for (const key of Object.keys(prev)) {
                        merged[key] = { ...prev[key], ...(saved[key] || {}) }
                    }
                    merged.msg91.sms = { ...prev.msg91.sms, ...(saved.msg91?.sms || {}) }
                    merged.msg91.whatsapp = { ...prev.msg91.whatsapp, ...(saved.msg91?.whatsapp || {}) }
                    return merged
                })
            } else {
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

    const testStorage = async () => {
        setLoading(prev => ({ ...prev, testStorage: true }))
        try {
            const response = await fetch('/api/storage/status', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            })
            const result = await response.json()

            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Local Storage Working!',
                    html: `
                        <p>Storage is accessible and functioning</p>
                        <small>Total files: ${result.data?.total?.count || 0}</small>
                        <br>
                        <small>Total size: ${result.data?.total?.sizeFormatted || '0 Bytes'}</small>
                    `,
                    timer: 3000
                })
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Storage Test Failed',
                    text: result.message || 'Unable to access storage',
                    timer: 3000
                })
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Test Failed',
                text: 'Unable to test storage configuration',
                timer: 2000
            })
        }
        setLoading(prev => ({ ...prev, testStorage: false }))
    }

    const handleMsg91Change = (field, value) => {
        setFormData(prev => ({ ...prev, msg91: { ...prev.msg91, [field]: value } }))
    }

    const handleMsg91ChannelChange = (channel, field, value) => {
        setFormData(prev => ({
            ...prev,
            msg91: { ...prev.msg91, [channel]: { ...prev.msg91[channel], [field]: value } }
        }))
    }

    const callMsg91Test = async (action) => {
        const key = action === 'send' ? 'msg91Send' : 'msg91Verify'
        const { mobile, otp, channel, sessionId } = msg91Test
        if (!/^[0-9]{10}$/.test(mobile)) {
            Swal.fire({ icon: 'error', title: 'Invalid number', text: 'Enter a 10-digit mobile number', timer: 2500 })
            return
        }
        if (action === 'send' && (!formData.msg91[channel].widgetId || !formData.msg91[channel].token)) {
            Swal.fire({ icon: 'error', title: 'Missing Configuration', text: `Enter the ${channel === 'sms' ? 'SMS' : 'WhatsApp'} Widget ID and Token first`, timer: 3000 })
            return
        }
        if (action === 'verify' && !otp) {
            Swal.fire({ icon: 'error', title: 'Enter OTP', text: 'Type the OTP you received', timer: 2500 })
            return
        }

        setLoading(prev => ({ ...prev, [key]: true }))
        try {
            const response = await fetch('/api/integrations/test-msg91', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, mobile, otp, channel, sessionId, ...formData.msg91 })
            })
            const result = await response.json()

            if (result.success) {
                if (action === 'send') setMsg91Test(prev => ({ ...prev, sessionId: result.sessionId, otp: '' }))
                Swal.fire({
                    icon: 'success',
                    title: action === 'send' ? 'OTP Sent' : 'MSG91 Working!',
                    text: result.message,
                    timer: 2500
                })
            } else {
                Swal.fire({
                    icon: 'error',
                    title: action === 'send' ? 'Could not send OTP' : 'Verification Failed',
                    // No timer: the admin needs time to read the reason.
                    html: `<div>${(result.message || 'MSG91 returned an error').replace(/</g, '&lt;')}</div>` +
                        (result.detail ? `<pre style="text-align:left;font-size:12px;white-space:pre-wrap;margin-top:10px">${String(result.detail).replace(/</g, '&lt;')}</pre>` : '')
                })
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Test Failed', text: 'Unable to reach the server', timer: 2500 })
        }
        setLoading(prev => ({ ...prev, [key]: false }))
    }

    const showHowToModal = (type) => {
        let content = ''

        if (type === 'msg91') {
            content = `
                <div style="text-align: left; line-height: 1.6;">
                    <h4 style="color: #667eea; margin-bottom: 15px;">MSG91 OTP Widget Setup Steps:</h4>
                    <ol style="padding-left: 20px;">
                        <li style="margin-bottom: 10px;">Log in to <a href="https://control.msg91.com" target="_blank" style="color: #667eea;">MSG91 Dashboard</a></li>
                        <li style="margin-bottom: 10px;"><strong>Auth Key:</strong> profile menu → "Authkey". Copy it into <em>MSG91 Auth Key</em>.</li>
                        <li style="margin-bottom: 10px;">Go to <em>OTP → Widgets</em> and create <strong>one widget per channel</strong> (SMS, and WhatsApp if you use it).</li>
                        <li style="margin-bottom: 10px;">In each widget's <em>Widget Settings</em>, turn <strong>Captcha</strong> and <strong>Invisible OTP</strong> <strong>off</strong> (server-side use does not support them).</li>
                        <li style="margin-bottom: 10px;">Copy the widget's <strong>Widget ID</strong>, and its token from <em>OTP → Tokens</em>, into the matching channel here.</li>
                        <li style="margin-bottom: 10px;">Switch the channel on, click <strong>Save</strong>, then use <strong>Send Test OTP</strong>.</li>
                        <li style="margin-bottom: 10px;">Finally choose <strong>MSG91</strong> as SMS provider in <em>Login &amp; Register Settings</em> for Web and/or Mobile App.</li>
                    </ol>
                </div>
            `
        }

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
                                        unoptimized
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
                                        unoptimized
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

                        <hr />

                        {/* MSG91 SMS (OTP) Section */}
                        <div className="mb-5">
                            <div className="d-flex align-items-center justify-content-between mb-4">
                                <div className="d-flex align-items-center">
                                    <FiMessageSquare className="me-3 text-primary" size={30} />
                                    <h6 className="mb-0">MSG91 OTP (SMS / WhatsApp)</h6>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-outline-info btn-sm"
                                    onClick={() => showHowToModal('msg91')}
                                >
                                    <FiInfo className="me-1" /> How to Setup
                                </button>
                            </div>

                            <div className="alert alert-info">
                                <FiInfo className="me-2" />
                                Customers log in or sign up with their mobile number. Create <strong>one OTP widget per channel</strong> in MSG91 → OTP → Widgets and copy its Widget ID and Token here. Used when <strong>MSG91</strong> is selected as the SMS provider in <strong>Login &amp; Register Settings</strong> (Web and/or Mobile App).
                            </div>

                            <div className="mb-3">
                                <label className="form-label">MSG91 Auth Key</label>
                                <div className="input-group">
                                    <input
                                        type={showSecrets.msg91AuthKey ? 'text' : 'password'}
                                        className="form-control"
                                        value={formData.msg91.authKey}
                                        onChange={(e) => handleMsg91Change('authKey', e.target.value)}
                                        placeholder="Your MSG91 Auth Key"
                                        autoComplete="off"
                                    />
                                    <button
                                        className="btn btn-outline-secondary"
                                        type="button"
                                        onClick={() => setShowSecrets(prev => ({ ...prev, msg91AuthKey: !prev.msg91AuthKey }))}
                                    >
                                        {showSecrets.msg91AuthKey ? <FiEyeOff /> : <FiEye />}
                                    </button>
                                </div>
                                <small className="text-muted">MSG91 → Authkey. Used by the server to confirm each OTP login — never shown to visitors.</small>
                            </div>

                            {[
                                { key: 'sms', label: 'OTP on SMS', hint: 'Show “Send OTP on SMS” on the login page.', secretKey: 'msg91SmsToken' },
                                { key: 'whatsapp', label: 'OTP on WhatsApp', hint: 'Show “Send OTP on WhatsApp” on the login page.', secretKey: 'msg91WhatsappToken' }
                            ].map(({ key, label, hint, secretKey }) => (
                                <div key={key} className="mb-3">
                                    <div className="d-flex align-items-center justify-content-between border rounded p-3 mb-2">
                                        <div>
                                            <div className="fw-bold">{label}</div>
                                            <small className="text-muted">{hint}</small>
                                        </div>
                                        <div className="form-check form-switch m-0">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={formData.msg91[key].enabled}
                                                onChange={(e) => handleMsg91ChannelChange(key, 'enabled', e.target.checked)}
                                            />
                                        </div>
                                    </div>
                                    <div className="row g-3 bg-light rounded mx-0 py-3">
                                        <div className="col-md-6">
                                            <label className="form-label">{key === 'sms' ? 'SMS' : 'WhatsApp'} Widget ID</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.msg91[key].widgetId}
                                                onChange={(e) => handleMsg91ChannelChange(key, 'widgetId', e.target.value)}
                                                placeholder="Widget ID"
                                                autoComplete="off"
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">{key === 'sms' ? 'SMS' : 'WhatsApp'} Token</label>
                                            <div className="input-group">
                                                <input
                                                    type={showSecrets[secretKey] ? 'text' : 'password'}
                                                    className="form-control"
                                                    value={formData.msg91[key].token}
                                                    onChange={(e) => handleMsg91ChannelChange(key, 'token', e.target.value)}
                                                    placeholder="Widget Token"
                                                    autoComplete="off"
                                                />
                                                <button
                                                    className="btn btn-outline-secondary"
                                                    type="button"
                                                    onClick={() => setShowSecrets(prev => ({ ...prev, [secretKey]: !prev[secretKey] }))}
                                                >
                                                    {showSecrets[secretKey] ? <FiEyeOff /> : <FiEye />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Test OTP */}
                            <div className="card bg-light border-0">
                                <div className="card-body">
                                    <h6 className="fw-bold mb-3">Test OTP</h6>
                                    <div className="row g-2 align-items-end">
                                        <div className="col-md-3">
                                            <label className="form-label">Mobile Number</label>
                                            <input
                                                type="tel"
                                                className="form-control"
                                                maxLength={10}
                                                placeholder="10-digit number"
                                                value={msg91Test.mobile}
                                                onChange={(e) => setMsg91Test(prev => ({
                                                    ...prev,
                                                    mobile: e.target.value.replace(/\D/g, '').slice(0, 10),
                                                    sessionId: ''
                                                }))}
                                            />
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label">Channel</label>
                                            <select
                                                className="form-select"
                                                value={msg91Test.channel}
                                                onChange={(e) => setMsg91Test(prev => ({ ...prev, channel: e.target.value, sessionId: '' }))}
                                            >
                                                <option value="sms">SMS</option>
                                                <option value="whatsapp">WhatsApp</option>
                                            </select>
                                        </div>
                                        <div className="col-md-3">
                                            <button
                                                type="button"
                                                className="btn btn-primary w-100"
                                                onClick={() => callMsg91Test('send')}
                                                disabled={loading.msg91Send}
                                            >
                                                {loading.msg91Send ? (
                                                    <><span className="spinner-border spinner-border-sm me-1"></span>Sending...</>
                                                ) : (
                                                    msg91Test.sessionId ? 'Resend OTP' : 'Send Test OTP'
                                                )}
                                            </button>
                                        </div>
                                        {msg91Test.sessionId && (
                                            <>
                                                <div className="col-md-2">
                                                    <label className="form-label">Enter OTP</label>
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        className="form-control"
                                                        maxLength={9}
                                                        placeholder="OTP"
                                                        value={msg91Test.otp}
                                                        onChange={(e) => setMsg91Test(prev => ({ ...prev, otp: e.target.value.replace(/\D/g, '') }))}
                                                    />
                                                </div>
                                                <div className="col-md-2">
                                                    <button
                                                        type="button"
                                                        className="btn btn-success w-100"
                                                        onClick={() => callMsg91Test('verify')}
                                                        disabled={loading.msg91Verify}
                                                    >
                                                        {loading.msg91Verify ? (
                                                            <span className="spinner-border spinner-border-sm"></span>
                                                        ) : 'Verify'}
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <small className="text-muted d-block mt-2">
                                        Uses the values typed above, even before saving. A real message is sent and billed by MSG91.
                                    </small>
                                </div>
                            </div>
                        </div>

                        <hr />

        {/* Local Storage Section */}
        <div className="mb-5">
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div className="d-flex align-items-center">
                    <FiHardDrive className="me-3 text-primary" size={32} />
                    <h5 className="mb-0">Local Storage</h5>
                                    
                    <div className="form-check form-switch ms-3">
                        <input 
                            className="form-check-input" 
                            type="checkbox" 
                            checked={formData.localStorage.enabled}
                            onChange={() => handleToggle('localStorage')}
                        />
                        <label className="form-check-label">
                            {formData.localStorage.enabled ? (
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
            </div>

            <div className="alert alert-success mb-3">
                <FiInfo className="me-2" />
                Local storage saves all uploaded files directly to the server's file system. Files are organized by type (images, videos, documents) and stored in the public/uploads directory.
            </div>

            <div className="row">
                <div className="col-md-4">
                    <div className="mb-3">
                        <label className="form-label">Max Image Size (MB)</label>
                        <input
                            type="number"
                            className="form-control"
                            value={formData.localStorage.maxImageSize}
                            onChange={(e) => handleInputChange('localStorage', 'maxImageSize', parseInt(e.target.value) || 10)}
                            placeholder="10"
                            min="1"
                            max="100"
                            disabled={!formData.localStorage.enabled}
                        />
                        <small className="text-muted">Maximum size for image uploads</small>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="mb-3">
                        <label className="form-label">Max Video Size (MB)</label>
                        <input
                            type="number"
                            className="form-control"
                            value={formData.localStorage.maxVideoSize}
                            onChange={(e) => handleInputChange('localStorage', 'maxVideoSize', parseInt(e.target.value) || 100)}
                            placeholder="100"
                            min="1"
                            max="500"
                            disabled={!formData.localStorage.enabled}
                        />
                        <small className="text-muted">Maximum size for video uploads</small>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="mb-3">
                        <label className="form-label">Max Document Size (MB)</label>
                        <input
                            type="number"
                            className="form-control"
                            value={formData.localStorage.maxDocumentSize}
                            onChange={(e) => handleInputChange('localStorage', 'maxDocumentSize', parseInt(e.target.value) || 50)}
                            placeholder="50"
                            min="1"
                            max="200"
                            disabled={!formData.localStorage.enabled}
                        />
                        <small className="text-muted">Maximum size for document uploads</small>
                    </div>
                </div>
            </div>

            {formData.localStorage.enabled && (
                <div className="alert alert-warning">
                    <FiAlertTriangle className="me-2" />
                    <strong>Note:</strong> Local storage is suitable for development and small-scale deployments. For production use with multiple servers or high traffic, consider using cloud storage solutions.
                </div>
            )}
        </div>                        {/* Save Button */}
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