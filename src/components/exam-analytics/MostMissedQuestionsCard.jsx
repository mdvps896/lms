'use client'

export default function MostMissedQuestionsCard({ questions }) {
    const getDifficultyColor = (percentage) => {
        if (percentage >= 70) return 'danger';
        if (percentage >= 50) return 'warning';
        return 'info';
    };

    const getDifficultyText = (percentage) => {
        if (percentage >= 70) return 'Very Hard';
        if (percentage >= 50) return 'Hard';
        return 'Medium';
    };

    return (
        <div className="card h-100">
            <div className="card-header d-flex align-items-center">
                <i className="fas fa-exclamation-triangle text-danger me-2"></i>
                <h5 className="mb-0">Most Missed Questions</h5>
            </div>
            <div className="card-body">
                {questions.length > 0 ? (
                    <div className="list-group list-group-flush">
                        {questions.map((question, index) => (
                            <div key={question.id} className="list-group-item border-0 px-0 py-3">
                                <div className="d-flex align-items-start">
                                    <div className="flex-shrink-0 me-3">
                                        <div 
                                            className={`rounded-circle bg-${getDifficultyColor(question.percentage)} text-white d-flex align-items-center justify-content-center`}
                                            style={{ width: '35px', height: '35px' }}
                                        >
                                            <strong>{index + 1}</strong>
                                        </div>
                                    </div>
                                    <div className="flex-grow-1">
                                        <p className="mb-2 fw-medium">{question.question}</p>
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <div>
                                                <small className="text-muted">
                                                    <i className="fas fa-times-circle text-danger me-1"></i>
                                                    {question.incorrectCount} out of {question.totalAttempts} students missed
                                                </small>
                                            </div>
                                            <span className={`badge bg-${getDifficultyColor(question.percentage)}`}>
                                                {getDifficultyText(question.percentage)}
                                            </span>
                                        </div>
                                        <div className="progress" style={{ height: '6px' }}>
                                            <div 
                                                className={`progress-bar bg-${getDifficultyColor(question.percentage)}`}
                                                role="progressbar"
                                                style={{ width: `${question.percentage}%` }}
                                                aria-valuenow={question.percentage}
                                                aria-valuemin="0"
                                                aria-valuemax="100"
                                            ></div>
                                        </div>
                                        <small className="text-muted">
                                            {question.percentage}% miss rate
                                        </small>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <i className="fas fa-check-circle fa-3x text-success mb-3"></i>
                        <h6>All questions answered correctly!</h6>
                        <p className="text-muted">No frequently missed questions found</p>
                    </div>
                )}
            </div>
        </div>
    );
}