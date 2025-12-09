import React, { useEffect, useState } from 'react';
import { FiX, FiBook, FiHelpCircle, FiClock, FiCalendar, FiCheckCircle, FiXCircle, FiTarget, FiPercent, FiUsers, FiEye } from 'react-icons/fi';
import Link from 'next/link';

const ExamViewModal = ({ exam, onClose, currentTime }) => {
    const [questionCount, setQuestionCount] = useState(0);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [students, setStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [showStudents, setShowStudents] = useState(false);

    const isLive = (exam) => {
        if (exam.status !== 'active') return false;
        if (!currentTime || !exam.startDate || !exam.endDate) return false;
        const start = new Date(exam.startDate).getTime();
        const end = new Date(exam.endDate).getTime();
        const current = currentTime.getTime();
        return current >= start && current <= end;
    };

    const liveStatus = isLive(exam);

    const getStatus = (exam) => {
        if (exam.status === 'inactive') return { label: 'Inactive', color: 'danger' };
        if (!currentTime) return { label: '...', color: 'secondary' };
        
        const now = currentTime.getTime();
        const start = new Date(exam.startDate).getTime();
        const end = new Date(exam.endDate).getTime();

        if (now < start) return { label: 'Upcoming', color: 'warning text-dark' };
        if (now >= start && now <= end) return { label: 'Live', color: 'success' };
        if (now > end) return { label: 'Completed', color: 'secondary' };
        
        return { label: 'Active', color: 'success' };
    };

    const status = getStatus(exam);

    const fetchStudentsWithResults = async () => {
        setLoadingStudents(true);
        try {
            const res = await fetch(`/api/exams/${exam._id}/students-results`);
            const data = await res.json();
            if (data.success) {
                setStudents(data.students || []);
            }
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoadingStudents(false);
        }
    };

    useEffect(() => {
        if (showStudents && students.length === 0) {
            fetchStudentsWithResults();
        }
    }, [showStudents]);

    useEffect(() => {
        if (exam && exam.subjects && exam.subjects.length > 0) {
            const fetchQuestionCount = async () => {
                setLoadingQuestions(true);
                try {
                    const subjectIds = exam.subjects.map(s => s._id).join(',');
                    const res = await fetch(`/api/questions?subject=${subjectIds}`);
                    const data = await res.json();
                    if (data.success) {
                        setQuestionCount(data.data.length);
                    }
                } catch (error) {
                    console.error('Error fetching question count:', error);
                } finally {
                    setLoadingQuestions(false);
                }
            };
            fetchQuestionCount();
        } else {
            setQuestionCount(0);
        }
    }, [exam]);

    if (!exam) return null;

    const statusColor = exam.status === 'active' ? 'success' : 'danger';
    const typeColor = exam.type === 'live' ? 'primary' : 'info';

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-xl modal-dialog-centered">
                <div className="modal-content border-0 shadow">
                    <div className="modal-header border-bottom-0">
                        <div>
                            <h5 className="modal-title fw-bold mb-1 d-flex align-items-center">
                                {liveStatus && (
                                    <span className="live-indicator me-2" title="Live Now"></span>
                                )}
                                {exam.name}
                            </h5>
                            <div className="d-flex gap-2">
                                <span className={`badge bg-${typeColor}`}>
                                    {exam.type === 'live' ? 'Live Exam' : 'Regular Exam'}
                                </span>
                                <span className={`badge bg-${status.color}`}>
                                    {status.label}
                                </span>
                            </div>
                        </div>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body pt-0">
                        <div className="row g-4 mt-2">
                            {/* Stats Cards */}
                            <div className="col-md-3 col-6">
                                <div className="p-3 bg-light rounded-3 text-center h-100">
                                    <FiClock className="text-primary mb-2" size={24} />
                                    <h6 className="mb-1">{exam.duration} min</h6>
                                    <small className="text-muted">Duration</small>
                                </div>
                            </div>
                            <div className="col-md-3 col-6">
                                <div className="p-3 bg-light rounded-3 text-center h-100">
                                    <FiTarget className="text-success mb-2" size={24} />
                                    <h6 className="mb-1">{exam.totalMarks}</h6>
                                    <small className="text-muted">Total Marks</small>
                                </div>
                            </div>
                            <div className="col-md-3 col-6">
                                <div className="p-3 bg-light rounded-3 text-center h-100">
                                    <FiPercent className="text-warning mb-2" size={24} />
                                    <h6 className="mb-1">{exam.passingPercentage}%</h6>
                                    <small className="text-muted">Passing</small>
                                </div>
                            </div>
                            <div className="col-md-3 col-6">
                                <div className="p-3 bg-light rounded-3 text-center h-100">
                                    <FiHelpCircle className="text-info mb-2" size={24} />
                                    <h6 className="mb-1">
                                        {loadingQuestions ? '...' : questionCount}
                                    </h6>
                                    <small className="text-muted">Questions</small>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="col-md-6">
                                <h6 className="fw-bold mb-3">Schedule</h6>
                                <div className="d-flex align-items-center mb-3">
                                    <div className="bg-light p-2 rounded me-3">
                                        <FiCalendar className="text-muted" />
                                    </div>
                                    <div>
                                        <small className="text-muted d-block">Start Date & Time</small>
                                        <span className="fw-medium">{new Date(exam.startDate).toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center">
                                    <div className="bg-light p-2 rounded me-3">
                                        <FiCalendar className="text-muted" />
                                    </div>
                                    <div>
                                        <small className="text-muted d-block">End Date & Time</small>
                                        <span className="fw-medium">{new Date(exam.endDate).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-6">
                                <h6 className="fw-bold mb-3">Classification</h6>
                                <div className="mb-3">
                                    <small className="text-muted d-block mb-1">Category</small>
                                    <span className="badge bg-light text-dark border">
                                        {exam.category?.name || 'Uncategorized'}
                                    </span>
                                </div>
                                <div>
                                    <small className="text-muted d-block mb-1">Subjects</small>
                                    <div className="d-flex flex-wrap gap-2">
                                        {exam.subjects?.map((sub, idx) => (
                                            <span key={idx} className="badge bg-light text-dark border">
                                                {sub.name}
                                            </span>
                                        )) || <span className="text-muted">-</span>}
                                    </div>
                                </div>
                            </div>

                            {exam.description && (
                                <div className="col-12">
                                    <h6 className="fw-bold mb-2">Description</h6>
                                    <p className="text-muted bg-light p-3 rounded mb-0">{exam.description}</p>
                                </div>
                            )}
                            
                            {exam.instructions && (
                                <div className="col-12">
                                    <h6 className="fw-bold mb-2">Instructions</h6>
                                    <p className="text-muted bg-light p-3 rounded mb-0">{exam.instructions}</p>
                                </div>
                            )}

                            {/* Settings */}
                            <div className="col-12">
                                <h6 className="fw-bold mb-3">Proctoring Settings</h6>
                                <div className="d-flex flex-wrap gap-3">
                                    {Object.entries(exam.settings || {}).map(([key, value]) => (
                                        <div key={key} className={`d-flex align-items-center ${value ? 'text-success' : 'text-muted'}`}>
                                            {value ? <FiCheckCircle className="me-2" /> : <FiXCircle className="me-2" />}
                                            <span className="text-capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Students Results Section */}
                    {showStudents && (
                        <div className="modal-body border-top">
                            <h5 className="fw-bold mb-3">
                                <FiUsers className="me-2" />
                                Students & Their Results
                            </h5>

                            {loadingStudents ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : students.length === 0 ? (
                                <div className="alert alert-info">
                                    <FiUsers className="me-2" />
                                    No students have attempted this exam yet.
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Student</th>
                                                <th>Roll No</th>
                                                <th>Email</th>
                                                <th className="text-center">Attempts</th>
                                                <th className="text-center">Best Score</th>
                                                <th className="text-center">Status</th>
                                                <th className="text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {students.map((student) => (
                                                <tr key={student._id}>
                                                    <td>
                                                        <div className="fw-medium">{student.name}</div>
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-light text-dark">{student.rollNo}</span>
                                                    </td>
                                                    <td className="text-muted small">{student.email}</td>
                                                    <td className="text-center">
                                                        <span className="badge bg-primary">{student.totalAttempts}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        {student.bestAttempt ? (
                                                            <span className={`badge ${student.bestAttempt.passed ? 'bg-success' : 'bg-danger'}`}>
                                                                {student.bestAttempt.percentage?.toFixed(2)}%
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted">-</span>
                                                        )}
                                                    </td>
                                                    <td className="text-center">
                                                        {student.bestAttempt?.resultStatus === 'draft' ? (
                                                            <span className="badge bg-warning text-dark">Under Review</span>
                                                        ) : student.bestAttempt?.passed ? (
                                                            <span className="badge bg-success">Passed</span>
                                                        ) : student.totalAttempts > 0 ? (
                                                            <span className="badge bg-danger">Failed</span>
                                                        ) : (
                                                            <span className="badge bg-secondary">Not Attempted</span>
                                                        )}
                                                    </td>
                                                    <td className="text-center">
                                                        {student.totalAttempts > 0 && (
                                                            <Link
                                                                href={`/exam/${exam._id}/student-results/${student._id}`}
                                                                className="btn btn-sm btn-outline-primary"
                                                            >
                                                                <FiEye className="me-1" size={14} />
                                                                View All
                                                            </Link>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="modal-footer border-top-0">
                        <button 
                            type="button" 
                            className="btn btn-info me-auto"
                            onClick={() => setShowStudents(!showStudents)}
                        >
                            <FiUsers className="me-2" />
                            {showStudents ? 'Hide Students' : 'View Students & Results'}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamViewModal;
