'use client';
import React, { useState, useEffect } from 'react';
import { FiUpload, FiEye } from 'react-icons/fi';
import { toast } from 'react-toastify';

const CertificateSettings = ({ settings, onUpdate, saving }) => {
    const [certificateConfig, setCertificateConfig] = useState({
        siteName: '',
        tagline: 'Excellence in Education',
        primaryColor: '#0891b2',
        secondaryColor: '#4361ee',
        backgroundColor: '#ffffff',
        borderColor: '#0891b2',
        borderWidth: 20,
        watermarkOpacity: 0.03,
        watermarkEnabled: true,
        titleFontSize: 48,
        nameFontSize: 42,
        bodyFontSize: 18,
        signatureTitle1: 'Administrator',
        signatureSubtitle1: '',
        signatureTitle2: 'Examiner',
        signatureSubtitle2: 'Authorized Signatory',
        sealText: 'OFFICIAL SEAL',
        showSeal: true,
        showCertificateId: true,
        showDate: true,
        fontFamily: 'Georgia, serif',
        logo: '',
        signatureImage1: '',
        signatureImage2: ''
    });

    const [uploading, setUploading] = useState(false);

    const [previewData, setPreviewData] = useState({
        studentName: 'John Doe',
        examName: 'Sample Examination',
        score: 85.50,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    });

    useEffect(() => {
        if (settings?.certificateSettings) {
            setCertificateConfig({ ...certificateConfig, ...settings.certificateSettings });
        } else if (settings?.siteSettings?.siteName) {
            setCertificateConfig({ ...certificateConfig, siteName: settings.siteSettings.siteName });
        }
    }, [settings]);

    const handleChange = (field, value) => {
        setCertificateConfig(prev => ({ ...prev, [field]: value }));
    };

    const handleImageUpload = async (file, field) => {
        if (!file) return;
        
        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'certificates');

            const response = await fetch('/api/storage/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (data.success) {
                const updatedConfig = { ...certificateConfig, [field]: data.url };
                setCertificateConfig(updatedConfig);
                
                // Automatically save to database
                await onUpdate(updatedConfig);
                toast.success('Image uploaded and saved successfully');
            } else {
                throw new Error(data.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        try {
            await onUpdate(certificateConfig);
            toast.success('Certificate settings saved successfully');
        } catch (error) {
            console.error('Error saving certificate settings:', error);
            toast.error('Failed to save certificate settings');
        }
    };

    return (
        <div className="row">
            {/* Left Side - Settings Form */}
            <div className="col-lg-5">
                <div className="card border-0 shadow-sm mb-4">
                    <div className="card-header bg-white">
                        <h5 className="mb-0">Certificate Configuration</h5>
                    </div>
                    <div className="card-body" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                        {/* Site Information */}
                        <div className="mb-4">
                            <h6 className="text-primary mb-3">Site Information</h6>
                            
                            <div className="mb-3">
                                <label className="form-label">Site Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={certificateConfig.siteName}
                                    onChange={(e) => handleChange('siteName', e.target.value)}
                                    placeholder="Your Institution Name"
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Tagline</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={certificateConfig.tagline}
                                    onChange={(e) => handleChange('tagline', e.target.value)}
                                    placeholder="Excellence in Education"
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Certificate Logo (Top Left)</label>
                                <input
                                    type="file"
                                    className="form-control mb-2"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e.target.files[0], 'logo')}
                                    disabled={uploading}
                                />
                                <input
                                    type="url"
                                    className="form-control"
                                    value={certificateConfig.logo}
                                    onChange={(e) => handleChange('logo', e.target.value)}
                                    placeholder="Or enter image URL"
                                />
                                {certificateConfig.logo && (
                                    <div className="mt-2">
                                        <img src={certificateConfig.logo} alt="Logo" style={{ height: '50px' }} />
                                    </div>
                                )}
                                <small className="text-muted">Upload file or enter URL</small>
                            </div>
                        </div>

                        {/* Colors */}
                        <div className="mb-4">
                            <h6 className="text-primary mb-3">Colors</h6>
                            
                            <div className="row">
                                <div className="col-6 mb-3">
                                    <label className="form-label">Primary Color</label>
                                    <input
                                        type="color"
                                        className="form-control form-control-color"
                                        value={certificateConfig.primaryColor}
                                        onChange={(e) => handleChange('primaryColor', e.target.value)}
                                    />
                                </div>

                                <div className="col-6 mb-3">
                                    <label className="form-label">Secondary Color</label>
                                    <input
                                        type="color"
                                        className="form-control form-control-color"
                                        value={certificateConfig.secondaryColor}
                                        onChange={(e) => handleChange('secondaryColor', e.target.value)}
                                    />
                                </div>

                                <div className="col-6 mb-3">
                                    <label className="form-label">Background Color</label>
                                    <input
                                        type="color"
                                        className="form-control form-control-color"
                                        value={certificateConfig.backgroundColor}
                                        onChange={(e) => handleChange('backgroundColor', e.target.value)}
                                    />
                                </div>

                                <div className="col-6 mb-3">
                                    <label className="form-label">Border Color</label>
                                    <input
                                        type="color"
                                        className="form-control form-control-color"
                                        value={certificateConfig.borderColor}
                                        onChange={(e) => handleChange('borderColor', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Typography */}
                        <div className="mb-4">
                            <h6 className="text-primary mb-3">Typography</h6>
                            
                            <div className="mb-3">
                                <label className="form-label">Font Family</label>
                                <select
                                    className="form-select"
                                    value={certificateConfig.fontFamily}
                                    onChange={(e) => handleChange('fontFamily', e.target.value)}
                                >
                                    <option value="Georgia, serif">Georgia (Serif)</option>
                                    <option value="Times New Roman, serif">Times New Roman (Serif)</option>
                                    <option value="Arial, sans-serif">Arial (Sans-serif)</option>
                                    <option value="Helvetica, sans-serif">Helvetica (Sans-serif)</option>
                                    <option value="Courier New, monospace">Courier New (Monospace)</option>
                                </select>
                            </div>

                            <div className="row">
                                <div className="col-4 mb-3">
                                    <label className="form-label small">Title Size</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={certificateConfig.titleFontSize}
                                        onChange={(e) => handleChange('titleFontSize', parseInt(e.target.value))}
                                        min="20"
                                        max="80"
                                    />
                                </div>

                                <div className="col-4 mb-3">
                                    <label className="form-label small">Name Size</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={certificateConfig.nameFontSize}
                                        onChange={(e) => handleChange('nameFontSize', parseInt(e.target.value))}
                                        min="20"
                                        max="60"
                                    />
                                </div>

                                <div className="col-4 mb-3">
                                    <label className="form-label small">Body Size</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={certificateConfig.bodyFontSize}
                                        onChange={(e) => handleChange('bodyFontSize', parseInt(e.target.value))}
                                        min="12"
                                        max="30"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Signatures */}
                        <div className="mb-4">
                            <h6 className="text-primary mb-3">Signature</h6>
                            
                            <div className="mb-3">
                                <label className="form-label">Signature Title</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={certificateConfig.signatureTitle2}
                                    onChange={(e) => handleChange('signatureTitle2', e.target.value)}
                                    placeholder="Examiner"
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Signature Subtitle</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={certificateConfig.signatureSubtitle2}
                                    onChange={(e) => handleChange('signatureSubtitle2', e.target.value)}
                                    placeholder="Authorized Signatory"
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Signature Image</label>
                                <input
                                    type="file"
                                    className="form-control mb-2"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e.target.files[0], 'signatureImage2')}
                                    disabled={uploading}
                                />
                                <input
                                    type="url"
                                    className="form-control"
                                    value={certificateConfig.signatureImage2}
                                    onChange={(e) => handleChange('signatureImage2', e.target.value)}
                                    placeholder="Or enter image URL"
                                />
                                {certificateConfig.signatureImage2 && (
                                    <div className="mt-2">
                                        <img src={certificateConfig.signatureImage2} alt="Signature" style={{ height: '40px' }} />
                                    </div>
                                )}
                                <small className="text-muted">Upload file or enter URL</small>
                            </div>
                        </div>

                        {/* Watermark */}
                        <div className="mb-4">
                            <h6 className="text-primary mb-3">Watermark</h6>
                            
                            <div className="form-check form-switch mb-3">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={certificateConfig.watermarkEnabled}
                                    onChange={(e) => handleChange('watermarkEnabled', e.target.checked)}
                                />
                                <label className="form-check-label">Enable Watermark</label>
                            </div>

                            {certificateConfig.watermarkEnabled && (
                                <div className="mb-3">
                                    <label className="form-label">Watermark Opacity</label>
                                    <input
                                        type="range"
                                        className="form-range"
                                        min="0.01"
                                        max="0.2"
                                        step="0.01"
                                        value={certificateConfig.watermarkOpacity}
                                        onChange={(e) => handleChange('watermarkOpacity', parseFloat(e.target.value))}
                                    />
                                    <small className="text-muted">Opacity: {certificateConfig.watermarkOpacity}</small>
                                </div>
                            )}
                        </div>

                        {/* Display Options */}
                        <div className="mb-4">
                            <h6 className="text-primary mb-3">Display Options</h6>
                            
                            <div className="form-check form-switch mb-2">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={certificateConfig.showSeal}
                                    onChange={(e) => handleChange('showSeal', e.target.checked)}
                                />
                                <label className="form-check-label">Show Official Seal</label>
                            </div>

                            <div className="form-check form-switch mb-2">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={certificateConfig.showCertificateId}
                                    onChange={(e) => handleChange('showCertificateId', e.target.checked)}
                                />
                                <label className="form-check-label">Show Certificate ID</label>
                            </div>

                            <div className="form-check form-switch mb-2">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={certificateConfig.showDate}
                                    onChange={(e) => handleChange('showDate', e.target.checked)}
                                />
                                <label className="form-check-label">Show Award Date</label>
                            </div>
                        </div>

                        {/* Save Button */}
                        <button
                            className="btn btn-primary w-100"
                            onClick={handleSave}
                        >
                            Save Certificate Settings
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Side - Live Preview */}
            <div className="col-lg-7">
                <div className="card border-0 shadow-sm sticky-top" style={{ top: '20px' }}>
                    <div className="card-header bg-white d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">
                            <FiEye className="me-2" />
                            Live Preview
                        </h5>
                        <small className="text-muted">Landscape A4 Format</small>
                    </div>
                    <div className="card-body bg-light">
                        <div style={{ 
                            transform: 'scale(0.5)', 
                            transformOrigin: 'top left',
                            width: '200%',
                            height: '794px'
                        }}>
                            <div style={{
                                width: '1122px',
                                height: '794px',
                                padding: '0',
                                background: '#f5f5f5',
                                position: 'relative',
                                fontFamily: certificateConfig.fontFamily,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <div style={{
                                    width: '1042px',
                                    height: '714px',
                                    background: 'white',
                                    border: `20px solid ${certificateConfig.borderColor}`,
                                    position: 'relative'
                                }}>
                                    {/* Inner Border */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '20px',
                                        left: '20px',
                                        right: '20px',
                                        bottom: '20px',
                                        border: `8px solid ${certificateConfig.secondaryColor}`,
                                        padding: '40px',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            {/* Header */}
                                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                                <h1 style={{
                                                    fontSize: '24px',
                                                    fontWeight: '600',
                                                    color: '#333',
                                                    margin: '0',
                                                    letterSpacing: '1px'
                                                }}>
                                                    {certificateConfig.siteName || 'Your Institution'}
                                                </h1>
                                            </div>

                                            {/* Certificate Title */}
                                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                                <h2 style={{
                                                    fontSize: `${certificateConfig.titleFontSize}px`,
                                                    color: '#6b7280',
                                                    margin: '0 0 10px 0',
                                                    fontWeight: '400',
                                                    letterSpacing: '2px'
                                                }}>
                                                    Certificate of Participation
                                                </h2>
                                            </div>

                                            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                                                <p style={{
                                                    fontSize: '14px',
                                                    color: '#9ca3af',
                                                    margin: '0',
                                                    fontStyle: 'italic'
                                                }}>
                                                    This certificate is proudly presented to
                                                </p>
                                            </div>

                                            {/* Student Name */}
                                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                                <h3 style={{
                                                    fontSize: `${certificateConfig.nameFontSize}px`,
                                                    fontWeight: 'bold',
                                                    color: certificateConfig.secondaryColor,
                                                    margin: '0',
                                                    letterSpacing: '1px'
                                                }}>
                                                    {previewData.studentName}
                                                </h3>
                                            </div>

                                            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                                                <p style={{
                                                    fontSize: '12px',
                                                    color: '#6b7280',
                                                    margin: '0 0 5px 0'
                                                }}>
                                                    for participating in the examination
                                                </p>
                                                <p style={{
                                                    fontSize: '16px',
                                                    fontWeight: 'bold',
                                                    color: '#1f2937',
                                                    margin: '0'
                                                }}>
                                                    ({previewData.examName})
                                                </p>
                                            </div>

                                            {/* Metrics Row */}
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-around',
                                                marginTop: '30px',
                                                marginBottom: '30px',
                                                padding: '0 40px'
                                            }}>
                                                <div style={{ textAlign: 'center', flex: 1 }}>
                                                    <div style={{
                                                        fontSize: '24px',
                                                        fontWeight: 'bold',
                                                        color: '#ef4444',
                                                        marginBottom: '5px'
                                                    }}>
                                                        {previewData.score}%
                                                    </div>
                                                    <div style={{ fontSize: '10px', color: '#6b7280' }}>Score</div>
                                                </div>
                                                <div style={{ textAlign: 'center', flex: 1 }}>
                                                    <div style={{
                                                        fontSize: '24px',
                                                        fontWeight: 'bold',
                                                        color: '#1f2937',
                                                        marginBottom: '5px'
                                                    }}>
                                                        8/10
                                                    </div>
                                                    <div style={{ fontSize: '10px', color: '#6b7280' }}>Marks</div>
                                                </div>
                                                <div style={{ textAlign: 'center', flex: 1 }}>
                                                    <div style={{
                                                        fontSize: '20px',
                                                        fontWeight: 'bold',
                                                        color: '#ef4444',
                                                        marginBottom: '5px'
                                                    }}>
                                                        PASSED
                                                    </div>
                                                    <div style={{ fontSize: '10px', color: '#6b7280' }}>Status</div>
                                                </div>
                                                <div style={{ textAlign: 'center', flex: 1 }}>
                                                    <div style={{
                                                        fontSize: '20px',
                                                        fontWeight: 'bold',
                                                        color: '#1f2937',
                                                        marginBottom: '5px'
                                                    }}>
                                                        1.5 min
                                                    </div>
                                                    <div style={{ fontSize: '10px', color: '#6b7280' }}>Duration</div>
                                                </div>
                                            </div>

                                            {/* Participated Badge */}
                                            <div style={{ textAlign: 'center', marginTop: '15px', marginBottom: '30px' }}>
                                                <div style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '80px',
                                                    height: '80px',
                                                    borderRadius: '50%',
                                                    background: '#3b82f6',
                                                    position: 'relative'
                                                }}>
                                                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                                                        <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                    <div style={{
                                                        position: 'absolute',
                                                        bottom: '-20px',
                                                        background: '#3b82f6',
                                                        color: 'white',
                                                        padding: '3px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '10px',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        PARTICIPATED
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-end',
                                                marginTop: 'auto',
                                                paddingTop: '20px',
                                                borderTop: '1px solid #e5e7eb'
                                            }}>
                                                <div style={{ textAlign: 'left', flex: 1 }}>
                                                    {certificateConfig.signatureImage2 && (
                                                        <img src={certificateConfig.signatureImage2} alt="Signature" style={{ height: '30px', width: 'auto', marginBottom: '5px' }} />
                                                    )}
                                                    <div style={{
                                                        borderTop: '2px solid #333',
                                                        width: '120px',
                                                        marginBottom: '5px'
                                                    }} />
                                                    <p style={{ margin: '0', fontSize: '10px', color: '#1f2937', fontWeight: '600' }}>
                                                        Authorized Signatory
                                                    </p>
                                                </div>
                                                <div style={{ textAlign: 'center', flex: 1 }}>
                                                    <div style={{
                                                        fontSize: '14px',
                                                        fontWeight: 'bold',
                                                        color: '#1f2937',
                                                        marginBottom: '5px'
                                                    }}>
                                                        {previewData.date}
                                                    </div>
                                                    <div style={{ fontSize: '10px', color: '#6b7280' }}>Issue Date</div>
                                                </div>
                                                <div style={{ textAlign: 'right', flex: 1 }}>
                                                    <div style={{
                                                        fontSize: '18px',
                                                        fontWeight: 'bold',
                                                        color: '#1f2937',
                                                        marginBottom: '5px'
                                                    }}>
                                                        90%
                                                    </div>
                                                    <div style={{ fontSize: '10px', color: '#6b7280' }}>Passing Grade</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CertificateSettings;
