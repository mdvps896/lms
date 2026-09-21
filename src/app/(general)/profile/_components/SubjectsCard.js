'use client'

import React from 'react'
import { FiBook } from 'react-icons/fi'

const SubjectsCard = ({ categoryLoading, subjects, categoryData }) => {
    return (
        <div className="card border-top-0 mt-3">
            <div className="card-header">
                <h5 className="card-title">
                    <FiBook className="me-2" />
                    Subjects
                </h5>
            </div>
            <div className="card-body">
                {categoryLoading ? (
                    <div className="text-center py-3">
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : subjects.length > 0 ? (
                    <div className="list-group list-group-flush">
                        {subjects.map((subject, index) => (
                            <div
                                key={subject._id}
                                className={`list-group-item px-0 ${index === 0 ? 'pt-0' : ''} ${index === subjects.length - 1 ? 'pb-0' : ''}`}
                            >
                                <div className="d-flex align-items-center">
                                    <div className="avatar-text avatar-sm bg-soft-info text-info me-2">
                                        <FiBook size={14} />
                                    </div>
                                    <div className="flex-grow-1">
                                        <h6 className="mb-0 fs-13">{subject.name}</h6>
                                        {subject.description && (
                                            <small className="text-muted">{subject.description}</small>
                                        )}
                                    </div>
                                    <span className={`badge badge-sm ${subject.status === 'active' ? 'bg-soft-success text-success' : 'bg-soft-danger text-danger'}`}>
                                        {subject.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted py-3">
                        <FiBook size={30} className="mb-2 opacity-50" />
                        <p className="mb-0 small">
                            {categoryData ? 'No subjects available for this category' : 'Assign a category to see subjects'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default SubjectsCard
