'use client';
import React, { useState, useRef, useEffect } from 'react';
import { FiDroplet, FiCopy, FiCheck, FiRefreshCw } from 'react-icons/fi';

/**
 * Advanced Color Picker Component
 * 
 * Features:
 * - HTML5 color picker integration
 * - Preset color palette
 * - Text input with validation
 * - Copy to clipboard functionality
 * - Random color generator
 * - RGB color display
 * - Smooth animations
 * 
 * Usage Example:
 * ```jsx
 * const [color, setColor] = useState('#0d6efd');
 * 
 * <ColorPicker
 *   label="Primary Color"
 *   value={color}
 *   onChange={setColor}
 *   description="Choose your brand's primary color"
 *   presetColors={['#0d6efd', '#28a745', '#dc3545']}
 * />
 * ```
 */

const ColorPicker = ({ 
    label, 
    value, 
    onChange, 
    description, 
    className = "",
    disabled = false,
    presetColors = [
        '#0d6efd', '#6c757d', '#28a745', '#dc3545', '#ffc107', '#17a2b8',
        '#343a40', '#f8f9fa', '#007bff', '#6f42c1', '#e83e8c', '#fd7e14',
        '#20c997', '#6610f2', '#198754', '#0dcaf0', '#f8d7da', '#d1ecf1'
    ]
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value);
    const [tempColor, setTempColor] = useState(value); // Temporary color for preview
    const [copied, setCopied] = useState(false);
    const colorPickerRef = useRef(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        setInputValue(value);
        setTempColor(value);
    }, [value]);

    // Remove auto-close functionality - only close on OK/Cancel
    // useEffect for click outside is removed

    const handleTempColorChange = (newColor) => {
        setTempColor(newColor);
        setInputValue(newColor);
    };

    const handleOkClick = () => {
        onChange(tempColor);
        setIsOpen(false);
    };

    const handleCancelClick = () => {
        setTempColor(value);
        setInputValue(value);
        setIsOpen(false);
    };

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        
        // Validate hex color and update temp color
        if (/^#([0-9A-F]{3}){1,2}$/i.test(newValue) || newValue === '') {
            setTempColor(newValue);
        }
    };

    const handleInputBlur = () => {
        // If the input is invalid, revert to the original value
        if (!/^#([0-9A-F]{3}){1,2}$/i.test(inputValue) && inputValue !== '') {
            setInputValue(value);
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy color code');
        }
    };

    const generateRandomColor = () => {
        const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
        handleTempColorChange(randomColor);
    };

    const isValidColor = (color) => {
        return /^#([0-9A-F]{3}){1,2}$/i.test(color);
    };

    return (
        <div className={`color-picker-container ${className}`}>
            {label && <label className="form-label fw-medium">{label}</label>}
            
            <div className="position-relative" ref={dropdownRef}>
                <div className="d-flex gap-2 align-items-center">
                    {/* Color Display */}
                    <div 
                        className="color-preview-btn"
                        style={{
                            width: '50px',
                            height: '38px',
                            backgroundColor: isValidColor(isOpen ? tempColor : value) ? (isOpen ? tempColor : value) : '#f8f9fa',
                            border: '2px solid #dee2e6',
                            borderRadius: '8px',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            boxShadow: isOpen ? '0 0 0 0.2rem rgba(13, 110, 253, 0.25)' : 'none',
                            transition: 'all 0.15s ease-in-out',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        onClick={() => !disabled && setIsOpen(!isOpen)}
                        title="Click to open color picker"
                    >
                        {!isValidColor(isOpen ? tempColor : value) && (
                            <div className="d-flex align-items-center justify-content-center h-100">
                                <FiDroplet className="text-muted" size={16} />
                            </div>
                        )}
                    </div>

                    {/* Text Input */}
                    <input
                        type="text"
                        className="form-control"
                        value={inputValue}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        placeholder="#000000"
                        disabled={disabled}
                        style={{ 
                            fontFamily: 'monospace',
                            fontSize: '14px',
                            textTransform: 'uppercase'
                        }}
                        maxLength="7"
                    />

                    {/* Action Buttons */}
                    <div className="d-flex gap-1">
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={copyToClipboard}
                            disabled={!isValidColor(value)}
                            title="Copy color code"
                        >
                            {copied ? <FiCheck className="text-success" size={14} /> : <FiCopy size={14} />}
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={generateRandomColor}
                            disabled={disabled}
                            title="Generate random color"
                        >
                            <FiRefreshCw size={14} />
                        </button>
                    </div>
                </div>

                {/* Color Picker Dropdown */}
                {isOpen && (
                    <div 
                        className="color-picker-dropdown"
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            zIndex: 1050,
                            backgroundColor: '#fff',
                            border: '1px solid #dee2e6',
                            borderRadius: '8px',
                            padding: '15px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                            minWidth: '280px',
                            marginTop: '5px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Large Color Picker Area */}
                        <div className="mb-4">
                            <input
                                ref={colorPickerRef}
                                type="color"
                                value={isValidColor(tempColor) ? tempColor : '#000000'}
                                onChange={(e) => handleTempColorChange(e.target.value)}
                                className="w-100"
                                style={{ 
                                    height: '250px', 
                                    cursor: 'pointer', 
                                    border: 'none',
                                    borderRadius: '8px',
                                    outline: 'none'
                                }}
                                title="Choose color"
                            />
                        </div>

                        {/* Hex Input */}
                        <div className="mb-4">
                            <label className="form-label fw-medium mb-2">Color value in hexadecimal</label>
                            <input
                                type="text"
                                className="form-control"
                                value={inputValue}
                                onChange={handleInputChange}
                                onBlur={handleInputBlur}
                                placeholder="#000000"
                                style={{ 
                                    fontFamily: 'monospace',
                                    fontSize: '16px',
                                    textTransform: 'uppercase',
                                    padding: '12px 16px'
                                }}
                                maxLength="7"
                            />
                        </div>



                        {/* Action Buttons */}
                        <div className="d-flex justify-content-end gap-2">
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={handleCancelClick}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleOkClick}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {description && (
                <small className="text-muted d-block mt-1">{description}</small>
            )}

            {copied && (
                <small className="text-success d-block mt-1">
                    <FiCheck size={12} className="me-1" />
                    Color code copied to clipboard!
                </small>
            )}
        </div>
    );
};

export default ColorPicker;