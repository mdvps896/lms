'use client';
import React from 'react';

const ViewQuestionGroupModal = ({ show, onClose, group }) => {
    if (!show || !group) return null;

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Question Group Details</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Group Name</label>
                                <p className="form-control-plaintext">{group.name}</p>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Status</label>
                                <p className="form-control-plaintext">
                                    <span className={`badge bg-${group.status === 'active' ? 'success' : 'danger'}`}>
                                        {group.status}
                                    </span>
                                </p>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Category</label>
                                <p className="form-control-plaintext">
                                    <span className="badge bg-primary">{group.category?.name || 'N/A'}</span>
                                </p>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Subject</label>
                                <p className="form-control-plaintext">
                                    <span className="badge bg-info">{group.subject?.name || 'N/A'}</span>
                                </p>
                            </div>
                            <div className="col-12">
                                <label className="form-label fw-bold">Description</label>
                                <p className="form-control-plaintext">{group.description || 'No description'}</p>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Created At</label>
                                <p className="form-control-plaintext">
                                    {new Date(group.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Last Updated</label>
                                <p className="form-control-plaintext">
                                    {new Date(group.updatedAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewQuestionGroupModal;
