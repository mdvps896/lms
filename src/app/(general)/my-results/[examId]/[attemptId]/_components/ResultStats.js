'use client';
import { FiClock, FiCheckCircle, FiXCircle, FiHelpCircle } from 'react-icons/fi';
import { formatDuration } from './helpers';

// Score/status/time/questions stat cards row. Extracted verbatim from
// page.js (the block preceding "Question Summary").
export const StatsCards = ({ attempt, shouldShowTimeTaken, totalQuestions }) => {
    return (
        <div className="row mb-4">
            <div className="col-md-3">
                <div className="card border-0 shadow-sm bg-light">
                    <div className="card-body text-center">
                        <div className="text-muted small mb-2">SCORE</div>
                        <h3 className="mb-0 fw-bold">{attempt.score?.toFixed(2)}%</h3>
                    </div>
                </div>
            </div>
            <div className="col-md-3">
                <div className="card border-0 shadow-sm bg-light">
                    <div className="card-body text-center">
                        <div className="text-muted small mb-2">STATUS</div>
                        <h5 className={`mb-0 fw-bold ${attempt.passed ? 'text-success' : 'text-danger'}`}>
                            {attempt.passed ? 'PASSED' : 'FAILED'}
                        </h5>
                    </div>
                </div>
            </div>
            {shouldShowTimeTaken() && (
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm bg-light">
                        <div className="card-body text-center">
                            <div className="text-muted small mb-2">TIME TAKEN</div>
                            <div className="fw-bold">
                                <FiClock className="me-2" />
                                {formatDuration(attempt.timeTaken)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <div className="col-md-3">
                <div className="card border-0 shadow-sm bg-light">
                    <div className="card-body text-center">
                        <div className="text-muted small mb-2">QUESTIONS</div>
                        <h5 className="mb-0 fw-bold">{totalQuestions}</h5>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Correct / Incorrect / Total badge summary card. Extracted verbatim from
// page.js's "Question Summary" block.
export const QuestionSummaryCard = ({ correctAnswers, incorrectAnswers, totalQuestions }) => {
    return (
        <div className="row mb-4">
            <div className="col-12">
                <div className="card border-0 shadow-sm">
                    <div className="card-header bg-white">
                        <h5 className="mb-0 text-primary">Question Review</h5>
                    </div>
                    <div className="card-body">
                        <div className="d-flex gap-3 mb-4">
                            <span className="badge bg-success px-3 py-2">
                                <FiCheckCircle className="me-2" />
                                Correct: {correctAnswers}
                            </span>
                            <span className="badge bg-danger px-3 py-2">
                                <FiXCircle className="me-2" />
                                Incorrect: {incorrectAnswers}
                            </span>
                            <span className="badge bg-info px-3 py-2">
                                <FiHelpCircle className="me-2" />
                                Total: {totalQuestions}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
