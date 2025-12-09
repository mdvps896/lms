'use client'

const ExamTakePagination = ({
    questions,
    answers,
    currentQuestionIndex,
    onQuestionSelect,
    onSubmit
}) => {
    const getQuestionStatus = (questionIndex) => {
        const question = questions[questionIndex]
        const answer = answers[question._id]
        
        if (questionIndex === currentQuestionIndex) {
            return 'current'
        }
        
        if (answer && answer !== '' && answer !== null && answer !== undefined) {
            if (Array.isArray(answer) && answer.length > 0) {
                return 'answered'
            } else if (!Array.isArray(answer)) {
                return 'answered'
            }
        }
        
        return 'not-answered'
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'current':
                return 'btn-primary'
            case 'answered':
                return 'btn-success'
            case 'not-answered':
                return 'btn-outline-secondary'
            default:
                return 'btn-outline-secondary'
        }
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'current':
                return 'feather-eye'
            case 'answered':
                return 'feather-check'
            case 'not-answered':
                return 'feather-circle'
            default:
                return 'feather-circle'
        }
    }

    const answeredCount = questions.filter((_, index) => 
        getQuestionStatus(index) === 'answered'
    ).length

    const unansweredCount = questions.length - answeredCount

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            onQuestionSelect(currentQuestionIndex - 1)
        }
    }

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            onQuestionSelect(currentQuestionIndex + 1)
        }
    }

    const handleSubmit = () => {
        const confirmed = window.confirm(
            `Are you sure you want to submit your exam?\n\n` +
            `Answered: ${answeredCount}\n` +
            `Unanswered: ${unansweredCount}\n\n` +
            `You cannot change your answers after submission.`
        )
        
        if (confirmed) {
            onSubmit()
        }
    }

    return (
        <div className="exam-pagination bg-light border-start" style={{ minHeight: '80vh' }}>
            <div className="p-3">
                {/* Question Summary */}
                <div className="mb-4">
                    <h6 className="fw-bold mb-3">
                        <i className="feather-list me-2"></i>
                        Question Overview
                    </h6>
                    
                    <div className="row g-2 mb-3">
                        <div className="col-6">
                            <div className="text-center p-2 bg-success text-white rounded">
                                <div className="fw-bold">{answeredCount}</div>
                                <small>Answered</small>
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="text-center p-2 bg-warning text-dark rounded">
                                <div className="fw-bold">{unansweredCount}</div>
                                <small>Remaining</small>
                            </div>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="progress mb-3" style={{ height: '8px' }}>
                        <div
                            className="progress-bar bg-success"
                            role="progressbar"
                            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                            aria-valuenow={answeredCount}
                            aria-valuemin="0"
                            aria-valuemax={questions.length}
                        ></div>
                    </div>
                </div>

                {/* Question Grid */}
                <div className="mb-4">
                    <h6 className="fw-bold mb-3">
                        <i className="feather-grid me-2"></i>
                        Questions
                    </h6>
                    
                    <div className="question-grid">
                        <div className="row g-2">
                            {questions.map((question, index) => {
                                const status = getQuestionStatus(index)
                                return (
                                    <div key={question._id} className="col-3">
                                        <button
                                            className={`btn btn-sm w-100 ${getStatusColor(status)}`}
                                            onClick={() => onQuestionSelect(index)}
                                            title={`Question ${index + 1} - ${status.replace('-', ' ')}`}
                                        >
                                            <i className={`${getStatusIcon(status)} me-1`}></i>
                                            {index + 1}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className="mb-4">
                    <h6 className="fw-bold mb-2">Legend</h6>
                    <div className="legend">
                        <div className="d-flex align-items-center mb-2">
                            <button className="btn btn-success btn-sm me-2" disabled>
                                <i className="feather-check"></i>
                            </button>
                            <small>Answered</small>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                            <button className="btn btn-primary btn-sm me-2" disabled>
                                <i className="feather-eye"></i>
                            </button>
                            <small>Current</small>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                            <button className="btn btn-outline-secondary btn-sm me-2" disabled>
                                <i className="feather-circle"></i>
                            </button>
                            <small>Not Answered</small>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="navigation-controls">
                    <h6 className="fw-bold mb-3">
                        <i className="feather-navigation me-2"></i>
                        Navigation
                    </h6>
                    
                    <div className="d-grid gap-2">
                        <button
                            className="btn btn-outline-primary"
                            onClick={handlePrevious}
                            disabled={currentQuestionIndex === 0}
                        >
                            <i className="feather-chevron-left me-2"></i>
                            Previous
                        </button>
                        
                        <button
                            className="btn btn-outline-primary"
                            onClick={handleNext}
                            disabled={currentQuestionIndex === questions.length - 1}
                        >
                            Next
                            <i className="feather-chevron-right ms-2"></i>
                        </button>
                    </div>
                </div>

                {/* Submit Section */}
                <div className="mt-4 pt-3 border-top">
                    <h6 className="fw-bold mb-3 text-warning">
                        <i className="feather-upload me-2"></i>
                        Submit Exam
                    </h6>
                    
                    {unansweredCount > 0 && (
                        <div className="alert alert-warning py-2">
                            <small>
                                <i className="feather-alert-triangle me-1"></i>
                                {unansweredCount} question(s) remaining
                            </small>
                        </div>
                    )}
                    
                    <div className="d-grid">
                        <button
                            className="btn btn-danger"
                            onClick={handleSubmit}
                        >
                            <i className="feather-send me-2"></i>
                            Submit Exam
                        </button>
                    </div>
                    
                    <small className="text-muted mt-2 d-block text-center">
                        Make sure to review all answers before submission
                    </small>
                </div>
            </div>
        </div>
    )
}

export default ExamTakePagination