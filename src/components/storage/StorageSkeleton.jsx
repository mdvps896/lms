'use client'

import React from 'react'

const StorageSkeleton = ({ viewMode = 'grid' }) => {
    if (viewMode === 'list') {
        return (
            <div className="table-responsive mt-3">
                <table className="table">
                    <thead>
                        <tr>
                            <th style={{ width: '50px' }}>Type</th>
                            <th>Name</th>
                            <th style={{ width: '120px' }}>Size</th>
                            <th style={{ width: '150px' }}>Date</th>
                            <th style={{ width: '150px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...Array(10)].map((_, index) => (
                            <tr key={index}>
                                <td>
                                    <div className="skeleton" style={{ width: '20px', height: '20px', borderRadius: '4px' }}></div>
                                </td>
                                <td>
                                    <div className="skeleton" style={{ height: '16px', width: '60%' }}></div>
                                </td>
                                <td>
                                    <div className="skeleton" style={{ height: '14px', width: '80px' }}></div>
                                </td>
                                <td>
                                    <div className="skeleton" style={{ height: '14px', width: '100px' }}></div>
                                </td>
                                <td>
                                    <div className="d-flex gap-2">
                                        <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '4px' }}></div>
                                        <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '4px' }}></div>
                                        <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '4px' }}></div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <style jsx>{`
                    .skeleton {
                        background: linear-gradient(
                            90deg,
                            #f0f0f0 25%,
                            #e0e0e0 50%,
                            #f0f0f0 75%
                        );
                        background-size: 200% 100%;
                        animation: loading 1.5s infinite;
                    }

                    @keyframes loading {
                        0% {
                            background-position: 200% 0;
                        }
                        100% {
                            background-position: -200% 0;
                        }
                    }
                `}</style>
            </div>
        )
    }

    return (
        <div className="row g-3">
            {[...Array(12)].map((_, index) => (
                <div key={index} className="col-xxl-2 col-xl-3 col-lg-4 col-md-6">
                    <div className="card">
                        <div className="card-body p-3">
                            <div className="skeleton" style={{ 
                                height: '150px', 
                                width: '100%', 
                                borderRadius: '8px',
                                marginBottom: '10px'
                            }}></div>
                            <div className="skeleton" style={{ 
                                height: '16px', 
                                width: '80%',
                                marginBottom: '8px'
                            }}></div>
                            <div className="skeleton" style={{ 
                                height: '12px', 
                                width: '60%'
                            }}></div>
                        </div>
                    </div>
                </div>
            ))}
            <style jsx>{`
                .skeleton {
                    background: linear-gradient(
                        90deg,
                        #f0f0f0 25%,
                        #e0e0e0 50%,
                        #f0f0f0 75%
                    );
                    background-size: 200% 100%;
                    animation: loading 1.5s infinite;
                }

                @keyframes loading {
                    0% {
                        background-position: 200% 0;
                    }
                    100% {
                        background-position: -200% 0;
                    }
                }
            `}</style>
        </div>
    )
}

export default StorageSkeleton
