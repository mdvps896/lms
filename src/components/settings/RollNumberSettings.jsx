'use client';
import React, { useState, useEffect } from 'react';
import { FiHash, FiSave } from 'react-icons/fi';

const RollNumberSettings = ({ settings, onUpdate, saving }) => {
    const [formData, setFormData] = useState({
        prefix: '',
        startFrom: 1001,
        currentNumber: 1001,
        digitLength: 4,
        enabled: false
    });

    useEffect(() => {
        if (settings?.rollNumberSettings) {
            setFormData({
                prefix: settings.rollNumberSettings.prefix || '',
                startFrom: settings.rollNumberSettings.startFrom || 1001,
                currentNumber: settings.rollNumberSettings.currentNumber || 1001,
                digitLength: settings.rollNumberSettings.digitLength || 4,
                enabled: settings.rollNumberSettings.enabled || false
            });
        }
    }, [settings]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onUpdate(formData);
    };

    // Generate preview roll number
    const generatePreview = () => {
        if (!formData.enabled || !formData.prefix) return 'Disabled';
        const number = String(formData.currentNumber).padStart(formData.digitLength, '0');
        return `${formData.prefix}${number}`;
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="row g-4">
                {/* Enable/Disable Roll Number */}
                <div className="col-12">
                    <div className="card bg-light border-0">
                        <div className="card-body">
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="enabled"
                                    name="enabled"
                                    checked={formData.enabled}
                                    onChange={handleChange}
                                />
                                <label className="form-check-label" htmlFor="enabled">
                                    <strong>Enable Automatic Roll Number Assignment</strong>
                                    <p className="text-muted small mb-0">
                                        Automatically assign roll numbers to new users during registration
                                    </p>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Roll Number Preview */}
                <div className="col-12">
                    <div className="alert alert-info d-flex align-items-center">
                        <FiHash className="me-2" size={24} />
                        <div>
                            <strong>Preview Roll Number:</strong>
                            <h4 className="mb-0 mt-1">{generatePreview()}</h4>
                        </div>
                    </div>
                </div>

                {/* Prefix */}
                <div className="col-md-6">
                    <label htmlFor="prefix" className="form-label">
                        Roll Number Prefix <span className="text-danger">*</span>
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        id="prefix"
                        name="prefix"
                        value={formData.prefix || ''}
                        onChange={handleChange}
                        disabled={!formData.enabled}
                        placeholder="e.g., STU, ROLL, EMP"
                        maxLength={10}
                        required={formData.enabled}
                    />
                    <small className="text-muted">
                        Prefix to be added before the roll number (e.g., STU, ROLL, EMP)
                    </small>
                </div>

                {/* Digit Length */}
                <div className="col-md-6">
                    <label htmlFor="digitLength" className="form-label">
                        Roll Number Digit Length <span className="text-danger">*</span>
                    </label>
                    <input
                        type="number"
                        className="form-control"
                        id="digitLength"
                        name="digitLength"
                        value={formData.digitLength}
                        onChange={handleChange}
                        disabled={!formData.enabled}
                        min={3}
                        max={8}
                        required={formData.enabled}
                    />
                    <small className="text-muted">
                        Number of digits in roll number (3-8). E.g., 4 digits = 0001, 0002
                    </small>
                </div>

                {/* Start From */}
                <div className="col-md-6">
                    <label htmlFor="startFrom" className="form-label">
                        Start From Number <span className="text-danger">*</span>
                    </label>
                    <input
                        type="number"
                        className="form-control"
                        id="startFrom"
                        name="startFrom"
                        value={formData.startFrom}
                        onChange={handleChange}
                        disabled={!formData.enabled}
                        min={1}
                        required={formData.enabled}
                    />
                    <small className="text-muted">
                        Initial number for roll number sequence (e.g., 1001, 2000)
                    </small>
                </div>

                {/* Current Number (Read-only) */}
                <div className="col-md-6">
                    <label htmlFor="currentNumber" className="form-label">
                        Current Number (Next to be assigned)
                    </label>
                    <input
                        type="number"
                        className="form-control"
                        id="currentNumber"
                        name="currentNumber"
                        value={formData.currentNumber}
                        readOnly
                        disabled
                    />
                    <small className="text-muted">
                        This number auto-increments with each new user registration
                    </small>
                </div>

                {/* Examples */}
                <div className="col-12">
                    <div className="card border-0 bg-light">
                        <div className="card-body">
                            <h6 className="card-title">Examples:</h6>
                            <ul className="mb-0">
                                <li><code>Prefix: STU, Length: 4, Start: 1001</code> → STU1001, STU1002, STU1003...</li>
                                <li><code>Prefix: ROLL, Length: 5, Start: 10000</code> → ROLL10000, ROLL10001, ROLL10002...</li>
                                <li><code>Prefix: EMP, Length: 6, Start: 100001</code> → EMP100001, EMP100002, EMP100003...</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="col-12">
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={saving}
                    >
                        <FiSave className="me-2" />
                        {saving ? 'Saving...' : 'Save Roll Number Settings'}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default RollNumberSettings;
