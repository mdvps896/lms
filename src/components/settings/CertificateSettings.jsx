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
        fontFamily: 'Georgia, serif'
    });

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

    const handleSave = async () => {
        try {
            await onUpdate(certificateConfig);
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
                            <h6 className="text-primary mb-3">Signatures</h6>
                            
                            <div className="mb-3">
                                <label className="form-label">Left Signature Title</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={certificateConfig.signatureTitle1}
                                    onChange={(e) => handleChange('signatureTitle1', e.target.value)}
                                    placeholder="Administrator"
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Left Signature Subtitle</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={certificateConfig.signatureSubtitle1}
                                    onChange={(e) => handleChange('signatureSubtitle1', e.target.value)}
                                    placeholder="Optional subtitle"
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Right Signature Title</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={certificateConfig.signatureTitle2}
                                    onChange={(e) => handleChange('signatureTitle2', e.target.value)}
                                    placeholder="Examiner"
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Right Signature Subtitle</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={certificateConfig.signatureSubtitle2}
                                    onChange={(e) => handleChange('signatureSubtitle2', e.target.value)}
                                    placeholder="Authorized Signatory"
                                />
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
                                padding: '60px',
                                background: `linear-gradient(135deg, ${certificateConfig.backgroundColor} 0%, #f8f9fa 100%)`,
                                border: `${certificateConfig.borderWidth}px solid ${certificateConfig.borderColor}`,
                                position: 'relative',
                                fontFamily: certificateConfig.fontFamily,
                                boxSizing: 'border-box'
                            }}>
                                {/* Decorative Border */}
                                <div style={{
                                    position: 'absolute',
                                    top: '40px',
                                    left: '40px',
                                    right: '40px',
                                    bottom: '40px',
                                    border: `3px solid ${certificateConfig.secondaryColor}`
                                }} />

                                {/* Watermark */}
                                {certificateConfig.watermarkEnabled && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        fontSize: '180px',
                                        fontWeight: 'bold',
                                        color: `rgba(0, 0, 0, ${certificateConfig.watermarkOpacity})`,
                                        zIndex: 0,
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {certificateConfig.siteName.toUpperCase()}
                                    </div>
                                )}

                                {/* Content */}
                                <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
                                    {/* Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                        {certificateConfig.showCertificateId && (
                                            <div style={{ fontSize: '12px', color: '#666' }}>
                                                <strong>Certificate ID:</strong> CERT-12345678
                                            </div>
                                        )}
                                    </div>

                                    {/* Site Name */}
                                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                        <h1 style={{
                                            fontSize: '32px',
                                            fontWeight: 'bold',
                                            color: certificateConfig.primaryColor,
                                            margin: '0',
                                            textTransform: 'uppercase',
                                            letterSpacing: '2px'
                                        }}>
                                            {certificateConfig.siteName || 'Your Institution'}
                                        </h1>
                                        <p style={{ fontSize: '14px', color: '#666', margin: '5px 0 0 0' }}>
                                            {certificateConfig.tagline}
                                        </p>
                                    </div>

                                    {/* Certificate Title */}
                                    <div style={{ textAlign: 'center', marginBottom: '30px', marginTop: '30px' }}>
                                        <h2 style={{
                                            fontSize: `${certificateConfig.titleFontSize}px`,
                                            fontWeight: 'bold',
                                            color: certificateConfig.secondaryColor,
                                            margin: '0',
                                            textTransform: 'uppercase',
                                            letterSpacing: '4px'
                                        }}>
                                            CERTIFICATE
                                        </h2>
                                        <div style={{
                                            width: '200px',
                                            height: '3px',
                                            background: certificateConfig.primaryColor,
                                            margin: '15px auto'
                                        }} />
                                        <p style={{ fontSize: '18px', color: '#666', margin: '10px 0 0 0', fontStyle: 'italic' }}>
                                            of Achievement
                                        </p>
                                    </div>

                                    {/* Body */}
                                    <div style={{ textAlign: 'center', marginTop: '40px', marginBottom: '40px' }}>
                                        <p style={{ fontSize: `${certificateConfig.bodyFontSize}px`, color: '#333', marginBottom: '20px' }}>
                                            This is to certify that
                                        </p>
                                        
                                        <h3 style={{
                                            fontSize: `${certificateConfig.nameFontSize}px`,
                                            fontWeight: 'bold',
                                            color: '#000',
                                            margin: '20px 0',
                                            fontFamily: certificateConfig.fontFamily,
                                            fontStyle: 'italic',
                                            borderBottom: `2px solid ${certificateConfig.primaryColor}`,
                                            paddingBottom: '10px',
                                            display: 'inline-block'
                                        }}>
                                            {previewData.studentName}
                                        </h3>

                                        <p style={{ 
                                            fontSize: `${certificateConfig.bodyFontSize}px`, 
                                            color: '#333', 
                                            margin: '30px 60px', 
                                            lineHeight: '1.8' 
                                        }}>
                                            has successfully completed the examination titled<br/>
                                            <strong style={{ fontSize: `${certificateConfig.bodyFontSize + 4}px`, color: certificateConfig.primaryColor }}>
                                                "{previewData.examName}"
                                            </strong><br/>
                                            and achieved a score of<br/>
                                            <strong style={{ fontSize: `${certificateConfig.bodyFontSize + 10}px`, color: certificateConfig.secondaryColor }}>
                                                {previewData.score}%
                                            </strong>
                                        </p>

                                        {certificateConfig.showDate && (
                                            <p style={{ fontSize: '16px', color: '#666', marginTop: '30px' }}>
                                                Awarded on <strong>{previewData.date}</strong>
                                            </p>
                                        )}
                                    </div>

                                    {/* Footer Signatures */}
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '0',
                                        left: '0',
                                        right: '0',
                                        display: 'flex',
                                        justifyContent: 'space-around',
                                        paddingTop: '20px',
                                        borderTop: `2px solid ${certificateConfig.primaryColor}`
                                    }}>
                                        <div style={{ textAlign: 'center', flex: 1 }}>
                                            <div style={{ borderTop: '2px solid #333', width: '200px', margin: '0 auto 10px' }} />
                                            <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                                                {certificateConfig.signatureTitle1}
                                            </p>
                                            {certificateConfig.signatureSubtitle1 && (
                                                <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
                                                    {certificateConfig.signatureSubtitle1}
                                                </p>
                                            )}
                                        </div>

                                        {certificateConfig.showSeal && (
                                            <div style={{ textAlign: 'center', flex: 1 }}>
                                                <div style={{
                                                    width: '80px',
                                                    height: '80px',
                                                    border: `3px solid ${certificateConfig.primaryColor}`,
                                                    borderRadius: '50%',
                                                    margin: '0 auto 10px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    background: 'white'
                                                }}>
                                                    <div style={{
                                                        fontSize: '12px',
                                                        fontWeight: 'bold',
                                                        color: certificateConfig.primaryColor,
                                                        textAlign: 'center'
                                                    }}>
                                                        {certificateConfig.sealText.split(' ').map((word, i) => (
                                                            <div key={i}>{word}</div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ textAlign: 'center', flex: 1 }}>
                                            <div style={{ borderTop: '2px solid #333', width: '200px', margin: '0 auto 10px' }} />
                                            <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                                                {certificateConfig.signatureTitle2}
                                            </p>
                                            <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
                                                {certificateConfig.signatureSubtitle2}
                                            </p>
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
