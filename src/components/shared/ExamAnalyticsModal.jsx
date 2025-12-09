import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ExamAnalyticsModal = ({ show, onHide, examId, examTitle }) => {
    const [examData, setExamData] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [expandedStudents, setExpandedStudents] = useState(new Set());

    useEffect(() => {
        if (show && examId) {
            setError(null);
            setExamData(null);
            setStudents([]);
            fetchExamAnalytics();
        }
    }, [show, examId]);

    useEffect(() => {
        if (searchTerm) {
            setFilteredStudents(students.filter(student => 
                (student.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (student.email || '').toLowerCase().includes(searchTerm.toLowerCase())
            ));
        } else {
            setFilteredStudents(students);
        }
    }, [searchTerm, students]);



    const fetchExamAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('Fetching analytics for exam:', examId);
            
            // Fetch exam details
            const examResponse = await fetch(`/api/exams/${examId}`);
            if (!examResponse.ok) {
                throw new Error('Failed to fetch exam details');
            }
            const examResult = await examResponse.json();
            
            // Fetch students with results
            const studentsResponse = await fetch(`/api/exams/${examId}/students-results`);
            if (!studentsResponse.ok) {
                throw new Error('Failed to fetch students results');
            }
            const studentsResult = await studentsResponse.json();
            
            console.log('Loaded students:', studentsResult.students);
            
            if (examResult.success && studentsResult.success) {
                // Calculate analytics
                const totalStudents = studentsResult.students.length;
                const highestScore = totalStudents > 0 
                    ? Math.max(...studentsResult.students.map(s => s.bestAttempt?.percentage || 0))
                    : 0;
                const averageScore = totalStudents > 0
                    ? studentsResult.students.reduce((sum, s) => sum + (s.bestAttempt?.percentage || 0), 0) / totalStudents
                    : 0;
                const passRate = totalStudents > 0
                    ? (studentsResult.students.filter(s => s.bestAttempt?.passed).length / totalStudents) * 100
                    : 0;

                setExamData({
                    ...examResult.data,
                    totalStudents,
                    highestScore: highestScore.toFixed(1),
                    averageScore: averageScore.toFixed(1),
                    passRate: passRate.toFixed(0)
                });
                setStudents(studentsResult.students || []);
            } else {
                setError('Failed to load exam data');
            }
        } catch (error) {
            console.error('Error fetching exam analytics:', error);
            setError(error.message || 'Unable to connect to server');
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

    const getPassStatus = (score, passingScore = 60) => {
        return score >= passingScore ? 'PASS' : 'FAIL';
    };

    const handleUserClick = (user) => {
        console.log('User clicked in modal:', user);
        
        // Open result page in new tab
        if (user.attemptId || user._id) {
            const attemptId = user.attemptId || user._id;
            const url = `/my-results/${examId}/${attemptId}`;
            console.log('Opening in new tab:', url);
            
            // Open in new tab
            window.open(url, '_blank');
            
            // Close the analytics modal
            onHide();
        }
    };

    const toggleStudentExpansion = (studentId) => {
        setExpandedStudents(prev => {
            const newSet = new Set(prev);
            if (newSet.has(studentId)) {
                newSet.delete(studentId);
            } else {
                newSet.add(studentId);
            }
            return newSet;
        });
    };

    const handleViewAttempt = (attemptId) => {
        const url = `/my-results/${examId}/${attemptId}`;
        window.open(url, '_blank');
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    const formatTime = (seconds) => {
        if (!seconds || seconds === 0) return '0 min 0 sec';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes} min ${remainingSeconds} sec`;
    };

    return (
        <>
            {show && (
                <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex="-1">
                    <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className="fas fa-chart-bar me-2"></i>
                                    Exam Analytics - {examTitle}
                                </h5>
                                <button type="button" className="btn-close" onClick={onHide}></button>
                            </div>
                            <div className="modal-body">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-3">Loading exam analytics...</p>
                        </div>
                    ) : examData ? (
                        <div>
                            {/* Exam Overview Stats */}
                            <div className="row mb-4">
                                <div className="col-md-3">
                                    <div className="card bg-primary text-white">
                                        <div className="card-body text-center">
                                            <i className="fas fa-users fa-2x mb-2"></i>
                                            <h4 className="mb-0">{examData.totalStudents}</h4>
                                            <small>Total Students</small>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="card bg-success text-white">
                                        <div className="card-body text-center">
                                            <i className="fas fa-trophy fa-2x mb-2"></i>
                                            <h4 className="mb-0">{examData.highestScore}%</h4>
                                            <small>Highest Score</small>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="card bg-warning text-white">
                                        <div className="card-body text-center">
                                            <i className="fas fa-chart-line fa-2x mb-2"></i>
                                            <h4 className="mb-0">{examData.averageScore}%</h4>
                                            <small>Average Score</small>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="card bg-info text-white">
                                        <div className="card-body text-center">
                                            <i className="fas fa-percentage fa-2x mb-2"></i>
                                            <h4 className="mb-0">{examData.passRate}%</h4>
                                            <small>Pass Rate</small>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Exam Info */}
                            <div className="card mb-4">
                                <div className="card-body">
                                    <div className="row">
                                        <div className="col-md-3">
                                            <strong>Subject:</strong> {examData.subject}
                                        </div>
                                        <div className="col-md-3">
                                            <strong>Questions:</strong> {examData.totalQuestions}
                                        </div>
                                        <div className="col-md-3">
                                            <strong>Duration:</strong> {examData.duration} min
                                        </div>
                                        <div className="col-md-3">
                                            <strong>Pass Mark:</strong> {examData.passingScore}%
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Student Search */}
                            <div className="card mb-3">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h6 className="mb-0">Student Results ({filteredStudents.length})</h6>
                                        <div className="d-flex align-items-center gap-3">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Search students..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                style={{ width: '250px' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Student Results Table */}
                            <div className="table-responsive">
                                <table className="table table-striped table-hover">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Student</th>
                                            <th>Score</th>
                                            <th>Correct/Wrong</th>
                                            <th>Time</th>
                                            <th>Status</th>
                                            <th>Submitted</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStudents.map((student) => {
                                            const isExpanded = expandedStudents.has(student._id || student.id);
                                            const bestAttempt = student.bestAttempt || student;
                                            const allAttempts = student.attempts || [bestAttempt];
                                            
                                            return (
                                                <React.Fragment key={student._id || student.id}>
                                                    <tr>
                                                        <td>
                                                            <div>
                                                                <h6 className="mb-0">{student.studentName || student.name}</h6>
                                                                <small className="text-muted">{student.studentEmail || student.email}</small>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className={`badge bg-${getScoreColor(bestAttempt.percentage || bestAttempt.score || 0)} fs-6`}>
                                                                {(bestAttempt.percentage || bestAttempt.score || 0).toFixed(1)}%
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="d-flex gap-2">
                                                                <span className="badge bg-success">
                                                                    <i className="fas fa-check me-1"></i>
                                                                    {bestAttempt.correctAnswers || 0}
                                                                </span>
                                                                <span className="badge bg-danger">
                                                                    <i className="fas fa-times me-1"></i>
                                                                    {bestAttempt.wrongAnswers || 0}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="badge bg-light text-dark">
                                                                <i className="fas fa-clock me-1"></i>
                                                                {formatTime(bestAttempt.timeTakenInSeconds || 0)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`badge bg-${bestAttempt.passed ? 'success' : 'danger'}`}>
                                                                {bestAttempt.passed ? 'PASS' : 'FAIL'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <small>{formatDate(bestAttempt.submittedAt)}</small>
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="btn btn-sm btn-outline-primary"
                                                                onClick={() => toggleStudentExpansion(student._id || student.id)}
                                                            >
                                                                <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} me-1`}></i>
                                                                {isExpanded ? 'Hide' : 'Details'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                    {isExpanded && (
                                                        <tr>
                                                            <td colSpan="7" className="bg-light">
                                                                <div className="p-3">
                                                                    <h6 className="mb-3">
                                                                        <i className="fas fa-list me-2"></i>
                                                                        All Attempts ({allAttempts.length})
                                                                    </h6>
                                                                    <div className="table-responsive">
                                                                        <table className="table table-sm table-bordered bg-white">
                                                                            <thead>
                                                                                <tr>
                                                                                    <th>#</th>
                                                                                    <th>Score</th>
                                                                                    <th>Correct/Wrong</th>
                                                                                    <th>Time</th>
                                                                                    <th>Status</th>
                                                                                    <th>Submitted</th>
                                                                                    <th>Action</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {allAttempts.map((attempt, index) => (
                                                                                    <tr key={attempt._id || index}>
                                                                                        <td>
                                                                                            <strong>Attempt {index + 1}</strong>
                                                                                            {attempt._id === bestAttempt._id && (
                                                                                                <span className="badge bg-warning text-dark ms-2">Best</span>
                                                                                            )}
                                                                                        </td>
                                                                                        <td>
                                                                                            <span className={`badge bg-${getScoreColor(attempt.percentage || attempt.score || 0)}`}>
                                                                                                {(attempt.percentage || attempt.score || 0).toFixed(1)}%
                                                                                            </span>
                                                                                        </td>
                                                                                        <td>
                                                                                            <span className="badge bg-success me-1">
                                                                                                <i className="fas fa-check me-1"></i>
                                                                                                {attempt.correctAnswers || 0}
                                                                                            </span>
                                                                                            <span className="badge bg-danger">
                                                                                                <i className="fas fa-times me-1"></i>
                                                                                                {attempt.wrongAnswers || 0}
                                                                                            </span>
                                                                                        </td>
                                                                                        <td>
                                                                                            <span className="badge bg-light text-dark">
                                                                                                <i className="fas fa-clock me-1"></i>
                                                                                                {formatTime(attempt.timeTakenInSeconds || 0)}
                                                                                            </span>
                                                                                        </td>
                                                                                        <td>
                                                                                            <span className={`badge bg-${attempt.passed ? 'success' : 'danger'}`}>
                                                                                                {attempt.passed ? 'PASS' : 'FAIL'}
                                                                                            </span>
                                                                                        </td>
                                                                                        <td>
                                                                                            <small>{formatDate(attempt.submittedAt)}</small>
                                                                                        </td>
                                                                                        <td>
                                                                                            <button
                                                                                                className="btn btn-sm btn-outline-primary"
                                                                                                onClick={() => handleViewAttempt(attempt._id)}
                                                                                            >
                                                                                                <i className="fas fa-eye me-1"></i>
                                                                                                View
                                                                                            </button>
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {filteredStudents.length === 0 && (
                                <div className="text-center py-4">
                                    <i className="fas fa-search fa-3x text-muted mb-3"></i>
                                    <h5>No students found</h5>
                                    <p className="text-muted">
                                        {searchTerm ? 'Try adjusting your search criteria' : 'No students have taken this exam yet'}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-5">
                            <i className="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                            <h5>Unable to load exam data</h5>
                            <p className="text-muted">{error || 'Please try again later'}</p>
                            <button 
                                className="btn btn-primary mt-3" 
                                onClick={fetchExamAnalytics}
                            >
                                <i className="fas fa-sync-alt me-2"></i>
                                Retry
                            </button>
                        </div>
                    )}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onHide}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            )}
        </>
    );
};

export default ExamAnalyticsModal;