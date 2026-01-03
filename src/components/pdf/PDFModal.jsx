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

                                {/* Access Type */}
                                <div className="mb-4">
                                    <label className="form-label">
                                        Access Type <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        className="form-select"
                                        value={formData.accessType || 'global'}
                                        onChange={(e) => setFormData({ ...formData, accessType: e.target.value })}
                                        required
                                    >
                                        <option value="global">🌍 Global (Available to All)</option>
                                        <option value="course">📚 Assign to Course</option>
                                        <option value="user">👤 Assign to Specific User</option>
                                    </select>
                                    <div className="form-text">
                                        {formData.accessType === 'global' && 'PDF will be available to all users'}
                                        {formData.accessType === 'course' && 'PDF will only be available to students enrolled in selected courses'}
                                        {formData.accessType === 'user' && 'PDF will only be available to selected users'}
                                    </div>
                                </div>

                                {/* Assigned Courses (if accessType is 'course') */}
                                {formData.accessType === 'course' && (
                                    <div className="mb-4">
                                        <label className="form-label">
                                            Select Courses <span className="text-danger">*</span>
                                        </label>
                                        <div className="border rounded p-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            {(formData.courses || []).length === 0 ? (
                                                <div className="text-center text-muted py-3">
                                                    <i className="feather-inbox mb-2" style={{ fontSize: '2rem' }}></i>
                                                    <p>No courses available</p>
                                                </div>
                                            ) : (
                                                <div className="row g-2">
                                                    {(formData.courses || []).map((course) => {
                                                        // Handle both 'id' and '_id' fields
                                                        const courseId = (course._id || course.id);

                                                        if (!courseId) {
                                                            console.warn('Invalid course object (no ID):', course);
                                                            return null;
                                                        }

                                                        const courseIdStr = courseId.toString();
                                                        const assignedIds = (formData.assignedCourses || []).map(id => id.toString());
                                                        const isSelected = assignedIds.includes(courseIdStr);

                                                        return (
                                                            <div key={courseIdStr} className="col-md-6">
                                                                <div
                                                                    className={`p-2 border rounded ${isSelected ? 'bg-primary text-white border-primary' : 'bg-light'}`}
                                                                    style={{ cursor: 'pointer', transition: 'all 0.2s', userSelect: 'none' }}
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();

                                                                        const current = (formData.assignedCourses || []).map(id => id.toString());
                                                                        let updated;

                                                                        if (current.includes(courseIdStr)) {
                                                                            updated = current.filter(id => id !== courseIdStr);
                                                                        } else {
                                                                            updated = [...current, courseIdStr];
                                                                        }

                                                                        setFormData(prev => ({
                                                                            ...prev,
                                                                            assignedCourses: updated
                                                                        }));
                                                                    }}
                                                                >
                                                                    <div className="d-flex align-items-center">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="form-check-input me-2"
                                                                            checked={isSelected}
                                                                            onChange={() => { }}
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                            }}
                                                                            readOnly
                                                                        />
                                                                        <span className="small">{course.title}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        <div className="form-text">
                                            Click on courses to select/deselect
                                        </div>
                                    </div>
                                )}

                                {/* Assigned Users (if accessType is 'user') */}
                                {formData.accessType === 'user' && (
                                    <div className="mb-4">
                                        <label className="form-label">
                                            Select Users <span className="text-danger">*</span>
                                        </label>
                                        <div className="border rounded p-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            {(formData.users || []).length === 0 ? (
                                                <div className="text-center text-muted py-3">
                                                    <i className="feather-users mb-2" style={{ fontSize: '2rem' }}></i>
                                                    <p>No users available</p>
                                                </div>
                                            ) : (
                                                <div className="row g-2">
                                                    {(formData.users || []).map((user) => {
                                                        const isSelected = (formData.assignedUsers || []).includes(user._id);
                                                        return (
                                                            <div key={user._id} className="col-md-6">
                                                                <div
                                                                    className={`p-2 border rounded cursor-pointer ${isSelected ? 'bg-primary text-white border-primary' : 'bg-light'}`}
                                                                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const current = formData.assignedUsers || [];
                                                                        const updated = isSelected
                                                                            ? current.filter(id => id !== user._id)
                                                                            : [...current, user._id];
                                                                        setFormData({ ...formData, assignedUsers: updated });
                                                                    }}
                                                                >
                                                                    <div className="d-flex align-items-center">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="form-check-input me-2"
                                                                            checked={isSelected}
                                                                            onChange={(e) => e.stopPropagation()}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            readOnly
                                                                        />
                                                                        <div className="flex-grow-1">
                                                                            <div className="small fw-bold">{user.name}</div>
                                                                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{user.email}</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        <div className="form-text">
                                            Click on users to select/deselect
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

                                {/* Price (if Premium) */}
                                {formData.isPremium && (
                                    <div className="mb-3">
                                        <label className="form-label">
                                            Price <span className="text-danger">*</span>
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text">₹</span>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={formData.price || ''}
                                                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                                placeholder="Enter price"
                                                min="0"
                                                step="0.01"
                                                required={formData.isPremium}
                                            />
                                        </div>
                                        <div className="form-text">
                                            Set the price for this premium PDF
                                        </div>
                                    </div>
                                )}
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
