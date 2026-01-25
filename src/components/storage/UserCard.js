import React from 'react';

const UserCard = ({ user, onClick }) => {
    return (
        <div className="col-xxl-3 col-xl-4 col-lg-6 col-md-6 mb-4">
            <div className="card h-100 cursor-pointer" onClick={() => onClick(user)} style={{ cursor: 'pointer', transition: 'transform 0.2s', ':hover': { transform: 'translateY(-5px)' } }}>
                <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                        <div className="avatar-image me-3">
                            {user.profileImage ? (
                                <img
                                    src={user.profileImage}
                                    alt={user.name}
                                    className="rounded-circle"
                                    width="50"
                                    height="50"
                                    style={{ objectFit: 'cover' }}
                                />
                            ) : (
                                <div
                                    className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white"
                                    style={{ width: '50px', height: '50px', fontSize: '1.2rem' }}
                                >
                                    {user.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            )}
                        </div>
                        <div>
                            <h6 className="mb-0 fw-bold text-truncate" style={{ maxWidth: '180px' }}>{user.name}</h6>
                            <small className="text-muted text-truncate d-block" style={{ maxWidth: '180px' }}>{user.email}</small>
                        </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center bg-light rounded p-2 mb-3">
                        <div>
                            <span className="d-block text-muted small">Total Selfies</span>
                            <span className="fw-bold text-primary">{user.count}</span>
                        </div>
                        <div className="text-end">
                            <span className="d-block text-muted small">Last Upload</span>
                            <span className="fw-bold small">{new Date(user.lastUploadAt).toLocaleDateString()}</span>
                        </div>
                    </div>

                    {user.lastSelfie && (
                        <div className="rounded overflow-hidden position-relative" style={{ height: '120px' }}>
                            <img
                                src={user.lastSelfie}
                                alt="Last Selfie"
                                className="w-100 h-100"
                                style={{ objectFit: 'cover' }}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/assets/images/placeholder.png'; // Fallback
                                }}
                            />
                            <div className="position-absolute pt-3 bottom-0 start-0 w-100 bg-gradient-to-t from-black/70 to-transparent p-2">
                                <small className="text-white text-shadow">Latest Capture</small>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserCard;
