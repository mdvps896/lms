'use client'

import React from 'react'
import { FiBookOpen } from 'react-icons/fi'

const CategoryCard = ({ categoryLoading, categoryData }) => {
    return (
        <div className="card border-top-0 mt-3">
            <div className="card-header">
                <h5 className="card-title">
                    <FiBookOpen className="me-2" />
                    Category
                </h5>
            </div>
            <div className="card-body">
                {categoryLoading ? (
                    <div className="text-center py-3">
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : categoryData ? (
                    <div>
                        <div className="d-flex align-items-center mb-2">
                            <div className="avatar-text avatar-sm bg-soft-primary text-primary me-2">
                                <FiBookOpen />
                            </div>
                            <div>
                                <h6 className="mb-0">{categoryData.name}</h6>
                                <span className={`badge badge-sm ${categoryData.status === 'active' ? 'bg-soft-success text-success' : 'bg-soft-danger text-danger'}`}>
                                    {categoryData.status}
                                </span>
                            </div>
                        </div>
                        {categoryData.description && (
                            <p className="text-muted small mb-0">{categoryData.description}</p>
                        )}
                    </div>
                ) : (
                    <div className="text-center text-muted py-3">
                        <FiBookOpen size={30} className="mb-2 opacity-50" />
                        <p className="mb-0 small">No category assigned</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default CategoryCard
