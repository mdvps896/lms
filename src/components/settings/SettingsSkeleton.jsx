'use client';
import React from 'react';

const SettingsSkeleton = () => {
    return (
        <div className="container-fluid p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="placeholder-glow">
                    <span className="placeholder col-3" style={{ height: '32px' }}></span>
                </div>
                <div className="placeholder-glow">
                    <span className="placeholder col-4" style={{ height: '24px' }}></span>
                </div>
            </div>

            <div className="row">
                <div className="col-lg-3 mb-4">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white py-3">
                            <div className="placeholder-glow">
                                <span className="placeholder col-6" style={{ height: '20px' }}></span>
                            </div>
                        </div>
                        <div className="list-group list-group-flush">
                            {[1, 2, 3, 4].map((item) => (
                                <div key={item} className="list-group-item border-0">
                                    <div className="placeholder-glow d-flex align-items-center">
                                        <span className="placeholder rounded-circle me-2" style={{ width: '20px', height: '20px' }}></span>
                                        <span className="placeholder col-8" style={{ height: '16px' }}></span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="col-lg-9">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white py-3">
                            <div className="placeholder-glow d-flex align-items-center">
                                <span className="placeholder rounded-circle me-2" style={{ width: '24px', height: '24px' }}></span>
                                <span className="placeholder col-4" style={{ height: '20px' }}></span>
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="row g-4">
                                {[1, 2, 3, 4, 5, 6].map((item) => (
                                    <div key={item} className="col-md-6">
                                        <div className="placeholder-glow">
                                            <div className="mb-2">
                                                <span className="placeholder col-4" style={{ height: '14px' }}></span>
                                            </div>
                                            <span className="placeholder col-12" style={{ height: '38px', borderRadius: '6px' }}></span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 d-flex gap-2">
                                <div className="placeholder-glow">
                                    <span className="placeholder col-3" style={{ height: '38px', borderRadius: '6px' }}></span>
                                </div>
                                <div className="placeholder-glow">
                                    <span className="placeholder col-3" style={{ height: '38px', borderRadius: '6px' }}></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsSkeleton;