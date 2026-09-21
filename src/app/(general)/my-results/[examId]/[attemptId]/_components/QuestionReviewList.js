'use client';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { renderQuestionText, renderAnswer } from './helpers';

// Per-question review list, rendered according to the exam's configured
// result display format (Default / Minimal / Summary / Detailed).
// Extracted verbatim from page.js's `renderQuestionReview` function.
const QuestionReviewList = ({
    attempt,
    format,
    showCorrectAnswers,
    showScores,
    editMode,
    editedMarks,
    handleMarksChange
}) => {
    if (!attempt?.answers || attempt.answers.length === 0) {
        return (
            <div className="alert alert-info">
                <h5>No questions answered</h5>
                <p className="mb-0">
                    This exam attempt has no recorded answers. This could mean:
                </p>
                <ul className="mb-0 mt-2">
                    <li>The exam was submitted without answering any questions</li>
                    <li>There was an issue saving the answers</li>
                    <li>The exam had no questions</li>
                </ul>
                <div className="mt-3">
                    <strong>Debug Info:</strong>
                    <pre className="mt-2 p-2 bg-light rounded">
                        {JSON.stringify({
                            hasAttempt: !!attempt,
                            hasAnswers: !!attempt?.answers,
                            answersType: typeof attempt?.answers,
                            answersLength: attempt?.answers?.length,
                            answersIsArray: Array.isArray(attempt?.answers)
                        }, null, 2)}
                    </pre>
                </div>
            </div>
        );
    }

    return attempt.answers.map((answer, index) => {
        const question = answer.question;
        if (!question) return null;

        const isCorrect = answer.isCorrect;
        const userAnswer = answer.selectedOption;
        const correctAnswer = question.correctAnswer;

        // Default Format - Don't show any questions, return null
        if (format === 'Default') {
            return null;
        }

        // Minimal Format - Only show if incorrect
        if (format === 'Minimal') {
            return (
                <div key={answer._id || index} className="card mb-3 border">
                    <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start">
                            <h6 className="mb-0">Question {index + 1}</h6>
                            {showScores && (
                                editMode ? (
                                    <div className="d-flex align-items-center gap-2 bg-light p-2 rounded border">
                                        <label className="mb-0 text-muted small">Marks:</label>
                                        <input
                                            type="number"
                                            className="form-control form-control-sm"
                                            style={{ width: '80px' }}
                                            value={editedMarks[answer._id] !== undefined ? editedMarks[answer._id] : answer.marksObtained || 0}
                                            onChange={(e) => handleMarksChange(answer._id, e.target.value, question.marks || 1)}
                                            min="0"
                                            max={question.marks || 1}
                                            step="0.5"
                                            placeholder="0"
                                        />
                                        <span className="text-muted">/ {question.marks || 1}</span>
                                    </div>
                                ) : (
                                    <span className={`badge ${isCorrect ? 'bg-success' : 'bg-danger'}`}>
                                        {answer.marksObtained || 0}/{question.marks || 1} points
                                    </span>
                                )
                            )}
                        </div>
                        {!isCorrect && (
                            <div className="alert alert-danger mt-3 mb-0 d-flex align-items-center">
                                <FiXCircle className="me-2" />
                                <span>Incorrect - {answer.marksObtained || 0}/{question.marks || 1}</span>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // Summary Format - Show question text and result
        if (format === 'Summary') {
            return (
                <div key={answer._id || index} className="card mb-3 border">
                    <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <h6 className="mb-0">Question {index + 1}</h6>
                            {showScores && (
                                editMode ? (
                                    <div className="d-flex align-items-center gap-2 bg-light p-2 rounded border">
                                        <label className="mb-0 text-muted small">Marks:</label>
                                        <input
                                            type="number"
                                            className="form-control form-control-sm"
                                            style={{ width: '80px' }}
                                            value={editedMarks[answer._id] !== undefined ? editedMarks[answer._id] : answer.marksObtained || 0}
                                            onChange={(e) => handleMarksChange(answer._id, e.target.value, question.marks || 1)}
                                            min="0"
                                            max={question.marks || 1}
                                            step="0.5"
                                            placeholder="0"
                                        />
                                        <span className="text-muted">/ {question.marks || 1}</span>
                                    </div>
                                ) : (
                                    <span className={`badge ${isCorrect ? 'bg-success' : 'bg-danger'}`}>
                                        {answer.marksObtained || 0}/{question.marks || 1} points
                                    </span>
                                )
                            )}
                        </div>

                        <div className="mb-3">
                            <div className="fw-medium mb-2">
                                Q{index + 1}. {question.questionText}
                            </div>
                            <div className="text-muted small">
                                Score: {answer.marksObtained || 0}/{question.marks || 1}
                            </div>
                        </div>

                        <div className={`alert ${isCorrect ? 'alert-success' : 'alert-danger'} mb-0 d-flex align-items-center`}>
                            {isCorrect ? <FiCheckCircle className="me-2" /> : <FiXCircle className="me-2" />}
                            <span>{isCorrect ? 'Correct' : 'Incorrect'} - {answer.marksObtained || 0}/{question.marks || 1} points</span>
                        </div>
                    </div>
                </div>
            );
        }

        // Detailed Format - Show everything
        return (
            <div key={answer._id || index} className="card mb-3 border">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                        <h6 className="mb-0">Question {index + 1}</h6>
                        {showScores && (
                            editMode ? (
                                <div className="d-flex align-items-center gap-2 bg-light p-2 rounded border">
                                    <label className="mb-0 text-muted small fw-semibold">Marks:</label>
                                    <input
                                        type="number"
                                        className="form-control form-control-sm"
                                        style={{ width: '80px' }}
                                        value={editedMarks[answer._id] !== undefined ? editedMarks[answer._id] : answer.marksObtained || 0}
                                        onChange={(e) => handleMarksChange(answer._id, e.target.value, question.marks || 1)}
                                        min="0"
                                        max={question.marks || 1}
                                        step="0.5"
                                        placeholder="0"
                                    />
                                    <span className="text-muted">/ {question.marks || 1}</span>
                                </div>
                            ) : (
                                <span className={`badge ${isCorrect ? 'bg-success' : 'bg-danger'}`}>
                                    {answer.marksObtained || 0}/{question.marks || 1} points
                                </span>
                            )
                        )}
                    </div>

                    <div className="mb-3">
                        <div className="fw-medium mb-3">
                            Q{index + 1}. {renderQuestionText(question.questionText)}
                        </div>
                        <div className="text-muted small mb-2">
                            Score: {answer.marksObtained || 0}/{question.marks || 1}
                        </div>
                    </div>

                    {/* Options */}
                    {question.options && question.options.length > 0 && (
                        <div className="mb-3">
                            {question.options.map((option, optIndex) => {
                                // Normalize helper for frontend comparison
                                const normalize = (val) => val !== null && val !== undefined ? String(val).trim().toLowerCase() : '';

                                // Handle both single and multiple choice answers
                                const isUserAnswer = Array.isArray(userAnswer)
                                    ? userAnswer.some(ua => normalize(ua) === normalize(option))
                                    : normalize(userAnswer) === normalize(option);

                                const isCorrectOption = showCorrectAnswers && (
                                    Array.isArray(correctAnswer)
                                        ? correctAnswer.some(ca => normalize(ca) === normalize(option))
                                        : normalize(correctAnswer) === normalize(option)
                                );

                                let bgClass = 'bg-white';
                                let icon = null;

                                if (isCorrectOption) {
                                    bgClass = 'bg-success bg-opacity-10 border-success';
                                    icon = <FiCheckCircle className="text-success me-2" />;
                                } else if (isUserAnswer && !isCorrect) {
                                    bgClass = 'bg-danger bg-opacity-10 border-danger';
                                    icon = <FiXCircle className="text-danger me-2" />;
                                }

                                return (
                                    <div
                                        key={optIndex}
                                        className={`p-3 mb-2 border rounded d-flex align-items-center ${bgClass}`}
                                        style={{ transition: 'all 0.2s' }}
                                    >
                                        <input
                                            type="radio"
                                            className="form-check-input me-2"
                                            checked={isUserAnswer}
                                            disabled
                                            readOnly
                                        />
                                        <span className="flex-grow-1">{option}</span>
                                        {icon}
                                        {isCorrectOption && showCorrectAnswers && (
                                            <span className="badge bg-success ms-2">Correct Answer</span>
                                        )}
                                        {isUserAnswer && (
                                            <span className={`badge ${isCorrectOption ? 'bg-success' : 'bg-primary'} ms-2`}>
                                                {isCorrectOption ? 'Correct Selection' : 'Your Selection'}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Result */}
                    {showCorrectAnswers && (
                        <div className={`alert ${isCorrect ? 'alert-success' : 'alert-danger'} mb-0`}>
                            <div className="d-flex align-items-start">
                                {isCorrect ? <FiCheckCircle className="me-2 mt-1" /> : <FiXCircle className="me-2 mt-1" />}
                                <div className="flex-grow-1">
                                    <strong>
                                        {isCorrect ? 'Correct answer' : 'Incorrect answer'}:
                                    </strong>
                                    <div className="mt-2">
                                        <div className="mb-2 fw-semibold">Your Answer:</div>
                                        {renderAnswer(userAnswer)}
                                    </div>
                                    {!isCorrect && correctAnswer && (
                                        <div className="mt-2">
                                            Correct answer: <strong>{correctAnswer}</strong>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    });
};

export default QuestionReviewList;
