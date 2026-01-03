'use client';
import React, { useState, useEffect } from 'react';
import { FiSave, FiRefreshCw, FiShield, FiMail, FiLock, FiEye, FiEyeOff, FiSettings, FiMonitor, FiMic, FiCamera, FiShare2, FiCopy, FiMaximize, FiTablet } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import Swal from 'sweetalert2';

const SecuritySMTPSettings = ({ settings, onUpdate, saving }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        security: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
            examSecurity: {
                preventCopyPaste: true,
                fullScreenMode: true,
                tabSwitchDetection: true,
                micPermission: false,
                camPermission: true,
                screenShare: false
            },
            twoFactorAuth: false
        },
        smtp: {
            smtpHost: '',
            smtpPort: 587,
            smtpUsername: '',
            smtpPassword: '',
            smtpSecure: true,
            fromEmail: '',
            fromName: ''
        }
    });

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
        smtp: false
    });

    const [testEmailResult, setTestEmailResult] = useState(null);
    const [sendingTest, setSendingTest] = useState(false);
    const [testEmailAddress, setTestEmailAddress] = useState('');

    // 2FA specific state
    const [isToggling2FA, setIsToggling2FA] = useState(false);

    useEffect(() => {
        if (settings && settings.securitySMTP) {
            setFormData({
                ...settings.securitySMTP,
                security: {
                    ...settings.securitySMTP.security,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                }
            });
        }

        // Set current user's 2FA status
        if (user && user.role === 'admin') {
            setFormData(prev => ({
                ...prev,
                security: {
                    ...prev.security,
                    twoFactorAuth: user.twoFactorEnabled || false
                }
            }));
        }
    }, [settings, user]);

    const handleInputChange = (section, field, value) => {
        if (section === 'examSecurity') {
            setFormData(prev => ({
                ...prev,
                security: {
                    ...prev.security,
                    examSecurity: {
                        ...prev.security.examSecurity,
                        [field]: value
                    }
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: value
                }
            }));
        }
    };

    const handleSecurityChange = (field, value) => {
        if (field === 'twoFactorAuth') {
            handleToggle2FA(value);
        } else {
            setFormData(prev => ({
                ...prev,
                security: {
                    ...prev.security,
                    [field]: value
                }
            }));
        }
    };

    const handleToggle2FA = async (enabled) => {
        if (!user || user.role !== 'admin') {
            Swal.fire({
                icon: 'error',
                title: 'Access Denied',
                text: '2FA is only available for admin users',
                timer: 2000
            });
            return;
        }

        // Show confirmation dialog
        const result = await Swal.fire({
            title: enabled ? 'Enable Two-Factor Authentication?' : 'Disable Two-Factor Authentication?',
            html: enabled
                ? `<div class="text-start">
                     <p class="mb-2">Enable an extra layer of security for your admin account.</p>
                     <p class="mb-2"><strong>This will:</strong></p>
                     <ul class="text-muted small">
                       <li>Require email verification after login</li>
                       <li>Send a 6-digit code to your email</li>
                       <li>Significantly improve account security</li>
                     </ul>
                   </div>`
                : `<div class="text-start">
                     <p class="mb-2">You are about to disable two-factor authentication.</p>
                     <p class="mb-2"><strong>This will:</strong></p>
                     <ul class="text-muted small">
                       <li>Remove the extra security layer from your account</li>
                       <li>Allow login with just email and password</li>
                       <li>Make your account less secure</li>
                     </ul>
                   </div>`,
            icon: enabled ? 'info' : 'warning',
            showCancelButton: true,
            confirmButtonColor: enabled ? '#198754' : '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: enabled ? 'Yes, enable it' : 'Yes, disable it',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        setIsToggling2FA(true);
        try {
            const response = await fetch('/api/auth/toggle-2fa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user._id,
                    enabled: enabled
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Update local form state
                setFormData(prev => ({
                    ...prev,
                    security: {
                        ...prev.security,
                        twoFactorAuth: enabled
                    }
                }));

                // Update user context by fetching fresh user data
                try {
                    const userResponse = await fetch('/api/auth/me');
                    if (userResponse.ok) {
                        const userData = await userResponse.json();
                        if (userData.success) {
                            // Update localStorage and context
                            localStorage.setItem('user', JSON.stringify(userData.data));
                            document.cookie = `user=${JSON.stringify(userData.data)}; path=/; max-age=86400`;
                            // Force page refresh to update context
                            window.location.reload();
                        }
                    }
                } catch (contextError) {
                    console.error('Failed to update user context:', contextError);
                }

                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: data.message,
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: data.message || 'Failed to update 2FA settings',
                    timer: 2000
                });
            }
        } catch (error) {
            console.error('2FA toggle error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to update 2FA settings. Please try again.',
                timer: 2000
            });
        } finally {
            setIsToggling2FA(false);
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate passwords
        if (formData.security.newPassword && formData.security.newPassword !== formData.security.confirmPassword) {
            alert('New password and confirm password do not match');
            return;
        }

        // Create a copy of formData without the twoFactorAuth field
        // since 2FA is managed separately via toggle API
        const formDataToSave = {
            ...formData,
            security: {
                ...formData.security
            }
        };

        // Remove twoFactorAuth from the data being saved to settings
        delete formDataToSave.security.twoFactorAuth;

        await onUpdate(formDataToSave);
    };

    const handleReset = () => {
        if (settings && settings.securitySMTP) {
            setFormData({
                ...settings.securitySMTP,
                security: {
                    ...settings.securitySMTP.security,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                    // Preserve current 2FA status from user object, not settings
                    twoFactorAuth: user?.twoFactorEnabled || false
                }
            });
        }
    };

    const sendTestEmail = async () => {
        if (!testEmailAddress) {
            setTestEmailResult({ success: false, message: 'Please enter an email address to send test email' });
            return;
        }

        setSendingTest(true);
        setTestEmailResult(null);
        try {
            const res = await fetch('/api/test-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData.smtp,
                    testEmail: testEmailAddress
                })
            });
            const data = await res.json();
            setTestEmailResult(data);
        } catch (error) {
            setTestEmailResult({ success: false, message: 'Failed to send test email' });
        } finally {
            setSendingTest(false);
        }
    };

    const PasswordInput = ({ label, name, value, onChange, show, onToggle, placeholder, section = 'security' }) => (
        <div className="col-md-6">
            <label className="form-label">{label}</label>
            <div className="input-group">
                <input
                    type={show ? "text" : "password"}
                    name={name}
                    className="form-control"
                    value={value}
                    onChange={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (section === 'smtp') {
                            handleInputChange(section, name, e.target.value);
                        } else {
                            handleSecurityChange(name, e.target.value);
                        }
                    }}
                    onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    placeholder={placeholder}
                    autoComplete={section === 'smtp' ? 'current-password' : 'new-password'}
                />
                <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onToggle();
                    }}
                    tabIndex="-1"
                >
                    {show ? <FiEyeOff /> : <FiEye />}
                </button>
            </div>
        </div>
    );

    const SecurityToggle = ({ icon, label, description, checked, onChange }) => (
        <div className="col-md-6">
            <div className="card border-0 bg-light h-100">
                <div className="card-body">
                    <div className="form-check mb-2">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            checked={checked}
                            onChange={(e) => onChange(e.target.checked)}
                        />
                        <label className="form-check-label fw-medium d-flex align-items-center">
                            {icon}
                            <span className="ms-2">{label}</span>
                        </label>
                    </div>
                    <p className="text-muted small mb-0">{description}</p>
                </div>
            </div>
        </div>
    );

    return (
        <form onSubmit={handleSubmit}>
            <div className="row g-4">
                {/* Security Settings */}
                <div className="col-12">
                    <h6 className="fw-bold text-primary mb-3 d-flex align-items-center">
                        <FiLock className="me-2" /> Security Settings
                    </h6>
                </div>

                {/* Password Change */}
                <div className="col-12">
                    <h6 className="fw-medium mb-3">Change Password</h6>
                </div>

                <PasswordInput
                    label="Current Password"
                    name="currentPassword"
                    value={formData.security.currentPassword}
                    onChange={handleSecurityChange}
                    show={showPasswords.current}
                    onToggle={() => togglePasswordVisibility('current')}
                    placeholder="Enter current password"
                />

                <PasswordInput
                    label="New Password"
                    name="newPassword"
                    value={formData.security.newPassword}
                    onChange={handleSecurityChange}
                    show={showPasswords.new}
                    onToggle={() => togglePasswordVisibility('new')}
                    placeholder="Enter new password"
                />

                <PasswordInput
                    label="Confirm Password"
                    name="confirmPassword"
                    value={formData.security.confirmPassword}
                    onChange={handleSecurityChange}
                    show={showPasswords.confirm}
                    onToggle={() => togglePasswordVisibility('confirm')}
                    placeholder="Confirm new password"
                />

                {/* Two Factor Authentication */}
                <div className="col-12 mt-4">
                    <div className={`card border-0 ${formData.security.twoFactorAuth ? 'bg-success bg-opacity-10' : 'bg-warning bg-opacity-10'}`}>
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div className="flex-grow-1">
                                    <h6 className="fw-medium mb-1 d-flex align-items-center text-white">
                                        <FiShield className="me-2" />
                                        Two-Factor Authentication (2FA) for Admin
                                    </h6>
                                    <p className="text-white small mb-2">
                                        Add an extra layer of security to your admin account. An OTP will be sent to your email after login.
                                    </p>
                                    {user && user.role === 'admin' && (
                                        <div className="text-white small">
                                            <strong>Email:</strong> {user.email}
                                        </div>
                                    )}
                                    {user && user.role !== 'admin' && (
                                        <div className="text-warning small">
                                            <strong>Note:</strong> 2FA is only available for admin users
                                        </div>
                                    )}
                                </div>
                                <div className="ms-3">
                                    {user && user.role === 'admin' ? (
                                        <button
                                            type="button"
                                            className={`btn btn-sm d-flex align-items-center text-white border-white ${formData.security.twoFactorAuth ? 'btn-outline-light' : 'btn-outline-light'
                                                }`}
                                            onClick={() => handleToggle2FA(!formData.security.twoFactorAuth)}
                                            disabled={isToggling2FA}
                                            style={{ minWidth: '120px' }}
                                        >
                                            {isToggling2FA ? (
                                                <>
                                                    <div
                                                        className="spinner-border spinner-border-sm me-2 text-white"
                                                        role="status"
                                                        style={{ width: '0.875rem', height: '0.875rem' }}
                                                    >
                                                        <span className="visually-hidden">Loading...</span>
                                                    </div>
                                                    <span className="text-white">{formData.security.twoFactorAuth ? 'Disabling...' : 'Enabling...'}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FiShield className="me-2 text-white" size={16} />
                                                    <span className="text-white">{formData.security.twoFactorAuth ? 'Disable 2FA' : 'Enable 2FA'}</span>
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <div className="form-check form-switch">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                role="switch"
                                                id="twoFactorAuth"
                                                checked={false}
                                                disabled={true}
                                                style={{ transform: 'scale(1.2)' }}
                                            />
                                            <label className="form-check-label text-muted" htmlFor="twoFactorAuth">
                                                Disabled
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {formData.security.twoFactorAuth && user && user.role === 'admin' && (
                                <div className="mt-3 pt-3 border-top">
                                    <div className="d-flex align-items-center text-success small">
                                        <FiShield className="me-2" />
                                        <span><strong>2FA is currently enabled</strong> - Your account is protected with email verification</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Admin Login Security */}
                <div className="col-12 mt-4">
                    <h6 className="fw-bold text-primary mb-3 d-flex align-items-center">
                        <FiShield className="me-2" /> Admin Login Security
                    </h6>
                    <div className="card border-0 bg-light">
                        <div className="card-body">
                            <div className="form-check form-switch mb-3">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    role="switch"
                                    id="adminSecurityEnabled"
                                    checked={formData.security.enabled !== false}
                                    onChange={(e) => handleSecurityChange('enabled', e.target.checked)}
                                />
                                <label className="form-check-label fw-bold" htmlFor="adminSecurityEnabled">
                                    Enable Admin Login Protection
                                </label>
                                <p className="text-muted small mb-0">Enable account lockout after failed login attempts.</p>
                            </div>

                            {formData.security.enabled !== false && (
                                <div className="row g-3 animate__animated animate__fadeIn">
                                    <div className="col-md-6">
                                        <label className="form-label fw-medium">Max Login Attempts</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={formData.security.maxLoginAttempts || 3}
                                            onChange={(e) => handleSecurityChange('maxLoginAttempts', parseInt(e.target.value) || 3)}
                                            min="1"
                                            max="10"
                                        />
                                        <small className="text-muted">Number of failed attempts before blocking.</small>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-medium">Lockout Duration</label>
                                        <div className="input-group">
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={
                                                    (formData.security.lockoutUnit === 'hours')
                                                        ? Math.floor((formData.security.lockoutDuration || 600) / 3600)
                                                        : (formData.security.lockoutUnit === 'minutes' || !formData.security.lockoutUnit) // Default to minutes display if no unit set yet
                                                            ? Math.floor((formData.security.lockoutDuration || 600) / 60)
                                                            : (formData.security.lockoutDuration || 600)
                                                }
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 1;
                                                    const unit = formData.security.lockoutUnit || 'minutes';
                                                    let seconds = val;
                                                    if (unit === 'minutes') seconds = val * 60;
                                                    if (unit === 'hours') seconds = val * 3600;

                                                    handleSecurityChange('lockoutDuration', seconds);
                                                }}
                                                min="1"
                                            />
                                            <select
                                                className="form-select"
                                                style={{ maxWidth: '120px' }}
                                                value={formData.security.lockoutUnit || 'minutes'}
                                                onChange={(e) => {
                                                    const newUnit = e.target.value;
                                                    const currentDuration = formData.security.lockoutDuration || 600;

                                                    // When unit changes, we want to KEEP the duration roughly the same but adjust the input value view?
                                                    // No, typically users want to switch unit to enter a NEW value easily. 
                                                    // Let's just update the unit state so the input calculates correctly off the stored seconds.
                                                    // Wait, if I have 600 seconds (10 mins) and switch to Seconds, it shows 600.
                                                    // If I switch to Hours, 10 mins is 0 hours. That's bad.
                                                    // Maybe just store the unit preference to key the display?
                                                    // Yes, let's add `lockoutUnit` to formData.

                                                    handleSecurityChange('lockoutUnit', newUnit);
                                                }}
                                            >
                                                <option value="seconds">Seconds</option>
                                                <option value="minutes">Minutes</option>
                                                <option value="hours">Hours</option>
                                            </select>
                                        </div>
                                        <small className="text-muted">Duration to block access after max failed attempts.</small>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Exam Security */}
                <div className="col-12 mt-5">
                    <h6 className="fw-bold text-primary mb-3 d-flex align-items-center">
                        <FiMonitor className="me-2" /> Exam Security (Global Settings)
                    </h6>
                    <p className="text-muted">These security settings will apply to all exams by default</p>
                </div>

                <SecurityToggle
                    icon={<FiCopy />}
                    label="Prevent Copy/Paste"
                    description="Disable copy, paste, and right-click functionality during exams"
                    checked={formData.security.examSecurity.preventCopyPaste}
                    onChange={(value) => handleInputChange('examSecurity', 'preventCopyPaste', value)}
                />

                <SecurityToggle
                    icon={<FiMaximize />}
                    label="Full Screen Mode"
                    description="Force students to take exams in full screen mode"
                    checked={formData.security.examSecurity.fullScreenMode}
                    onChange={(value) => handleInputChange('examSecurity', 'fullScreenMode', value)}
                />

                <SecurityToggle
                    icon={<FiTablet />}
                    label="Tab Switch Detection"
                    description="Detect and log when students switch browser tabs during exam"
                    checked={formData.security.examSecurity.tabSwitchDetection}
                    onChange={(value) => handleInputChange('examSecurity', 'tabSwitchDetection', value)}
                />

                <SecurityToggle
                    icon={<FiMic />}
                    label="Microphone Permission"
                    description="Request microphone access for audio proctoring"
                    checked={formData.security.examSecurity.micPermission}
                    onChange={(value) => handleInputChange('examSecurity', 'micPermission', value)}
                />

                <SecurityToggle
                    icon={<FiCamera />}
                    label="Camera Permission"
                    description="Request camera access for video proctoring"
                    checked={formData.security.examSecurity.camPermission}
                    onChange={(value) => handleInputChange('examSecurity', 'camPermission', value)}
                />

                <SecurityToggle
                    icon={<FiShare2 />}
                    label="Screen Share"
                    description="Allow screen sharing for remote proctoring"
                    checked={formData.security.examSecurity.screenShare}
                    onChange={(value) => handleInputChange('examSecurity', 'screenShare', value)}
                />

                {/* SMTP Settings */}
                <div className="col-12 mt-5">
                    <h6 className="fw-bold text-primary mb-3 d-flex align-items-center">
                        <FiMail className="me-2" /> SMTP Configuration
                    </h6>
                    <p className="text-muted">Configure email settings for notifications and communications</p>

                    {/* SMTP Configuration Help */}
                    <div className="alert alert-info">
                        <h6 className="alert-heading">📧 Common SMTP Settings</h6>
                        <div className="row">
                            <div className="col-md-6">
                                <strong>Gmail:</strong><br />
                                Host: smtp.gmail.com<br />
                                Port: 587 (TLS) or 465 (SSL)<br />
                                <small>Use App Password, not regular password</small>
                            </div>
                            <div className="col-md-6">
                                <strong>Outlook/Hotmail:</strong><br />
                                Host: smtp-mail.outlook.com<br />
                                Port: 587 (TLS)<br />
                                <small>Use your regular email password</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-6">
                    <label className="form-label">SMTP Host</label>
                    <input
                        type="text"
                        className="form-control"
                        value={formData.smtp.smtpHost}
                        onChange={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleInputChange('smtp', 'smtpHost', e.target.value);
                        }}
                        onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                        placeholder="smtp.gmail.com"
                        autoComplete="off"
                    />
                </div>

                <div className="col-md-6">
                    <label className="form-label">SMTP Port</label>
                    <input
                        type="number"
                        className="form-control"
                        value={formData.smtp.smtpPort}
                        onChange={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleInputChange('smtp', 'smtpPort', parseInt(e.target.value) || 587);
                        }}
                        onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                        placeholder="587"
                        autoComplete="off"
                    />
                </div>

                <div className="col-md-6">
                    <label className="form-label">SMTP Username</label>
                    <input
                        type="text"
                        className="form-control"
                        value={formData.smtp.smtpUsername}
                        onChange={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleInputChange('smtp', 'smtpUsername', e.target.value);
                        }}
                        onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                        placeholder="your-email@gmail.com"
                        autoComplete="username"
                    />
                </div>

                <PasswordInput
                    label="SMTP Password"
                    name="smtpPassword"
                    value={formData.smtp.smtpPassword}
                    show={showPasswords.smtp}
                    onToggle={() => togglePasswordVisibility('smtp')}
                    placeholder="App password or SMTP password"
                    section="smtp"
                />

                <div className="col-md-6">
                    <label className="form-label">From Email</label>
                    <input
                        type="email"
                        className="form-control"
                        value={formData.smtp.fromEmail}
                        onChange={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleInputChange('smtp', 'fromEmail', e.target.value);
                        }}
                        onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                        placeholder="noreply@yoursite.com"
                        autoComplete="email"
                    />
                </div>

                <div className="col-md-6">
                    <label className="form-label">From Name</label>
                    <input
                        type="text"
                        className="form-control"
                        value={formData.smtp.fromName}
                        onChange={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleInputChange('smtp', 'fromName', e.target.value);
                        }}
                        onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                        placeholder="Duralux Exam Portal"
                        autoComplete="off"
                    />
                </div>

                <div className="col-12">
                    <div className="form-check">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            id="smtpSecure"
                            checked={formData.smtp.smtpSecure}
                            onChange={(e) => {
                                e.stopPropagation();
                                handleInputChange('smtp', 'smtpSecure', e.target.checked);
                            }}
                        />
                        <label className="form-check-label" htmlFor="smtpSecure">
                            Use Secure Connection (SSL/TLS)
                        </label>
                    </div>
                </div>

                {/* Test Email */}
                <div className="col-12">
                    <h6 className="fw-medium mb-3">Test Email Configuration</h6>
                    <div className="row g-3">
                        <div className="col-md-8">
                            <label className="form-label">Test Email Address</label>
                            <input
                                type="email"
                                className="form-control"
                                value={testEmailAddress}
                                onChange={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setTestEmailAddress(e.target.value);
                                }}
                                onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                                placeholder="Enter email address to send test email"
                                autoComplete="email"
                            />
                            <small className="text-muted">Enter the email address where you want to send the test email</small>
                        </div>
                        <div className="col-md-4 d-flex align-items-end">
                            <button
                                type="button"
                                className="btn btn-outline-primary w-100"
                                onClick={sendTestEmail}
                                disabled={sendingTest || !formData.smtp.smtpHost || !testEmailAddress}
                            >
                                {sendingTest ? (
                                    <>
                                        <FiRefreshCw className="spin me-2" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <FiMail className="me-2" />
                                        Send Test Email
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    {testEmailResult && (
                        <div className={`alert alert-${testEmailResult.success ? 'success' : 'danger'} mt-3`}>
                            <strong>{testEmailResult.success ? 'Success!' : 'Error!'}</strong> {testEmailResult.message}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="col-12 mt-4">
                    <div className="d-flex gap-2">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <FiRefreshCw className="spin me-2" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FiSave className="me-2" />
                                    Save Changes
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={handleReset}
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default SecuritySMTPSettings;