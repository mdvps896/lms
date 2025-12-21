import React from 'react';
import { FiEdit2, FiTrash2, FiFileText, FiDownload } from 'react-icons/fi';

const PDFCard = ({ pdf, onEdit, onDelete }) => {
    const formatFileSize = (bytes) => {
        return (bytes / 1024 / 1024).toFixed(2);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="col-xxl-3 col-lg-4 col-md-6">
            <div className="card stretch stretch-full">
                <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center gap-2">
                            <div className="avatar-text avatar-md bg-soft-primary text-primary">
                                <FiFileText size={24} />
                            </div>
                            {pdf.isPremium && (
                                <span className="badge bg-warning text-dark">
                                    <i className="feather-star me-1"></i>Premium
                                </span>
                            )}
                        </div>
                        <div className="dropdown">
                            <a href="#" className="avatar-text avatar-sm" data-bs-toggle="dropdown">
                                <i className="feather-more-vertical"></i>
                            </a>
                            <div className="dropdown-menu dropdown-menu-end">
                                <a
                                    href="#"
                                    className="dropdown-item"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onEdit(pdf);
                                    }}
                                >
                                    <FiEdit2 className="me-2" size={16} />
                                    Edit
                                </a>
                                <a
                                    href={pdf.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="dropdown-item"
                                >
                                    <FiDownload className="me-2" size={16} />
                                    Download
                                </a>
                                <div className="dropdown-divider"></div>
                                <a
                                    href="#"
                                    className="dropdown-item text-danger"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onDelete(pdf._id);
                                    }}
                                >
                                    <FiTrash2 className="me-2" size={16} />
                                    Delete
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="mb-3">
                        <h6 className="fw-bold text-dark mb-1">{pdf.name}</h6>
                        <p className="fs-12 text-muted mb-0">{pdf.fileName}</p>
                    </div>

                    <div className="mb-3">
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <i className="feather-grid fs-12 text-muted"></i>
                            <span className="fs-12 text-muted">
                                {pdf.category?.name || 'N/A'}
                            </span>
                        </div>
                        {pdf.subjects && pdf.subjects.length > 0 && (
                            <div className="d-flex align-items-start gap-2">
                                <i className="feather-book fs-12 text-muted mt-1"></i>
                                <div className="flex-grow-1">
                                    <div className="d-flex flex-wrap gap-1">
                                        {pdf.subjects.slice(0, 2).map((subject, idx) => (
                                            <span key={idx} className="badge bg-soft-info text-info fs-11">
                                                {subject.name}
                                            </span>
                                        ))}
                                        {pdf.subjects.length > 2 && (
                                            <span className="badge bg-soft-secondary text-secondary fs-11">
                                                +{pdf.subjects.length - 2} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="d-flex align-items-center justify-content-between pt-3 border-top">
                        <div className="fs-12 text-muted">
                            <i className="feather-hard-drive me-1"></i>
                            {formatFileSize(pdf.fileSize)} MB
                        </div>
                        <div className="fs-12 text-muted">
                            {formatDate(pdf.createdAt)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PDFCard;
