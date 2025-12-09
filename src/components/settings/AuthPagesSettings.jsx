'use client';
import React, { useState, useEffect } from 'react';
import { FiSave, FiRefreshCw, FiUpload, FiImage, FiFileText, FiToggleLeft } from 'react-icons/fi';
import dynamic from 'next/dynamic';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

const AuthPagesSettings = ({ settings, onUpdate, saving }) => {
    const [formData, setFormData] = useState({
        enableRegistration: true,
        loginBgImage: '/images/auth/auth-cover-login-bg.svg',
        registerBgImage: '/images/auth/auth-cover-register-bg.svg',
        resetBgImage: '/images/auth/auth-cover-reset-bg.svg',
        termsConditions: ''
    });

    const [uploading, setUploading] = useState({
        loginBgImage: false,
        registerBgImage: false,
        resetBgImage: false
    });

    useEffect(() => {
        if (settings && settings.authPages) {
            setFormData(settings.authPages);
        }
    }, [settings]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFileUpload = async (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(prev => ({ ...prev, [field]: true }));

        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        formDataUpload.append('field', field);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formDataUpload,
            });
            const data = await res.json();
            if (data.success) {
                setFormData(prev => ({
                    ...prev,
                    [field]: data.url
                }));
            }
        } catch (error) {
            console.error('Upload error:', error);
        } finally {
            setUploading(prev => ({ ...prev, [field]: false }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onUpdate(formData);
    };

    const handleReset = () => {
        if (settings && settings.authPages) {
            setFormData(settings.authPages);
        }
    };

    const editorConfig = {
        readonly: false,
        toolbar: true,
        height: 400,
        buttons: [
            'bold', 'italic', 'underline', '|',
            'ul', 'ol', '|',
            'font', 'fontsize', '|',
            'align', '|',
            'link', '|',
            'undo', 'redo'
        ]
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="row g-4">
                {/* Registration Control */}
                <div className="col-12">
                    <h6 className="fw-bold text-primary mb-3 d-flex align-items-center">
                        <FiToggleLeft className="me-2" /> Registration Settings
                    </h6>
                </div>

                <div className="col-md-6">
                    <div className="form-check form-switch">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            name="enableRegistration"
                            id="enableRegistration"
                            checked={formData.enableRegistration}
                            onChange={handleInputChange}
                        />
                        <label className="form-check-label" htmlFor="enableRegistration">
                            Enable User Registration
                        </label>
                    </div>
                    <small className="text-muted">When disabled, users cannot create new accounts</small>
                </div>

                {/* Background Images */}
                <div className="col-12">
                    <h6 className="fw-bold text-primary mb-3 d-flex align-items-center">
                        <FiImage className="me-2" /> Authentication Page Images
                    </h6>
                </div>

                {/* Login Background */}
                <div className="col-md-6">
                    <label className="form-label fw-semibold">Login Page Background Image</label>
                    <div className="card">
                        <div className="card-body">
                            {formData.loginBgImage && (
                                <div className="mb-3">
                                    <img 
                                        src={formData.loginBgImage} 
                                        alt="Login Background" 
                                        className="img-fluid rounded"
                                        style={{ maxHeight: '200px', objectFit: 'cover', width: '100%' }}
                                    />
                                </div>
                            )}
                            <div className="mb-2">
                                <label className="form-label small">Upload Image</label>
                                <input
                                    type="file"
                                    className="form-control"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, 'loginBgImage')}
                                    disabled={uploading.loginBgImage}
                                />
                            </div>
                            <div>
                                <label className="form-label small">Or Enter Image URL</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="loginBgImage"
                                    value={formData.loginBgImage}
                                    onChange={handleInputChange}
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>
                            {uploading.loginBgImage && (
                                <div className="mt-2">
                                    <div className="spinner-border spinner-border-sm me-2" role="status">
                                        <span className="visually-hidden">Uploading...</span>
                                    </div>
                                    <small>Uploading...</small>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Register Background */}
                <div className="col-md-6">
                    <label className="form-label fw-semibold">Register Page Background Image</label>
                    <div className="card">
                        <div className="card-body">
                            {formData.registerBgImage && (
                                <div className="mb-3">
                                    <img 
                                        src={formData.registerBgImage} 
                                        alt="Register Background" 
                                        className="img-fluid rounded"
                                        style={{ maxHeight: '200px', objectFit: 'cover', width: '100%' }}
                                    />
                                </div>
                            )}
                            <div className="mb-2">
                                <label className="form-label small">Upload Image</label>
                                <input
                                    type="file"
                                    className="form-control"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, 'registerBgImage')}
                                    disabled={uploading.registerBgImage}
                                />
                            </div>
                            <div>
                                <label className="form-label small">Or Enter Image URL</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="registerBgImage"
                                    value={formData.registerBgImage}
                                    onChange={handleInputChange}
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>
                            {uploading.registerBgImage && (
                                <div className="mt-2">
                                    <div className="spinner-border spinner-border-sm me-2" role="status">
                                        <span className="visually-hidden">Uploading...</span>
                                    </div>
                                    <small>Uploading...</small>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Reset Password Background */}
                <div className="col-md-6">
                    <label className="form-label fw-semibold">Reset Password Page Background Image</label>
                    <div className="card">
                        <div className="card-body">
                            {formData.resetBgImage && (
                                <div className="mb-3">
                                    <img 
                                        src={formData.resetBgImage} 
                                        alt="Reset Password Background" 
                                        className="img-fluid rounded"
                                        style={{ maxHeight: '200px', objectFit: 'cover', width: '100%' }}
                                    />
                                </div>
                            )}
                            <div className="mb-2">
                                <label className="form-label small">Upload Image</label>
                                <input
                                    type="file"
                                    className="form-control"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, 'resetBgImage')}
                                    disabled={uploading.resetBgImage}
                                />
                            </div>
                            <div>
                                <label className="form-label small">Or Enter Image URL</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="resetBgImage"
                                    value={formData.resetBgImage}
                                    onChange={handleInputChange}
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>
                            {uploading.resetBgImage && (
                                <div className="mt-2">
                                    <div className="spinner-border spinner-border-sm me-2" role="status">
                                        <span className="visually-hidden">Uploading...</span>
                                    </div>
                                    <small>Uploading...</small>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Terms & Conditions */}
                <div className="col-12">
                    <h6 className="fw-bold text-primary mb-3 d-flex align-items-center">
                        <FiFileText className="me-2" /> Terms & Conditions
                    </h6>
                </div>

                <div className="col-12">
                    <label className="form-label fw-semibold">Terms & Conditions Content</label>
                    <JoditEditor
                        value={formData.termsConditions}
                        config={editorConfig}
                        onBlur={newContent => setFormData(prev => ({ ...prev, termsConditions: newContent }))}
                    />
                    <small className="text-muted">This content will be shown in the registration page terms modal</small>
                </div>

                {/* Action Buttons */}
                <div className="col-12">
                    <div className="d-flex gap-2 justify-content-end">
                        <button
                            type="button"
                            className="btn btn-light"
                            onClick={handleReset}
                            disabled={saving}
                        >
                            <FiRefreshCw className="me-2" />
                            Reset
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FiSave className="me-2" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default AuthPagesSettings;
