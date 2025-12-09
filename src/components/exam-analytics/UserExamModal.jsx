'use client'
import { useEffect } from 'react';

export default function UserExamModal({ show, onHide, user, examData }) {
    if (!user) return null;

    useEffect(() => {
        if (show) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [show]);

    const getScoreColor = (score) => {
        if (score >= 90) return 'success';
        if (score >= 80) return 'primary';
        if (score >= 70) return 'warning';
        if (score >= 60) return 'info';
        return 'danger';
    };

    const accuracy = ((user.correctAnswers / (user.correctAnswers + user.wrongAnswers)) * 100).toFixed(1);

    if (!show) return null;

    return (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-backdrop fade show" onClick={onHide}></div>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <div className="d-flex align-items-center gap-2">
                                <i className="fas fa-user"></i>
                                {user.name} - Exam Details
                            </div>
                        </h5>
                        <button type="button" className="btn-close" onClick={onHide}></button>
                    </div>
                    
                    <div className="modal-body">{/* User Info */}
                {/* User Info */}
                <div className="row mb-4">
                    <div className="col-md-6">
                        <div className="card bg-light">
                            <div className="card-body">
                                <h6 className="card-title">Student Information</h6>
                                <div className="d-flex align-items-center gap-2 mb-2">
                                    <i className="fas fa-user"></i>
                                    <span>{user.name}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <i className="fas fa-envelope"></i>
                                    <span>{user.email}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="card bg-light">
                            <div className="card-body">
                                <h6 className="card-title">Exam Information</h6>
                                <div className="mb-2">
                                    <strong>Exam:</strong> {examData?.title}
                                </div>
                                <div>
                                    <strong>Subject:</strong> {examData?.subject}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance Stats */}
                <div className="row mb-4">
                    <div className="col-md-3">
                        <div className="card text-center">
                            <div className="card-body">
                                <i className={`fas fa-trophy fa-lg text-${getScoreColor(user.score)} mb-2`}></i>
                                <h4 className={`text-${getScoreColor(user.score)} mb-0`}>{user.score}%</h4>
                                <small className="text-muted">Overall Score</small>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card text-center">
                            <div className="card-body">
                                <i className="fas fa-check-circle fa-lg text-success mb-2"></i>
                                <h4 className="text-success mb-0">{user.correctAnswers}</h4>
                                <small className="text-muted">Correct</small>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card text-center">
                            <div className="card-body">
                                <i className="fas fa-times-circle fa-lg text-danger mb-2"></i>
                                <h4 className="text-danger mb-0">{user.wrongAnswers}</h4>
                                <small className="text-muted">Wrong</small>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card text-center">
                            <div className="card-body">
                                <i className="fas fa-clock fa-lg text-info mb-2"></i>
                                <h4 className="text-info mb-0">{user.timeSpent}</h4>
                                <small className="text-muted">Minutes</small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Stats */}
                <div className="row mb-4">
                    <div className="col-md-4">
                        <div className="card bg-primary text-white text-center">
                            <div className="card-body">
                                <h5 className="mb-0">{accuracy}%</h5>
                                <small>Accuracy Rate</small>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card bg-success text-white text-center">
                            <div className="card-body">
                                <h5 className="mb-0">{user.score >= (examData?.passingScore || 60) ? 'PASS' : 'FAIL'}</h5>
                                <small>Result Status</small>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card bg-info text-white text-center">
                            <div className="card-body">
                                <h5 className="mb-0">{((user.timeSpent / (examData?.duration || 120)) * 100).toFixed(1)}%</h5>
                                <small>Time Usage</small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Question-wise Analysis */}
                <div className="card">
                    <div className="card-header">
                        <h6 className="mb-0">Question-wise Analysis</h6>
                    </div>
                    <div className="card-body" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {user.answers && user.answers.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-sm">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '10%' }}>Q#</th>
                                            <th style={{ width: '50%' }}>Question</th>
                                            <th style={{ width: '15%' }}>Your Answer</th>
                                            <th style={{ width: '15%' }}>Correct Answer</th>
                                            <th style={{ width: '10%' }}>Result</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {user.answers.map((answer, index) => (
                                            <tr key={answer.questionId} className={answer.isCorrect ? 'table-light' : 'table-danger table-opacity-25'}>
                                                <td className="fw-bold">{index + 1}</td>
                                                <td>{answer.question}</td>
                                                <td>
                                                    <span className={`badge ${answer.isCorrect ? 'bg-success' : 'bg-danger'}`}>
                                                        {answer.userAnswer}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="badge bg-primary">
                                                        {answer.correctAnswer}
                                                    </span>
                                                </td>
                                                <td>
                                                    {answer.isCorrect ? (
                                                        <i className="fas fa-check-circle text-success"></i>
                                                    ) : (
                                                        <i className="fas fa-times-circle text-danger"></i>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center text-muted py-4">
                                <p>No detailed question analysis available</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Submission Info */}
                <div className="mt-3">
                    <div className="card bg-light">
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-6">
                                    <small className="text-muted">Submitted At:</small>
                                    <div>{new Date(user.submittedAt).toLocaleString()}</div>
                                </div>
                                <div className="col-md-6">
                                    <small className="text-muted">Time Spent:</small>
                                    <div>{user.timeSpent} minutes out of {examData?.duration || 'N/A'} minutes</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                    </div>
                    
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onHide}>
                            Close
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => window.print()}>
                            Print Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}