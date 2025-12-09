'use client';
import React from 'react';
import ExamWatermark from './ExamWatermark';
import dynamic from 'next/dynamic';

// Dynamically import RichTextEditor to avoid SSR issues
const RichTextEditor = dynamic(() => import('./RichTextEditor'), { ssr: false });

export default function QuestionDisplay({
    question,
    questionNumber,
    totalQuestions,
    answer,
    onAnswerChange,
    isMarkedForReview,
    saving,
    watermarkSettings,
    userName
}) {
    if (!question) {
        return <div className="alert alert-warning">No question available</div>;
    }

    const renderOptions = () => {
        const questionType = question.type?.toLowerCase().replace(/ /g, '_');

        switch (questionType) {
            case 'mcq':
            case 'single_choice':
            case 'single choice':
                return (
                    <div className="options mt-3">
                        {question.options?.map((option, index) => {
                            // Handle both string and object options
                            const optionText = typeof option === 'string' ? option : option.text || option.option || '';
                            const optionValue = typeof option === 'string' ? option : option.value || option.text || option.option || '';

                            return (
                                <div
                                    key={index}
                                    className="form-check mb-3"
                                    style={{
                                        padding: '12px 16px',
                                        border: answer === optionValue ? '2px solid #0891b2' : '1px solid #dee2e6',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        backgroundColor: answer === optionValue ? '#e0f2fe' : '#ffffff'
                                    }}
                                    onClick={() => onAnswerChange(optionValue)}
                                >
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name={`question-${question._id}`}
                                        id={`option-${index}`}
                                        checked={answer === optionValue}
                                        onChange={() => onAnswerChange(optionValue)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <label
                                        className="form-check-label ms-2"
                                        htmlFor={`option-${index}`}
                                        style={{ cursor: 'pointer', width: '100%' }}
                                    >
                                        ({String.fromCharCode(65 + index)}) {optionText}
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                );

            case 'multiple_choice':
            case 'multiple choice':
            case 'checkbox':
                const selectedOptions = Array.isArray(answer) ? answer : [];
                return (
                    <div className="options mt-3">
                        {question.options?.map((option, index) => {
                            const optionText = typeof option === 'string' ? option : option.text || option.option || '';
                            const optionValue = typeof option === 'string' ? option : option.value || option.text || option.option || '';

                            return (
                                <div
                                    key={index}
                                    className="form-check mb-3"
                                    style={{
                                        padding: '12px 16px',
                                        border: selectedOptions.includes(optionValue) ? '2px solid #0891b2' : '1px solid #dee2e6',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        backgroundColor: selectedOptions.includes(optionValue) ? '#e0f2fe' : '#ffffff'
                                    }}
                                    onClick={() => {
                                        const newAnswer = selectedOptions.includes(optionValue)
                                            ? selectedOptions.filter(opt => opt !== optionValue)
                                            : [...selectedOptions, optionValue];
                                        onAnswerChange(newAnswer);
                                    }}
                                >
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id={`option-${index}`}
                                        checked={selectedOptions.includes(optionValue)}
                                        onChange={() => {
                                            const newAnswer = selectedOptions.includes(optionValue)
                                                ? selectedOptions.filter(opt => opt !== optionValue)
                                                : [...selectedOptions, optionValue];
                                            onAnswerChange(newAnswer);
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <label
                                        className="form-check-label ms-2"
                                        htmlFor={`option-${index}`}
                                        style={{ cursor: 'pointer', width: '100%' }}
                                    >
                                        ({String.fromCharCode(65 + index)}) {optionText}
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                );

            case 'true_false':
            case 'true/false':
            case 'boolean':
            case 'truefalse':
                return (
                    <div className="options mt-3">
                        {['True', 'False'].map((option, index) => (
                            <div
                                key={index}
                                className="form-check mb-3"
                                style={{
                                    padding: '12px 16px',
                                    border: answer === option ? '2px solid #0891b2' : '1px solid #dee2e6',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    backgroundColor: answer === option ? '#e0f2fe' : '#ffffff'
                                }}
                                onClick={() => onAnswerChange(option)}
                            >
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name={`question-${question._id}`}
                                    id={`option-${option}`}
                                    checked={answer === option}
                                    onChange={() => onAnswerChange(option)}
                                    style={{ cursor: 'pointer' }}
                                />
                                <label
                                    className="form-check-label ms-2"
                                    htmlFor={`option-${option}`}
                                    style={{ cursor: 'pointer', width: '100%' }}
                                >
                                    {option}
                                </label>
                            </div>
                        ))}
                    </div>
                );

            case 'short_answer':
            case 'short answer':
            case 'text':
            case 'fill_in_the_blank':
            case 'fill in the blank':
                return (
                    <div className="mt-3">
                        <RichTextEditor
                            value={answer || ''}
                            onChange={onAnswerChange}
                            placeholder="Type your answer here..."
                            maxWords={question.wordLimit || 200}
                        />
                    </div>
                );

            case 'long_answer':
            case 'long answer':
            case 'subjective':
            case 'essay':
            case 'descriptive':
                return (
                    <div className="mt-3">
                        <RichTextEditor
                            value={answer || ''}
                            onChange={onAnswerChange}
                            placeholder="Write your detailed answer here..."
                            maxWords={question.wordLimit || null}
                        />
                        {!question.wordLimit && (
                            <small className="text-muted d-block mt-2">
                                <i className="feather-info me-1"></i>
                                Use the toolbar above to format your answer with bold, italic, lists, and alignment
                            </small>
                        )}
                    </div>
                );

            default:
                // For any unknown type, try to render options if available, otherwise textarea
                if (question.options && question.options.length > 0) {
                    return (
                        <div className="options mt-3">
                            {question.options.map((option, index) => {
                                const optionText = typeof option === 'string' ? option : option.text || option.option || '';
                                const optionValue = typeof option === 'string' ? option : option.value || option.text || option.option || '';

                                return (
                                    <div
                                        key={index}
                                        className="form-check mb-3"
                                        style={{
                                            padding: '12px 16px',
                                            border: answer === optionValue ? '2px solid #0891b2' : '1px solid #dee2e6',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            background: answer === optionValue ? '#e0f2fe' : 'white'
                                        }}
                                        onClick={() => onAnswerChange(optionValue)}
                                    >
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name={`question-${question._id}`}
                                            id={`option-${index}`}
                                            checked={answer === optionValue}
                                            onChange={() => onAnswerChange(optionValue)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        <label
                                            className="form-check-label ms-2"
                                            htmlFor={`option-${index}`}
                                            style={{ cursor: 'pointer', width: '100%' }}
                                        >
                                            ({String.fromCharCode(65 + index)}) {optionText}
                                        </label>
                                    </div>
                                );
                            })}
                        </div>
                    );
                } else {
                    return (
                        <div className="mt-3">
                            <textarea
                                className="form-control"
                                rows="6"
                                placeholder="Type your answer here..."
                                value={answer || ''}
                                onChange={(e) => onAnswerChange(e.target.value)}
                                style={{
                                    fontSize: '14px',
                                    padding: '12px',
                                    border: '1px solid #dee2e6',
                                    borderRadius: '6px'
                                }}
                            />
                            <small className="text-muted">Unknown question type: {question.type}</small>
                        </div>
                    );
                }
        }
    };

    return (
        <div className="question-display" style={{
            position: 'relative',
            background: 'white',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            minHeight: '400px'
        }}>
            {/* Watermark - only in question display area */}
            <ExamWatermark userName={userName} settings={watermarkSettings} />

            {/* Question Header */}
            <div className="question-header mb-3" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '12px',
                borderBottom: '2px solid #0891b2'
            }}>
                <div>
                    <span style={{
                        background: '#0891b2',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: '600'
                    }}>
                        Qus. No {questionNumber}
                    </span>
                </div>
                <div style={{ fontSize: '13px', color: '#666' }}>
                    <span className="badge bg-success me-2">{question.marks} Marks</span>
                    {question.type && (
                        <span className="badge bg-info">{question.type}</span>
                    )}
                </div>
            </div>

            {/* Question Text */}
            <div className="question-text mb-3" style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: 'black',
                fontWeight: '500'
            }}>
                <div dangerouslySetInnerHTML={{ __html: question.questionText || question.question }} />
            </div>

            {/* Question Image if exists */}
            {question.image && (
                <div className="question-image mb-3">
                    <img
                        src={question.image}
                        alt="Question"
                        style={{ maxWidth: '100%', height: 'auto', borderRadius: '6px' }}
                    />
                </div>
            )}

            {/* Options/Answer Area */}
            {renderOptions()}

            {/* Save Status */}
            {saving && (
                <div className="mt-3">
                    <small className="text-muted">
                        <i className="bi bi-cloud-upload me-1"></i>
                        Saving...
                    </small>
                </div>
            )}
        </div>
    );
}
