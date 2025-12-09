'use client'
import { useState, useEffect } from 'react'

const ExamTakeQuestion = ({
    question,
    questionIndex,
    totalQuestions,
    selectedAnswer,
    onAnswerSelect
}) => {
    const [answer, setAnswer] = useState(selectedAnswer || '')

    useEffect(() => {
        setAnswer(selectedAnswer || '')
    }, [selectedAnswer, question])

    const handleAnswerChange = (value) => {
        setAnswer(value)
        onAnswerSelect(value)
    }

    const handleMultipleChoice = (optionText) => {
        const newValue = answer === optionText ? '' : optionText
        handleAnswerChange(newValue)
    }

    const handleMultipleSelect = (optionText) => {
        const currentAnswers = Array.isArray(answer) ? answer : []
        const newAnswers = currentAnswers.includes(optionText)
            ? currentAnswers.filter(text => text !== optionText)
            : [...currentAnswers, optionText]
        
        handleAnswerChange(newAnswers)
    }

    const renderQuestionOptions = () => {
        switch (question.type) {
            case 'mcq':
            case 'multiple_choice':
                return (
                    <div className="mt-4">
                        {question.options?.map((option, index) => {
                            const optionText = typeof option === 'object' ? option.text : option
                            return (
                                <div key={index} className="form-check mb-3">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name={`question-${question._id}`}
                                        id={`option-${index}`}
                                        checked={answer === optionText}
                                        onChange={() => handleMultipleChoice(optionText)}
                                    />
                                    <label className="form-check-label" htmlFor={`option-${index}`}>
                                        <span className="option-label me-2">
                                            {String.fromCharCode(65 + index)}.
                                        </span>
                                        {optionText}
                                    </label>
                                </div>
                            )
                        })}
                    </div>
                )

            case 'multiple-select':
                return (
                    <div className="mt-4">
                        <small className="text-muted mb-3 d-block">
                            <i className="feather-info me-1"></i>
                            Select all correct answers
                        </small>
                        {question.options?.map((option, index) => {
                            const optionText = typeof option === 'object' ? option.text : option
                            return (
                                <div key={index} className="form-check mb-3">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id={`checkbox-${index}`}
                                        checked={Array.isArray(answer) && answer.includes(optionText)}
                                        onChange={() => handleMultipleSelect(optionText)}
                                    />
                                    <label className="form-check-label" htmlFor={`checkbox-${index}`}>
                                        <span className="option-label me-2">
                                            {String.fromCharCode(65 + index)}.
                                        </span>
                                        {optionText}
                                    </label>
                                </div>
                            )
                        })}
                    </div>
                )

            case 'true_false':
                return (
                    <div className="mt-4">
                        {question.options?.map((option, index) => {
                            const optionText = typeof option === 'object' ? option.text : option
                            const isTrue = optionText.toLowerCase() === 'true'
                            return (
                                <div key={index} className="form-check mb-3">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name={`question-${question._id}`}
                                        id={`${isTrue ? 'true' : 'false'}-option`}
                                        checked={answer === optionText}
                                        onChange={() => handleAnswerChange(optionText)}
                                    />
                                    <label className="form-check-label" htmlFor={`${isTrue ? 'true' : 'false'}-option`}>
                                        <span className="option-label me-2">{String.fromCharCode(65 + index)}.</span>
                                        {optionText}
                                    </label>
                                </div>
                            )
                        })}
                    </div>
                )

            case 'short_answer':
                return (
                    <div className="mt-4">
                        <textarea
                            className="form-control"
                            rows="4"
                            placeholder="Enter your answer here..."
                            value={answer}
                            onChange={(e) => handleAnswerChange(e.target.value)}
                        />
                        <small className="text-muted mt-1">
                            Characters: {answer.length}
                        </small>
                    </div>
                )

            case 'long_answer':
                return (
                    <div className="mt-4">
                        <textarea
                            className="form-control"
                            rows="8"
                            placeholder="Enter your detailed answer here..."
                            value={answer}
                            onChange={(e) => handleAnswerChange(e.target.value)}
                        />
                        <small className="text-muted mt-1">
                            Words: {answer.split(/\s+/).filter(word => word.length > 0).length} | 
                            Characters: {answer.length}
                        </small>
                    </div>
                )

            default:
                return (
                    <div className="alert alert-warning">
                        <i className="feather-alert-triangle me-2"></i>
                        Unsupported question type: {question.type}
                    </div>
                )
        }
    }

    return (
        <div className="question-container p-4" style={{ minHeight: '80vh' }}>
            <div className="question-header mb-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="question-number">
                        <span className="badge bg-primary fs-6">
                            Question {questionIndex + 1} of {totalQuestions}
                        </span>
                    </div>
                    <div className="question-type">
                        <span className="badge bg-secondary">
                            {question.type?.replace('-', ' ').toUpperCase()}
                        </span>
                    </div>
                </div>

                {question.marks && (
                    <div className="marks-indicator mb-3">
                        <small className="text-muted">
                            <i className="feather-award me-1"></i>
                            Marks: {question.marks}
                        </small>
                    </div>
                )}
            </div>

            <div className="question-content">
                <div className="question-text mb-4">
                    <h5 className="fw-medium lh-base">
                        {question.text}
                    </h5>
                    
                    {question.description && (
                        <p className="text-muted mt-2">
                            {question.description}
                        </p>
                    )}

                    {question.image && (
                        <div className="question-image mt-3">
                            <img
                                src={question.image}
                                alt="Question"
                                className="img-fluid border rounded"
                                style={{ maxHeight: '300px' }}
                            />
                        </div>
                    )}
                </div>

                {renderQuestionOptions()}

                {/* Answer status indicator */}
                <div className="answer-status mt-4">
                    {answer && answer !== '' && (
                        <div className="alert alert-success">
                            <i className="feather-check-circle me-2"></i>
                            Answer saved automatically
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ExamTakeQuestion