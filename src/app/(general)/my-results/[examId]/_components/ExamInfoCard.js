import React from 'react';

const ExamInfoCard = ({ exam, attemptsCount }) => {
    return (
        <div className="row mb-4">
            <div className="col-12">
                <div className="card border-0 shadow-sm">
                    <div className="card-body">
                        <div className="row g-3">{/* Added g-3 for gap */}
                            <div className="col-md-3">
                                <div className="text-muted small">Subject</div>
                                <div className="fw-bold">{exam?.subject?.name || 'N/A'}</div>
                            </div>
                            <div className="col-md-3">
                                <div className="text-muted small">Duration</div>
                                <div className="fw-bold">{exam?.duration} minutes</div>
                            </div>
                            <div className="col-md-3">
                                <div className="text-muted small">Total Questions</div>
                                <div className="fw-bold">{exam?.totalQuestions}</div>
                            </div>
                            <div className="col-md-3">
                                <div className="text-muted small">Total Attempts</div>
                                <div className="fw-bold">{attemptsCount}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamInfoCard;
