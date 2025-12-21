import React from 'react';

const PDFModal = ({
    show,
    onClose,
    formData,
    setFormData,
    categories,
    subjects,
    onSubmit,
    uploading,
    editingPDF,
    onCategoryChange,
    onSubjectToggle,
    onFileChange
}) => {
    if (!show) return null;

    return (
        <>
            <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                <div className="modal-dialog modal-lg modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                {editingPDF ? 'Edit PDF' : 'Add New PDF'}
                            </h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={onClose}
                                disabled={uploading}
                            ></button>
                        </div>

                        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                            <div className="modal-body">
                                {/* PDF Name */}
                                <div className="mb-4">
                                    <label className="form-label">
                                        PDF Name <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Enter PDF name"
                                        required
                                    />
                                </div>

                                {/* Category */}
                                <div className="mb-4">
                                    <label className="form-label">
                                        Category <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        className="form-select"
                                        value={formData.category}
                                        onChange={(e) => onCategoryChange(e.target.value)}
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map((cat) => (
                                            <option key={cat._id} value={cat._id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Subjects */}
                                {subjects.length > 0 && (
                                    <div className="mb-4">
                                        <label className="form-label">
                                            Subjects <span className="text-muted">(Optional - Leave empty for all subjects)</span>
                                        </label>
                                        <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            <div className="row g-2">
                                                {subjects.map((subject) => (
                                                    <div key={subject._id} className="col-md-6">
                                                        <div className="form-check">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                id={`subject-${subject._id}`}
                                                                checked={formData.subjects.includes(subject._id)}
                                                                onChange={() => onSubjectToggle(subject._id)}
                                                            />
                                                            <label className="form-check-label" htmlFor={`subject-${subject._id}`}>
                                                                {subject.name}
                                                            </label>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* File Upload */}
                                <div className="mb-4">
                                    <label className="form-label">
                                        PDF File {!editingPDF && <span className="text-danger">*</span>}
                                    </label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        accept="application/pdf"
                                        onChange={onFileChange}
                                        required={!editingPDF}
                                    />
                                    {editingPDF && (
                                        <div className="form-text">
                                            Current file: <strong>{editingPDF.fileName}</strong>
                                        </div>
                                    )}
                                    {formData.file && (
                                        <div className="mt-2">
                                            <span className="badge bg-soft-success text-success">
                                                <i className="feather-check-circle me-1"></i>
                                                {formData.file.name} selected
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="mb-4">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-control"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows="3"
                                        placeholder="Enter PDF description (optional)"
                                    />
                                </div>

                                {/* Premium */}
                                <div className="mb-3">
                                    <div className="form-check form-switch">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="isPremium"
                                            checked={formData.isPremium}
                                            onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                                        />
                                        <label className="form-check-label" htmlFor="isPremium">
                                            <i className="feather-star text-warning me-1"></i>
                                            Mark as Premium Content
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={onClose}
                                    disabled={uploading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={uploading}
                                >
                                    {uploading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            {editingPDF ? 'Updating...' : 'Uploading...'}
                                        </>
                                    ) : (
                                        <>
                                            <i className={`feather-${editingPDF ? 'save' : 'upload'} me-2`}></i>
                                            {editingPDF ? 'Update PDF' : 'Upload PDF'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show"></div>
        </>
    );
};

export default PDFModal;
