'use client'
import React from 'react'

const ExamSkeletonLoader = () => {
    const skeletonCards = Array(6).fill(0)

    return (
        <div className="row">
            {skeletonCards.map((_, index) => (
                <div key={index} className="col-xxl-4 col-lg-6 col-md-6 mb-4">
                    <div className="card exam-card h-100">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <div>
                                <div className="skeleton skeleton-badge"></div>
                            </div>
                            <div className="skeleton skeleton-button-sm"></div>
                        </div>

                        <div className="card-body">
                            <div className="skeleton skeleton-title mb-3"></div>
                            <div className="skeleton skeleton-text mb-3"></div>
                            <div className="skeleton skeleton-text-short mb-3"></div>

                            <div className="exam-details">
                                <div className="row text-sm">
                                    <div className="col-12 mb-2 d-flex align-items-center">
                                        <div className="skeleton skeleton-icon me-2"></div>
                                        <div className="skeleton skeleton-text-medium"></div>
                                    </div>
                                    
                                    <div className="col-12 mb-2 d-flex align-items-center">
                                        <div className="skeleton skeleton-icon me-2"></div>
                                        <div className="skeleton skeleton-text-medium"></div>
                                    </div>
                                    
                                    <div className="col-12 mb-2 d-flex align-items-center">
                                        <div className="skeleton skeleton-icon me-2"></div>
                                        <div className="skeleton skeleton-text-medium"></div>
                                    </div>
                                    
                                    <div className="col-12 mb-2 d-flex align-items-center">
                                        <div className="skeleton skeleton-icon me-2"></div>
                                        <div className="skeleton skeleton-text-medium"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="exam-schedule mt-3">
                                <div className="row text-sm">
                                    <div className="col-6">
                                        <div className="skeleton skeleton-text-small mb-1"></div>
                                        <div className="skeleton skeleton-text-medium"></div>
                                    </div>
                                    <div className="col-6">
                                        <div className="skeleton skeleton-text-small mb-1"></div>
                                        <div className="skeleton skeleton-text-medium"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card-footer">
                            <div className="skeleton skeleton-button w-100"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default ExamSkeletonLoader