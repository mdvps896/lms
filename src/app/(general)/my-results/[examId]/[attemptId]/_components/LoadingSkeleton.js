'use client';

// Loading placeholder shown while the attempt details are being fetched.
// Extracted verbatim from page.js's `if (loading) { ... }` branch.
const LoadingSkeleton = () => {
    return (
        <div className="container-fluid">
            {/* Header Skeleton */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="bg-primary text-white p-4 rounded">
                        <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center flex-grow-1">
                                <div className="bg-white bg-opacity-25 rounded" style={{ width: '80px', height: '36px' }}></div>
                                <div className="ms-3">
                                    <div className="bg-white bg-opacity-50 rounded mb-2" style={{ width: '200px', height: '24px' }}></div>
                                    <div className="bg-white bg-opacity-25 rounded" style={{ width: '150px', height: '16px' }}></div>
                                </div>
                            </div>
                            <div className="bg-white bg-opacity-25 rounded" style={{ width: '140px', height: '38px' }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="row mb-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="col-md-3">
                        <div className="card border-0 shadow-sm bg-light">
                            <div className="card-body text-center">
                                <div className="bg-secondary bg-opacity-25 rounded mx-auto mb-2" style={{ width: '60px', height: '14px' }}></div>
                                <div className="bg-secondary bg-opacity-50 rounded mx-auto" style={{ width: '80px', height: '28px' }}></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Question Summary Skeleton */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white">
                            <div className="bg-secondary bg-opacity-25 rounded" style={{ width: '150px', height: '20px' }}></div>
                        </div>
                        <div className="card-body">
                            <div className="d-flex gap-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-secondary bg-opacity-25 rounded" style={{ width: '100px', height: '32px' }}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Questions Skeleton */}
            <div className="row">
                <div className="col-12">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="card mb-3 border">
                            <div className="card-body">
                                <div className="d-flex justify-content-between mb-3">
                                    <div className="bg-secondary bg-opacity-25 rounded" style={{ width: '100px', height: '20px' }}></div>
                                    <div className="bg-secondary bg-opacity-25 rounded" style={{ width: '80px', height: '24px' }}></div>
                                </div>
                                <div className="bg-secondary bg-opacity-25 rounded mb-3" style={{ width: '100%', height: '60px' }}></div>
                                <div className="space-y-2">
                                    {[1, 2, 3, 4].map(j => (
                                        <div key={j} className="bg-secondary bg-opacity-10 rounded p-3 mb-2" style={{ height: '48px' }}></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LoadingSkeleton;
