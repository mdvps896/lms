'use client';
import React, { useState, useEffect } from 'react';
import { FiSave, FiRefreshCw, FiEdit, FiMonitor, FiSidebar, FiType, FiEdit3 } from 'react-icons/fi';
import ColorPicker from '../shared/ColorPicker';
import { useSettings } from '@/contexts/SettingsContext';

const ThemeDesignSettings = ({ settings, onUpdate, saving }) => {
    const { refreshSettings } = useSettings();
    const [formData, setFormData] = useState({
        uiCustomization: {
            primaryColor: '#0d6efd',
            secondaryColor: '#6c757d',
            sidebarBackground: '#212529',
            sidebarTextColor: '#ffffff',
            sidebarHoverColor: '#495057',
            activeMenuColor: '#0d6efd',
            activeMenuText: '#ffffff',
            topBarBackground: '#ffffff',
            topBarTextColor: '#212529',
            buttonHoverColor: '#0b5ed7',
            fontFamily: 'Poppins',
            fontSize: '14px'
        },
        examDesign: {
            headerColor: '#0d6efd',
            primaryColor: '#0d6efd',
            secondaryColor: '#6c757d',
            buttonColor: '#0d6efd'
        }
    });

    useEffect(() => {
        if (settings && settings.themeDesign) {
            setFormData(settings.themeDesign);
        }
    }, [settings]);

    // Apply theme colors to CSS custom properties in real-time
    useEffect(() => {
        applyThemeColors();
    }, [formData]);

    const applyThemeColors = () => {
        const root = document.documentElement;
        const { uiCustomization } = formData;
        
        // Apply sidebar colors as CSS custom properties
        root.style.setProperty('--sidebar-bg-color', uiCustomization.sidebarBackground);
        root.style.setProperty('--sidebar-text-color', uiCustomization.sidebarTextColor);
        root.style.setProperty('--sidebar-hover-color', uiCustomization.sidebarHoverColor);
        root.style.setProperty('--active-menu-color', uiCustomization.activeMenuColor);
        root.style.setProperty('--active-menu-text', uiCustomization.activeMenuText);
        root.style.setProperty('--primary-color', uiCustomization.primaryColor);
        root.style.setProperty('--secondary-color', uiCustomization.secondaryColor);
        root.style.setProperty('--topbar-bg-color', uiCustomization.topBarBackground);
        root.style.setProperty('--topbar-text-color', uiCustomization.topBarTextColor);
        root.style.setProperty('--button-hover-color', uiCustomization.buttonHoverColor);
    };

    const handleInputChange = (section, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await onUpdate(formData);
        if (success) {
            // Refresh settings context after successful update
            await refreshSettings();
        }
    };

    const handleReset = () => {
        if (settings && settings.themeDesign) {
            setFormData(settings.themeDesign);
        }
    };

    const fontFamilies = [
        'Poppins', 'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 
        'Verdana', 'Tahoma', 'Trebuchet MS', 'Impact', 'Comic Sans MS'
    ];

    const fontSizes = ['12px', '13px', '14px', '15px', '16px', '18px', '20px'];

    const ColorInput = ({ label, value, onChange, description }) => (
        <ColorPicker
            label={label}
            value={value}
            onChange={onChange}
            description={description}
            className="col-md-6"
            presetColors={[
                '#0d6efd', '#6c757d', '#28a745', '#dc3545', '#ffc107', '#17a2b8',
                '#343a40', '#f8f9fa', '#007bff', '#6f42c1', '#e83e8c', '#fd7e14',
                '#20c997', '#6610f2', '#198754', '#0dcaf0', '#212529', '#ffffff'
            ]}
        />
    );

    return (
        <form onSubmit={handleSubmit}>
            <div className="row g-4">
                {/* UI Customization */}
                <div className="col-12">
                    <h6 className="fw-bold text-primary mb-3 d-flex align-items-center">
                        <FiEdit className="me-2" /> UI Customization Settings
                    </h6>
                    <p className="text-muted">Customize the appearance and colors of your admin panel</p>
                </div>

                {/* Brand Colors */}
                <div className="col-12">
                    <h6 className="fw-medium mb-3">Brand Colors</h6>
                </div>

                <ColorInput
                    label="Primary Color"
                    value={formData.uiCustomization.primaryColor}
                    onChange={(value) => handleInputChange('uiCustomization', 'primaryColor', value)}
                    description="Main brand color for buttons and highlights"
                />

                <ColorInput
                    label="Secondary Color"
                    value={formData.uiCustomization.secondaryColor}
                    onChange={(value) => handleInputChange('uiCustomization', 'secondaryColor', value)}
                    description="Secondary color for text and borders"
                />

                <ColorInput
                    label="Button Hover Color"
                    value={formData.uiCustomization.buttonHoverColor}
                    onChange={(value) => handleInputChange('uiCustomization', 'buttonHoverColor', value)}
                    description="Color when hovering over buttons"
                />

                {/* Sidebar Colors */}
                <div className="col-12 mt-4">
                    <h6 className="fw-medium mb-3 d-flex align-items-center">
                        <FiSidebar className="me-2" /> Sidebar Colors
                    </h6>
                </div>

                <ColorInput
                    label="Sidebar Background"
                    value={formData.uiCustomization.sidebarBackground}
                    onChange={(value) => handleInputChange('uiCustomization', 'sidebarBackground', value)}
                    description="Background color for sidebar"
                />

                <ColorInput
                    label="Sidebar Text Color"
                    value={formData.uiCustomization.sidebarTextColor}
                    onChange={(value) => handleInputChange('uiCustomization', 'sidebarTextColor', value)}
                    description="Text color for sidebar menu items"
                />

                <ColorInput
                    label="Sidebar Hover Color"
                    value={formData.uiCustomization.sidebarHoverColor}
                    onChange={(value) => handleInputChange('uiCustomization', 'sidebarHoverColor', value)}
                    description="Background color when hovering over sidebar items"
                />

                <ColorInput
                    label="Active Menu Color"
                    value={formData.uiCustomization.activeMenuColor}
                    onChange={(value) => handleInputChange('uiCustomization', 'activeMenuColor', value)}
                    description="Background color for active menu items"
                />

                <ColorInput
                    label="Active Menu Text"
                    value={formData.uiCustomization.activeMenuText}
                    onChange={(value) => handleInputChange('uiCustomization', 'activeMenuText', value)}
                    description="Text color for active menu items"
                />

                {/* Top Bar Colors */}
                <div className="col-12 mt-4">
                    <h6 className="fw-medium mb-3">Top Bar Colors</h6>
                </div>

                <ColorInput
                    label="Top Bar Background"
                    value={formData.uiCustomization.topBarBackground}
                    onChange={(value) => handleInputChange('uiCustomization', 'topBarBackground', value)}
                    description="Background color for top navigation bar"
                />

                <ColorInput
                    label="Top Bar Text Color"
                    value={formData.uiCustomization.topBarTextColor}
                    onChange={(value) => handleInputChange('uiCustomization', 'topBarTextColor', value)}
                    description="Text color for top navigation bar"
                />

                {/* Typography */}
                <div className="col-12 mt-4">
                    <h6 className="fw-medium mb-3 d-flex align-items-center">
                        <FiType className="me-2" /> Typography
                    </h6>
                </div>

                <div className="col-md-6">
                    <label className="form-label">Font Family</label>
                    <select
                        value={formData.uiCustomization.fontFamily}
                        onChange={(e) => handleInputChange('uiCustomization', 'fontFamily', e.target.value)}
                        className="form-select"
                    >
                        {fontFamilies.map(font => (
                            <option key={font} value={font}>{font}</option>
                        ))}
                    </select>
                    <small className="text-muted">Font family for the interface</small>
                </div>

                <div className="col-md-6">
                    <label className="form-label">Font Size</label>
                    <select
                        value={formData.uiCustomization.fontSize}
                        onChange={(e) => handleInputChange('uiCustomization', 'fontSize', e.target.value)}
                        className="form-select"
                    >
                        {fontSizes.map(size => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                    <small className="text-muted">Base font size for the interface</small>
                </div>

                {/* Exam Design Settings */}
                <div className="col-12 mt-5">
                    <h6 className="fw-bold text-primary mb-3 d-flex align-items-center">
                        <FiEdit3 className="me-2" /> Exam Design Settings
                    </h6>
                    <p className="text-muted">Customize the appearance of the exam interface for students</p>
                </div>

                <ColorInput
                    label="Exam Header Color"
                    value={formData.examDesign.headerColor}
                    onChange={(value) => handleInputChange('examDesign', 'headerColor', value)}
                    description="Header background color for exam pages"
                />

                <ColorInput
                    label="Exam Primary Color"
                    value={formData.examDesign.primaryColor}
                    onChange={(value) => handleInputChange('examDesign', 'primaryColor', value)}
                    description="Primary color for exam interface elements"
                />

                <ColorInput
                    label="Exam Secondary Color"
                    value={formData.examDesign.secondaryColor}
                    onChange={(value) => handleInputChange('examDesign', 'secondaryColor', value)}
                    description="Secondary color for exam interface"
                />

                <ColorInput
                    label="Exam Button Color"
                    value={formData.examDesign.buttonColor}
                    onChange={(value) => handleInputChange('examDesign', 'buttonColor', value)}
                    description="Button color for exam navigation and actions"
                />

                {/* Preview Section */}
                <div className="col-12 mt-4">
                    <h6 className="fw-bold text-secondary mb-3">Live Preview</h6>
                    <div className="card border">
                        <div 
                            className="card-header text-white d-flex justify-content-between align-items-center"
                            style={{ backgroundColor: formData.uiCustomization.topBarBackground, color: formData.uiCustomization.topBarTextColor }}
                        >
                            <span style={{ fontFamily: formData.uiCustomization.fontFamily, fontSize: formData.uiCustomization.fontSize }}>
                                Admin Panel Preview
                            </span>
                            <button 
                                className="btn btn-sm"
                                style={{ 
                                    backgroundColor: formData.uiCustomization.primaryColor,
                                    borderColor: formData.uiCustomization.primaryColor,
                                    color: 'white'
                                }}
                            >
                                Sample Button
                            </button>
                        </div>
                        <div className="card-body p-0">
                            <div className="row g-0">
                                <div className="col-3" style={{ backgroundColor: formData.uiCustomization.sidebarBackground }}>
                                    <div className="p-3">
                                        <div 
                                            className="p-2 mb-2 rounded"
                                            style={{ 
                                                backgroundColor: formData.uiCustomization.activeMenuColor,
                                                color: formData.uiCustomization.activeMenuText,
                                                fontFamily: formData.uiCustomization.fontFamily,
                                                fontSize: formData.uiCustomization.fontSize
                                            }}
                                        >
                                            Active Menu
                                        </div>
                                        <div 
                                            className="p-2 rounded"
                                            style={{ 
                                                color: formData.uiCustomization.sidebarTextColor,
                                                fontFamily: formData.uiCustomization.fontFamily,
                                                fontSize: formData.uiCustomization.fontSize
                                            }}
                                        >
                                            Menu Item
                                        </div>
                                    </div>
                                </div>
                                <div className="col-9">
                                    <div className="p-3">
                                        <p style={{ fontFamily: formData.uiCustomization.fontFamily, fontSize: formData.uiCustomization.fontSize }}>
                                            This is how your admin panel will look with the selected theme.
                                        </p>
                                    </div>
                                </div>
                            </div>
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

export default ThemeDesignSettings;