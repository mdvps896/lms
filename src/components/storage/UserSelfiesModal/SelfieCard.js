import React from 'react';
import SelfieImage from './SelfieImage';
import { getSecureUrl } from './utils';

const SelfieCard = ({ selfie, isSelected, onToggleSelect, onDelete, onPreview }) => {
    return (
        <div className="col-12 col-sm-6 col-md-4 col-lg-3">
            <div className={`card h-100 shadow-sm border-0 position-relative group-hover ${isSelected ? 'border border-primary' : ''}`}>
                {/* Checkbox for Selection */}
                <div className="position-absolute top-0 start-0 m-2" style={{ zIndex: 10 }}>
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                            checked={isSelected}
                            onChange={() => onToggleSelect(selfie._id)}
                        />
                    </div>
                </div>

                {/* Individual Delete Action */}
                <div className="position-absolute top-0 end-0 m-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ zIndex: 10 }}>
                    <button
                        className="btn btn-sm btn-danger rounded-circle p-1"
                        style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete([selfie._id]);
                        }}
                        title="Delete this image"
                    >
                        <i className="fas fa-trash" style={{ fontSize: '0.75rem' }}></i>
                    </button>
                </div>

                <div
                    className="ratio ratio-4x3 cursor-pointer overflow-hidden rounded-top"
                    onClick={() => onPreview(selfie)}
                >
                    <SelfieImage src={getSecureUrl(selfie.imageUrl)} />
                </div>
                <div className="card-body p-2" onClick={() => onToggleSelect(selfie._id)} style={{ cursor: 'pointer' }}>
                    <div className="d-flex justify-content-between align-items-start small">
                        <div>
                            <span className={`badge ${selfie.captureType === 'enrollment' ? 'bg-success' :
                                selfie.captureType?.startsWith('test_') ? 'bg-danger' :
                                    selfie.captureType === 'pdf_periodic' ? 'bg-info' : 'bg-warning'
                                } mb-1`}>
                                {selfie.captureType?.startsWith('test_') ? 'Test' : selfie.captureType?.replace('_', ' ')}
                            </span>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                {new Date(selfie.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                {new Date(selfie.createdAt).toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SelfieCard;
