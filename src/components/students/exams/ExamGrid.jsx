'use client'
import React from 'react'
import ExamCard from './ExamCard'

const ExamGrid = ({ exams }) => {
    if (exams.length === 0) {
        return (
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body text-center py-5">
                            <div className="mb-3">
                                <i className="feather-book-open text-muted" style={{fontSize: '48px'}}></i>
                            </div>
                            <h4 className="text-muted mb-2">No Exams Found</h4>
                            <p className="text-muted mb-0">
                                No exams match your current filters. Try adjusting your search criteria.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="row">
            {exams.map((exam) => (
                <div key={exam._id} className="col-xxl-4 col-lg-6 col-md-6">
                    <ExamCard exam={exam} />
                </div>
            ))}
        </div>
    )
}

export default ExamGrid