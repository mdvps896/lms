'use client'
import { useEffect, useState } from 'react';

export default function UserExamDetailModal({ show, onHide, user, examData }) {
    const [userDetails, setUserDetails] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (show && user) {
            fetchUserDetails();
        }
    }, [show, user]);

    const fetchUserDetails = async () => {
        setLoading(true);
        try {
            // Mock detailed user exam data
            const mockUserDetails = {
                ...user,
                submittedAt: '2024-12-04T14:30:00Z',
                startedAt: '2024-12-04T13:15:00Z',
                answers: [
                    { 
                        questionId: 1, 
                        question: 'What is the derivative of sin(x)?', 
                        options: ['cos(x)', '-cos(x)', 'sin(x)', '-sin(x)'],
                        userAnswer: 'cos(x)', 
                        correctAnswer: 'cos(x)', 
                        isCorrect: true,
                        timeSpent: 45,
                        difficulty: 'Easy'
                    },
                    { 
                        questionId: 2, 
                        question: 'Solve for x: 2x + 5 = 15', 
                        options: ['5', '10', '7.5', '12'],
                        userAnswer: '10', 
                        correctAnswer: '5', 
                        isCorrect: false,
                        timeSpent: 120,
                        difficulty: 'Medium'
                    },
                    { 
                        questionId: 3, 
                        question: 'What is the integral of x²?', 
                        options: ['x³/3 + C', '2x + C', 'x³ + C', '3x² + C'],
                        userAnswer: 'x³/3 + C', 
                        correctAnswer: 'x³/3 + C', 
                        isCorrect: true,
                        timeSpent: 90,
                        difficulty: 'Hard'
                    }
                ],
                examSummary: {
                    totalTimeAllowed: 120,
                    totalTimeUsed: user.timeSpent,
                    questionsAttempted: user.correctAnswers + user.wrongAnswers,
                    questionsSkipped: (examData?.totalQuestions || 25) - (user.correctAnswers + user.wrongAnswers),
                    averageTimePerQuestion: user.timeSpent / (user.correctAnswers + user.wrongAnswers),
                    accuracy: ((user.correctAnswers / (user.correctAnswers + user.wrongAnswers)) * 100)
                }
            };
            setUserDetails(mockUserDetails);
        } catch (error) {
            console.error('Error fetching user details:', error);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 90) return 'success';
        if (score >= 80) return 'primary';
        if (score >= 70) return 'warning';
        if (score >= 60) return 'info';
        return 'danger';
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Easy': return 'success';
            case 'Medium': return 'warning';
            case 'Hard': return 'danger';
            default: return 'secondary';
        }
    };

    if (!show) return null;

    return (
        <div className="modal fade show" style={{ display: 'block', zIndex: 9999 }} tabIndex="-1">
            <div className="modal-backdrop fade show" style={{ zIndex: 9998 }} onClick={onHide}></div>
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable" style={{ zIndex: 10000 }}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <div className="d-flex align-items-center gap-2">
                                <i className="fas fa-user-graduate"></i>
                                {user?.name} - Detailed Exam Report
                            </div>
                        </h5>
                        <button type="button" className="btn-close" onClick={onHide}></button>
                    </div>
                    
                    <div className="modal-body">
                        {loading ? (
                            <div className="d-flex justify-content-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : userDetails ? (
                            <>
                                {/* User & Exam Info */}
                                <div className="row mb-4">
                                    <div className="col-md-6">
                                        <div className="card bg-light">
                                            <div className="card-body">
                                                <h6 className="card-title">
                                                    <i className="fas fa-user me-2"></i>Student Information
                                                </h6>
                                                <div className="mb-2">
                                                    <strong>Name:</strong> {userDetails.name}
                                                </div>
                                                <div className="mb-2">
                                                    <strong>Email:</strong> {userDetails.email}
                                                </div>
                                                <div className="mb-2">
                                                    <strong>Started At:</strong> {new Date(userDetails.startedAt).toLocaleString()}
                                                </div>
                                                <div>
                                                    <strong>Submitted At:</strong> {new Date(userDetails.submittedAt).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="card bg-light">
                                            <div className="card-body">
                                                <h6 className="card-title">
                                                    <i className="fas fa-file-alt me-2"></i>Exam Information
                                                </h6>
                                                <div className="mb-2">
                                                    <strong>Exam:</strong> {examData?.title}
                                                </div>
                                                <div className="mb-2">
                                                    <strong>Subject:</strong> {examData?.subject}
                                                </div>
                                                <div className="mb-2">
                                                    <strong>Duration:</strong> {examData?.duration} minutes
                                                </div>
                                                <div>
                                                    <strong>Total Questions:</strong> {examData?.totalQuestions}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Performance Summary */}
                                <div className="row mb-4">
                                    <div className="col-md-2">
                                        <div className="card text-center">
                                            <div className="card-body">
                                                <i className={`fas fa-trophy fa-2x text-${getScoreColor(userDetails.percentage)} mb-2`}></i>
                                                <h4 className={`text-${getScoreColor(userDetails.percentage)} mb-0`}>{userDetails.percentage}%</h4>
                                                <small className="text-muted">Score</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-2">
                                        <div className="card text-center">
                                            <div className="card-body">
                                                <i className="fas fa-check-circle fa-2x text-success mb-2"></i>
                                                <h4 className="text-success mb-0">{userDetails.correctAnswers}</h4>
                                                <small className="text-muted">Correct</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-2">
                                        <div className="card text-center">
                                            <div className="card-body">
                                                <i className="fas fa-times-circle fa-2x text-danger mb-2"></i>
                                                <h4 className="text-danger mb-0">{userDetails.wrongAnswers}</h4>
                                                <small className="text-muted">Wrong</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-2">
                                        <div className="card text-center">
                                            <div className="card-body">
                                                <i className="fas fa-clock fa-2x text-info mb-2"></i>
                                                <h4 className="text-info mb-0">{userDetails.examSummary.totalTimeUsed}m</h4>
                                                <small className="text-muted">Time Used</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-2">
                                        <div className="card text-center">
                                            <div className="card-body">
                                                <i className="fas fa-percent fa-2x text-warning mb-2"></i>
                                                <h4 className="text-warning mb-0">{userDetails.examSummary.accuracy.toFixed(1)}%</h4>
                                                <small className="text-muted">Accuracy</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-2">
                                        <div className="card text-center">
                                            <div className="card-body">
                                                <i className="fas fa-skip-forward fa-2x text-secondary mb-2"></i>
                                                <h4 className="text-secondary mb-0">{userDetails.examSummary.questionsSkipped}</h4>
                                                <small className="text-muted">Skipped</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Question-wise Analysis */}
                                <div className="card">
                                    <div className="card-header">
                                        <h6 className="mb-0">
                                            <i className="fas fa-list-alt me-2"></i>Question-wise Analysis
                                        </h6>
                                    </div>
                                    <div className="card-body p-0">
                                        <div className="table-responsive">
                                            <table className="table table-hover mb-0">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th style={{ width: '5%' }}>Q#</th>
                                                        <th style={{ width: '40%' }}>Question</th>
                                                        <th style={{ width: '15%' }}>Your Answer</th>
                                                        <th style={{ width: '15%' }}>Correct Answer</th>
                                                        <th style={{ width: '10%' }}>Time</th>
                                                        <th style={{ width: '10%' }}>Difficulty</th>
                                                        <th style={{ width: '5%' }}>Result</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {userDetails.answers.map((answer, index) => (
                                                        <tr key={answer.questionId} className={answer.isCorrect ? 'table-light' : 'table-danger table-opacity-25'}>
                                                            <td className="fw-bold text-center">{index + 1}</td>
                                                            <td>
                                                                <div className="fw-medium">{answer.question}</div>
                                                                <div className="mt-2">
                                                                    {answer.options.map((option, idx) => (
                                                                        <div 
                                                                            key={idx} 
                                                                            className={`small p-1 rounded mb-1 ${
                                                                                option === answer.correctAnswer 
                                                                                    ? 'bg-success text-white' 
                                                                                    : option === answer.userAnswer && !answer.isCorrect
                                                                                    ? 'bg-danger text-white'
                                                                                    : 'bg-light'
                                                                            }`}
                                                                        >
                                                                            {String.fromCharCode(65 + idx)}. {option}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </td>
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
                                                                <span className="badge bg-info">
                                                                    {answer.timeSpent}s
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className={`badge bg-${getDifficultyColor(answer.difficulty)}`}>
                                                                    {answer.difficulty}
                                                                </span>
                                                            </td>
                                                            <td className="text-center">
                                                                {answer.isCorrect ? (
                                                                    <i className="fas fa-check-circle text-success fa-lg"></i>
                                                                ) : (
                                                                    <i className="fas fa-times-circle text-danger fa-lg"></i>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </div>
                    
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onHide}>
                            Close
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => window.print()}>
                            <i className="fas fa-print me-2"></i>
                            Print Report
                        </button>
                        <button type="button" className="btn btn-success">
                            <i className="fas fa-download me-2"></i>
                            Download PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}