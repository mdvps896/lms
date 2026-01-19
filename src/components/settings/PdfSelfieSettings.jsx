'use client';
import React, { useState, useEffect } from 'react';
import { FiCamera, FiClock, FiCheck, FiSave, FiInfo } from 'react-icons/fi';

const PdfSelfieSettings = ({ settings, onUpdate, saving }) => {
    const [formData, setFormData] = useState({
        enabled: true,
        intervalInMinutes: 5,
        captureOnStart: true,
        captureOnEnd: false
    });

    useEffect(() => {
        if (settings?.pdfSelfieSettings) {
            setFormData({
                enabled: settings.pdfSelfieSettings.enabled ?? true,
                intervalInMinutes: settings.pdfSelfieSettings.intervalInMinutes ?? 5,
                captureOnStart: settings.pdfSelfieSettings.captureOnStart ?? true,
                captureOnEnd: settings.pdfSelfieSettings.captureOnEnd ?? false
            });
        }
    }, [settings]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        onUpdate(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="animate__animated animate__fadeIn">
            <div className="row g-4">
                <div className="col-12">
                    <div className="alert alert-soft-primary d-flex align-items-center gap-3 p-3 mb-4">
                        <FiInfo className="text-primary flex-shrink-0" size={24} />
                        <div>
                            <p className="mb-0 fs-13">
                                Configure how periodic attendance selfies are captured when students view PDF materials in the mobile app.
                                These settings are synced to the mobile app in real-time.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="col-md-12">
                    <div className="form-check form-switch card p-3 border shadow-none mb-3">
                        <div className="d-flex justify-content-between align-items-center w-100">
                            <div>
                                <h6 className="mb-1 fw-bold">Enable PDF Attendance Selfies</h6>
                                <p className="text-muted small mb-0">When enabled, the app will automatically capture student selfies during PDF viewing.</p>
                            </div>
                            <input
                                className="form-check-input h4 mb-0"
                                type="checkbox"
                                checked={formData.enabled}
                                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                            />
                        </div>
                    </div>
                </div>

                {formData.enabled && (
                    <>
                        <div className="col-md-6">
                            <label className="form-label fw-bold small d-flex align-items-center gap-2">
                                <FiClock size={14} className="text-primary" />
                                Capture Interval (Minutes)
                            </label>
                            <div className="input-group">
                                <input
                                    type="number"
                                    className="form-control"
                                    placeholder="e.g., 5"
                                    min="1"
                                    max="60"
                                    value={formData.intervalInMinutes}
                                    onChange={(e) => setFormData({ ...formData, intervalInMinutes: parseInt(e.target.value) || 1 })}
                                />
                                <span className="input-group-text">minutes</span>
                            </div>
                            <div className="form-text fs-12 text-muted mt-1">
                                A selfie will be captured every {formData.intervalInMinutes} minutes during the session.
                            </div>
                        </div>

                        <div className="col-md-6">
                            <div className="card p-3 bg-light border-0 shadow-none h-100 d-flex flex-column justify-content-center">
                                <div className="form-check mb-2">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="captureOnStart"
                                        checked={formData.captureOnStart}
                                        onChange={(e) => setFormData({ ...formData, captureOnStart: e.target.checked })}
                                    />
                                    <label className="form-check-label fw-semibold" htmlFor="captureOnStart">
                                        Capture Initial Selfie
                                    </label>
                                    <p className="text-muted small mb-0">Capture a photo the moment the PDF starts.</p>
                                </div>
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="captureOnEnd"
                                        checked={formData.captureOnEnd}
                                        onChange={(e) => setFormData({ ...formData, captureOnEnd: e.target.checked })}
                                    />
                                    <label className="form-check-label fw-semibold" htmlFor="captureOnEnd">
                                        Capture Exit Selfie
                                    </label>
                                    <p className="text-muted small mb-0">Capture a photo when the student closes the PDF.</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <div className="col-12 mt-4 pt-3 border-top">
                    <button
                        type="submit"
                        className="btn btn-primary px-4 py-2 d-flex align-items-center gap-2 shadow-sm"
                        disabled={saving}
                    >
                        {saving ? (
                            <><span className="spinner-border spinner-border-sm"></span> Saving...</>
                        ) : (
                            <><FiSave /> Save Changes</>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default PdfSelfieSettings;
