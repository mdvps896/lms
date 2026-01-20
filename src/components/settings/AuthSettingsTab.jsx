'use client';
import React, { useState } from 'react';
import { FiGlobe, FiSmartphone, FiSave } from 'react-icons/fi';

const AuthSettingsTab = ({ settings, onUpdate, saving }) => {
    const [activeSubTab, setActiveSubTab] = useState('web');
    const [formData, setFormData] = useState({
        web: {
            enableRegistration: settings?.authSettings?.web?.enableRegistration ?? true,
            allowGoogleAuth: settings?.authSettings?.web?.allowGoogleAuth ?? true,
            allowEmailAuth: settings?.authSettings?.web?.allowEmailAuth ?? true,
            enableForgotPassword: settings?.authSettings?.web?.enableForgotPassword ?? true
        },
        app: {
            enableRegistration: settings?.authSettings?.app?.enableRegistration ?? true,
            enableMobileOTP: settings?.authSettings?.app?.enableMobileOTP ?? false,
            allowEmailAuth: settings?.authSettings?.app?.allowEmailAuth ?? true,
            allowGoogleAuth: settings?.authSettings?.app?.allowGoogleAuth ?? true,
            enableForgotPassword: settings?.authSettings?.app?.enableForgotPassword ?? true
        }
    });

    const handleChange = (platform, field, value) => {
        setFormData(prev => ({
            ...prev,
            [platform]: {
                ...prev[platform],
                [field]: value
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onUpdate(formData);
    };

    return (
        <div>
            {/* Sub-tabs for Web and App */}
            <div className="mb-4">
                <ul className="nav nav-pills">
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeSubTab === 'web' ? 'active' : ''}`}
                            onClick={() => setActiveSubTab('web')}
                        >
                            <FiGlobe className="me-2" />
                            Web Platform
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeSubTab === 'app' ? 'active' : ''}`}
                            onClick={() => setActiveSubTab('app')}
                        >
                            <FiSmartphone className="me-2" />
                            Mobile App
                        </button>
                    </li>
                </ul>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Web Platform Settings */}
                {activeSubTab === 'web' && (
                    <div className="mb-4">
                        <h6 className="fw-bold mb-3">Web Platform Authentication</h6>
                        <p className="text-muted small mb-4">
                            Configure authentication settings for web users accessing the platform via browser.
                        </p>

                        <div className="mb-3">
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="webEnableRegistration"
                                    checked={formData.web.enableRegistration}
                                    onChange={(e) => handleChange('web', 'enableRegistration', e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="webEnableRegistration">
                                    <strong>Enable User Registration</strong>
                                    <div className="text-muted small">Allow new users to register via web platform</div>
                                </label>
                            </div>
                        </div>

                        <div className="mb-3">
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="webAllowEmailAuth"
                                    checked={formData.web.allowEmailAuth}
                                    onChange={(e) => handleChange('web', 'allowEmailAuth', e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="webAllowEmailAuth">
                                    <strong>Allow Email Authentication</strong>
                                    <div className="text-muted small">Enable email/password login for web users</div>
                                </label>
                            </div>
                        </div>

                        <div className="mb-3">
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="webAllowGoogleAuth"
                                    checked={formData.web.allowGoogleAuth}
                                    onChange={(e) => handleChange('web', 'allowGoogleAuth', e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="webAllowGoogleAuth">
                                    <strong>Allow Google Authentication</strong>
                                    <div className="text-muted small">Enable Google Sign-In for web users</div>
                                </label>
                            </div>
                        </div>

                        <div className="mb-3">
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="webEnableForgotPassword"
                                    checked={formData.web.enableForgotPassword}
                                    onChange={(e) => handleChange('web', 'enableForgotPassword', e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="webEnableForgotPassword">
                                    <strong>Enable Forgot Password</strong>
                                    <div className="text-muted small">Show Forgot Password link and allow password reset</div>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mobile App Settings */}
                {activeSubTab === 'app' && (
                    <div className="mb-4">
                        <h6 className="fw-bold mb-3">Mobile App Authentication</h6>
                        <p className="text-muted small mb-4">
                            Configure authentication settings for mobile app users (Flutter app).
                        </p>

                        <div className="mb-3">
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="appEnableRegistration"
                                    checked={formData.app.enableRegistration}
                                    onChange={(e) => handleChange('app', 'enableRegistration', e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="appEnableRegistration">
                                    <strong>Enable User Registration</strong>
                                    <div className="text-muted small">Allow new users to register via mobile app</div>
                                </label>
                            </div>
                        </div>

                        <div className="mb-3">
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="appEnableMobileOTP"
                                    checked={formData.app.enableMobileOTP}
                                    onChange={(e) => handleChange('app', 'enableMobileOTP', e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="appEnableMobileOTP">
                                    <strong>Enable Mobile OTP Login</strong>
                                    <div className="text-muted small">
                                        Use mobile number + OTP for unified login/register flow
                                        <div className="badge bg-info text-white ms-2">Recommended</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="mb-3">
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="appAllowEmailAuth"
                                    checked={formData.app.allowEmailAuth}
                                    onChange={(e) => handleChange('app', 'allowEmailAuth', e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="appAllowEmailAuth">
                                    <strong>Allow Email Authentication</strong>
                                    <div className="text-muted small">Enable email/password login for app users</div>
                                </label>
                            </div>
                        </div>

                        <div className="mb-3">
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="appAllowGoogleAuth"
                                    checked={formData.app.allowGoogleAuth}
                                    onChange={(e) => handleChange('app', 'allowGoogleAuth', e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="appAllowGoogleAuth">
                                    <strong>Allow Google Authentication</strong>
                                    <div className="text-muted small">Enable Google Sign-In for app users</div>
                                </label>
                            </div>
                        </div>

                        <div className="mb-3">
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="appEnableForgotPassword"
                                    checked={formData.app.enableForgotPassword}
                                    onChange={(e) => handleChange('app', 'enableForgotPassword', e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="appEnableForgotPassword">
                                    <strong>Enable Forgot Password</strong>
                                    <div className="text-muted small">Show Forgot Password link in mobile app</div>
                                </label>
                            </div>
                        </div>

                        {formData.app.enableMobileOTP && (
                            <div className="alert alert-info mt-3">
                                <strong>ℹ️ Mobile OTP Flow:</strong>
                                <ul className="mb-0 mt-2 small">
                                    <li>Users enter mobile number to receive OTP</li>
                                    <li>OTP verification automatically logs in existing users or registers new users</li>
                                    <li>Email and Google login remain available as alternative options</li>
                                    <li>No password required for mobile OTP users</li>
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                <div className="d-flex justify-content-end">
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={saving}
                    >
                        <FiSave className="me-2" />
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AuthSettingsTab;
