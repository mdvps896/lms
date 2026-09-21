import React from 'react';

const LoadingSkeleton = () => {
    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-12">
                    <div className="page-header">
                        <div className="page-header-left d-flex align-items-center">
                            <div className="skeleton skeleton-button me-3" style={{ width: '120px', height: '36px' }}></div>
                            <div className="flex-grow-1">
                                <div className="skeleton skeleton-text mb-2" style={{ width: '300px', height: '24px' }}></div>
                                <div className="skeleton skeleton-text" style={{ width: '180px', height: '14px' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Skeleton for Exam Info Card */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="row">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="col-md-3">
                                        <div className="skeleton skeleton-text mb-2" style={{ width: '60%', height: '14px' }}></div>
                                        <div className="skeleton skeleton-text" style={{ width: '80%', height: '20px' }}></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Skeleton for Attempts Table */}
            <div className="row">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white">
                            <div className="skeleton skeleton-text" style={{ width: '150px', height: '20px' }}></div>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead className="bg-light">
                                        <tr>
                                            <th><div className="skeleton skeleton-text" style={{ width: '80px', height: '16px' }}></div></th>
                                            <th><div className="skeleton skeleton-text" style={{ width: '80px', height: '16px' }}></div></th>
                                            <th><div className="skeleton skeleton-text" style={{ width: '80px', height: '16px' }}></div></th>
                                            <th><div className="skeleton skeleton-text" style={{ width: '80px', height: '16px' }}></div></th>
                                            <th><div className="skeleton skeleton-text" style={{ width: '80px', height: '16px' }}></div></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <tr key={i}>
                                                <td>
                                                    <div className="skeleton skeleton-text mb-2" style={{ width: '120px', height: '16px' }}></div>
                                                    <div className="skeleton skeleton-text" style={{ width: '100px', height: '14px' }}></div>
                                                </td>
                                                <td><div className="skeleton skeleton-text" style={{ width: '140px', height: '16px' }}></div></td>
                                                <td><div className="skeleton skeleton-text" style={{ width: '120px', height: '16px' }}></div></td>
                                                <td><div className="skeleton skeleton-badge" style={{ width: '70px', height: '24px' }}></div></td>
                                                <td>
                                                    <div className="d-flex gap-2">
                                                        <div className="skeleton skeleton-button" style={{ width: '36px', height: '32px' }}></div>
                                                        <div className="skeleton skeleton-button" style={{ width: '36px', height: '32px' }}></div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .skeleton {
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: loading 1.5s infinite;
                    border-radius: 4px;
                }
                @keyframes loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
};

export default LoadingSkeleton;
