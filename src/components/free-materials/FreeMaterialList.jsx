'use client'

import React from 'react'
import { FiEdit, FiTrash2, FiFile, FiDownload, FiFolder } from 'react-icons/fi'

const FreeMaterialList = ({ materials, loading, onEdit, onDelete }) => {
    if (loading) {
        return (
            <div className="p-5 text-center">
                <div className="spinner-border text-primary" role="status"></div>
                <div className="mt-2 text-muted">Loading materials...</div>
            </div>
        )
    }

    if (!materials || materials.length === 0) {
        return (
            <div className="p-5 text-center">
                <div className="fs-1 text-muted mb-3"><FiFolder /></div>
                <h5>No materials found</h5>
                <p className="text-muted">Create a new material to get started.</p>
            </div>
        )
    }

    return (
        <div className="table-responsive">
            <table className="table table-hover mb-0">
                <thead className="bg-light">
                    <tr>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Subject</th>
                        <th>Files</th>
                        <th>Created At</th>
                        <th className="text-end">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {materials.map((material) => (
                        <tr key={material._id}>
                            <td>
                                <div className="fw-bold">{material.title}</div>
                            </td>
                            <td>
                                <span className="badge bg-light text-dark border">
                                    {material.category?.name || 'Uncategorized'}
                                </span>
                            </td>
                            <td>
                                {material.subject ? (
                                    <span className="badge bg-secondary-subtle text-secondary">
                                        {material.subject.name}
                                    </span>
                                ) : (
                                    <span className="text-muted small">All Subjects</span>
                                )}
                            </td>
                            <td>
                                <div className="d-flex flex-column gap-1">
                                    {material.files && material.files.map((file, i) => (
                                        <a key={i} href={file.url} target="_blank" rel="noopener noreferrer"
                                            className="btn btn-sm btn-light border d-flex align-items-center justify-content-between p-1 px-2 text-truncate"
                                            style={{ maxWidth: '250px' }} title={file.title}>
                                            <div className="d-flex align-items-center text-truncate">
                                                <FiFile size={12} className="me-2 text-primary" />
                                                <span className="text-truncate small">{file.title}</span>
                                            </div>
                                            <FiDownload size={12} className="ms-2 text-muted" />
                                        </a>
                                    ))}
                                    {(!material.files || material.files.length === 0) && (
                                        <span className="text-muted small">No files</span>
                                    )}
                                </div>
                            </td>
                            <td>
                                <span className="text-muted small">
                                    {new Date(material.createdAt).toLocaleDateString()}
                                </span>
                            </td>
                            <td className="text-end">
                                <button className="btn btn-sm btn-icon btn-light me-1" onClick={() => onEdit(material)}>
                                    <FiEdit />
                                </button>
                                <button className="btn btn-sm btn-icon btn-light text-danger" onClick={() => onDelete(material._id)}>
                                    <FiTrash2 />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default FreeMaterialList
