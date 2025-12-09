'use client';
import React, { useState, useEffect } from 'react';
import { FiSave, FiRefreshCw, FiUpload, FiUser, FiMail, FiPhone, FiGlobe, FiBell, FiImage, FiEdit3, FiType, FiSettings, FiBarChart } from 'react-icons/fi';

const GeneralSettings = ({ settings, onUpdate, saving }) => {
    const [formData, setFormData] = useState({
        adminName: '',
        contactEmail: '',
        phoneNumber: '',
        timeZone: 'UTC',
        emailNotifications: true,
        siteLogo: '/images/logo/logo.png',
        siteFavIcon: '/images/logo/favicon.ico',
        siteSmallLogo: '/images/logo/small-logo.png',
        digitalSignature: '',
        siteName: 'Duralux Exam Portal',
        seoTitle: 'Online Exam System',
        seoDescription: 'Professional online examination platform',
        examHeaderText: 'Welcome to the Examination Portal',
        examFooterText: 'Good luck with your exam!',
        showProgressBar: true,
        showQuestionNumbers: true,
        questionsPerPage: 1
    });

    const [uploading, setUploading] = useState({
        siteLogo: false,
        siteFavIcon: false,
        siteSmallLogo: false,
        digitalSignature: false
    });

    useEffect(() => {
        if (settings && settings.general) {
            setFormData(settings.general);
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

        const formData = new FormData();
        formData.append('file', file);
        formData.append('field', field);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
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
        if (settings && settings.general) {
            setFormData(settings.general);
        }
    };

    const timeZones = [
        'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
        'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
        'Asia/Kolkata', 'Australia/Sydney'
    ];

    return (
        <form onSubmit={handleSubmit}>
            <div className="row g-4">
                {/* Admin Information */}
                <div className="col-12">
                    <h6 className="fw-bold text-primary mb-3 d-flex align-items-center">
                        <FiUser className="me-2" /> Admin Information
                    </h6>
                </div>

                <div className="col-md-6">
                    <label className="form-label">
                        <FiUser className="me-1" /> Admin Name
                    </label>
                    <input
                        type="text"
                        name="adminName"
                        className="form-control"
                        value={formData.adminName}
                        readOnly
                        style={{ backgroundColor: '#f8f9fa' }}
                    />
                    <small className="text-muted">Read-only field</small>
                </div>

                <div className="col-md-6">
                    <label className="form-label">
                        <FiMail className="me-1" /> Contact Email
                    </label>
                    <input
                        type="email"
                        name="contactEmail"
                        className="form-control"
                        value={formData.contactEmail}
                        readOnly
                        style={{ backgroundColor: '#f8f9fa' }}
                    />
                    <small className="text-muted">Read-only field</small>
                </div>

                <div className="col-md-6">
                    <label className="form-label">
                        <FiPhone className="me-1" /> Phone Number
                    </label>
                    <input
                        type="tel"
                        name="phoneNumber"
                        className="form-control"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="+1 (555) 123-4567"
                    />
                </div>

                <div className="col-md-6">
                    <label className="form-label">
                        <FiGlobe className="me-1" /> Time Zone
                    </label>
                    <select
                        name="timeZone"
                        className="form-select"
                        value={formData.timeZone}
                        onChange={handleInputChange}
                    >
                        {timeZones.map(tz => (
                            <option key={tz} value={tz}>{tz}</option>
                        ))}
                    </select>
                </div>

                <div className="col-12">
                    <div className="form-check">
                        <input
                            type="checkbox"
                            name="emailNotifications"
                            className="form-check-input"
                            id="emailNotifications"
                            checked={formData.emailNotifications}
                            onChange={handleInputChange}
                        />
                        <label className="form-check-label" htmlFor="emailNotifications">
                            <FiBell className="me-1" /> Enable Email Notifications
                        </label>
                    </div>
                </div>

                {/* Site Branding */}
                <div className="col-12 mt-4">
                    <h6 className="fw-bold text-primary mb-3 d-flex align-items-center">
                        <FiImage className="me-2" /> Site Branding
                    </h6>
                </div>

                {[
                    { field: 'siteLogo', label: 'Site Logo', accept: 'image/*' },
                    { field: 'siteFavIcon', label: 'Site Favicon', accept: 'image/x-icon,image/png' },
                    { field: 'siteSmallLogo', label: 'Site Small Logo', accept: 'image/*' },
                    { field: 'digitalSignature', label: 'Digital Signature', accept: 'image/*' }
                ].map(({ field, label, accept }) => (
                    <div key={field} className="col-md-6">
                        <label className="form-label">{label}</label>
                        <div className="d-flex gap-2">
                            <input
                                type="text"
                                name={field}
                                className="form-control"
                                value={formData[field]}
                                onChange={handleInputChange}
                                placeholder={`Enter ${label.toLowerCase()} URL`}
                            />
                            <label className="btn btn-outline-primary">
                                {uploading[field] ? (
                                    <FiRefreshCw className="spin" />
                                ) : (
                                    <FiUpload />
                                )}
                                <input
                                    type="file"
                                    accept={accept}
                                    onChange={(e) => handleFileUpload(e, field)}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>
                        {formData[field] && (
                            <div className="mt-2">
                                <img
                                    src={formData[field]}
                                    alt={label}
                                    className="img-thumbnail"
                                    style={{ maxHeight: '50px', maxWidth: '100px' }}
                                />
                            </div>
                        )}
                    </div>
                ))}

                {/* Site Information */}
                <div className="col-12 mt-4">
                    <h6 className="fw-bold text-primary mb-3 d-flex align-items-center">
                        <FiType className="me-2" /> Site Information
                    </h6>
                </div>

                <div className="col-md-6">
                    <label className="form-label">Site Name</label>
                    <input
                        type="text"
                        name="siteName"
                        className="form-control"
                        value={formData.siteName}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="col-md-6">
                    <label className="form-label">SEO Title</label>
                    <input
                        type="text"
                        name="seoTitle"
                        className="form-control"
                        value={formData.seoTitle}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="col-12">
                    <label className="form-label">SEO Description</label>
                    <textarea
                        name="seoDescription"
                        className="form-control"
                        rows="3"
                        value={formData.seoDescription}
                        onChange={handleInputChange}
                    />
                </div>

                {/* Exam Configuration */}
                <div className="col-12 mt-4">
                    <h6 className="fw-bold text-primary mb-3 d-flex align-items-center">
                        <FiSettings className="me-2" /> Exam Configuration
                    </h6>
                </div>

                <div className="col-md-6">
                    <label className="form-label">Exam Header Text</label>
                    <input
                        type="text"
                        name="examHeaderText"
                        className="form-control"
                        value={formData.examHeaderText}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="col-md-6">
                    <label className="form-label">Exam Footer Text</label>
                    <input
                        type="text"
                        name="examFooterText"
                        className="form-control"
                        value={formData.examFooterText}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="col-md-4">
                    <label className="form-label">Questions Per Page</label>
                    <select
                        name="questionsPerPage"
                        className="form-select"
                        value={formData.questionsPerPage}
                        onChange={handleInputChange}
                    >
                        <option value={1}>1 Question</option>
                        <option value={5}>5 Questions</option>
                        <option value={10}>10 Questions</option>
                        <option value={20}>20 Questions</option>
                    </select>
                </div>

                <div className="col-md-8">
                    <label className="form-label">Display Options</label>
                    <div className="d-flex gap-4 mt-2">
                        <div className="form-check">
                            <input
                                type="checkbox"
                                name="showProgressBar"
                                className="form-check-input"
                                id="showProgressBar"
                                checked={formData.showProgressBar}
                                onChange={handleInputChange}
                            />
                            <label className="form-check-label" htmlFor="showProgressBar">
                                <FiBarChart className="me-1" /> Show Progress Bar
                            </label>
                        </div>
                        <div className="form-check">
                            <input
                                type="checkbox"
                                name="showQuestionNumbers"
                                className="form-check-input"
                                id="showQuestionNumbers"
                                checked={formData.showQuestionNumbers}
                                onChange={handleInputChange}
                            />
                            <label className="form-check-label" htmlFor="showQuestionNumbers">
                                Show Question Numbers
                            </label>
                        </div>
                    </div>
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

export default GeneralSettings;