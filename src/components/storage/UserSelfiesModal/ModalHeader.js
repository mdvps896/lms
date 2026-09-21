import React from 'react';

const ModalHeader = ({
    user,
    selfies,
    filteredSelfies,
    selectedIds,
    deleting,
    onToggleSelectAll,
    onExport,
    onDelete,
    onClose,
}) => {
    return (
        <div className="modal-header d-flex justify-content-between align-items-center flex-wrap">
            <div className="d-flex align-items-center mb-2 mb-md-0">
                {user.profileImage ? (
                    <img
                        src={user.profileImage}
                        className="rounded-circle me-2"
                        width="40"
                        height="40"
                        alt={user.name}
                        style={{ objectFit: 'cover' }}
                    />
                ) : (
                    <div
                        className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
                        style={{ width: '40px', height: '40px' }}
                    >
                        {user.name?.charAt(0).toUpperCase()}
                    </div>
                )}
                <div>
                    <h5 className="modal-title mb-0">{user.name}'s Selfies</h5>
                    <small className="text-muted">{selfies.length} total captures</small>
                </div>
            </div>

            <div className="d-flex align-items-center gap-2">
                {selfies.length > 0 && (
                    <>
                        <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={onToggleSelectAll}
                        >
                            {selectedIds.length === filteredSelfies.length && filteredSelfies.length > 0 ? 'Deselect All' : 'Select All'} ({selectedIds.length}/{filteredSelfies.length})
                        </button>
                        {selectedIds.length > 0 && (
                            <div className="d-flex gap-2">
                                <button
                                    className="btn btn-sm btn-outline-info"
                                    onClick={() => onExport(selectedIds)}
                                >
                                    <i className="fas fa-download me-1"></i>
                                    Export ({selectedIds.length})
                                </button>
                                <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => {
                                        onDelete(selectedIds);
                                    }}
                                    disabled={deleting}
                                >
                                    <i className="fas fa-trash-alt me-1"></i>
                                    Delete ({selectedIds.length})
                                </button>
                            </div>
                        )}
                    </>
                )}
                <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
        </div>
    );
};

export default ModalHeader;
