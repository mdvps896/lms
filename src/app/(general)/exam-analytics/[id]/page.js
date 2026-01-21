'use client'
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import UserExamModal from '../../../../components/exam-analytics/UserExamModal';
import ProtectedRoute from '@/components/shared/ProtectedRoute';

export default function ExamDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [examData, setExamData] = useState(null);
    const [userResults, setUserResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredResults, setFilteredResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchExamDetails();
    }, [params.id]);

    useEffect(() => {
        if (searchTerm) {
            setFilteredResults(userResults.filter(user => 
                (user.studentName || user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.studentEmail || user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
            ));
        } else {
            setFilteredResults(userResults);
        }
    }, [searchTerm, userResults]);

    const fetchExamDetails = async () => {
        try {
            const response = await fetch(`/api/exam-details/${params.id}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            if (result.success) {
                setExamData(result.exam);
                setUserResults(result.studentResults || []);
                } else {
                console.error('API Error:', result.error);
                // Fallback to mock data if API fails
                const mockExam = {
                    id: params.id,
                    title: 'Mathematics Final Exam',
                    subject: 'Mathematics',
                    totalQuestions: 50,
                    duration: 120,
                    passingScore: 60,
                    createdAt: '2024-01-15',
                    description: 'Comprehensive mathematics final examination covering algebra, geometry, and calculus'
                };
                setExamData(mockExam);
            }
        } catch (error) {
            console.error('Error fetching exam details:', error);
            // Fallback to mock data on error
            const mockExam = {
                id: params.id,
                title: 'Mathematics Final Exam',
                subject: 'Mathematics',
                totalQuestions: 50,
                duration: 120,
                passingScore: 60,
                createdAt: '2024-01-15',
                description: 'Comprehensive mathematics final examination covering algebra, geometry, and calculus'
            };
            setExamData(mockExam);
        } finally {
            setLoading(false);
        }
    };

    const handleUserClick = (user) => {
        // Redirect to result page instead of modal
        if (user.attemptId || user._id) {
            const attemptId = user.attemptId || user._id;
            const url = `/my-results/${params.id}/${attemptId}`;
            router.push(url);
        } else {
            // Fallback to modal if no attemptId
            setSelectedUser(user);
            setShowModal(true);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 90) return 'success';
        if (score >= 80) return 'primary';
        if (score >= 70) return 'warning';
        if (score >= 60) return 'info';
        return 'danger';
    };

    const getPassStatus = (score, passingScore) => {
        return score >= passingScore ? 'PASS' : 'FAIL';
    };

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute allowedRoles={['admin', 'teacher']}>
            <div className="container-fluid">
            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex align-items-center gap-3 mb-3">
                        <button
                            className="btn btn-outline-secondary"
                            onClick={() => router.back()}
                        >
                            <i className="fas fa-arrow-left"></i>
                        </button>
                        <div>
                            <h2 className="mb-0">{examData?.title}</h2>
                            <p className="text-muted mb-0">{examData?.subject} • {examData?.totalQuestions} Questions • {examData?.duration} minutes</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Exam Stats */}
            <div className="row mb-4">
                <div className="col-md-3">
                    <div className="card bg-primary text-white">
                        <div className="card-body text-center">
                            <i className="fas fa-user fa-2x mb-2"></i>
                            <h3 className="mb-0">{userResults.length}</h3>
                            <small>Total Students</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-success text-white">
                        <div className="card-body text-center">
                            <i className="fas fa-trophy fa-2x mb-2"></i>
                            <h3 className="mb-0">{Math.max(...userResults.map(u => u.score))}%</h3>
                            <small>Highest Score</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-warning text-white">
                        <div className="card-body text-center">
                            <i className="fas fa-chart-bar fa-2x mb-2"></i>
                            <h3 className="mb-0">{(userResults.reduce((sum, u) => sum + u.score, 0) / userResults.length).toFixed(1)}%</h3>
                            <small>Average Score</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-info text-white">
                        <div className="card-body text-center">
                            <i className="fas fa-check-circle fa-2x mb-2"></i>
                            <h3 className="mb-0">
                                {((userResults.filter(u => u.score >= (examData?.passingScore || 60)).length / userResults.length) * 100).toFixed(1)}%
                            </h3>
                            <small>Pass Rate</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="row mb-3">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">Student Results</h5>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search students..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ width: '300px' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Results Table */}
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Student</th>
                                            <th>Score</th>
                                            <th>Correct/Wrong</th>
                                            <th>Time Spent</th>
                                            <th>Status</th>
                                            <th>Submitted At</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredResults.map((user) => (
                                            <tr key={user._id || user.id} style={{ cursor: 'pointer' }}>
                                                <td>
                                                    <div>
                                                        <h6 className="mb-0">{user.studentName || user.name}</h6>
                                                        <small className="text-muted">{user.studentEmail || user.email}</small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge bg-${getScoreColor(user.score)} fs-6`}>
                                                        {user.score}%
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span className="badge bg-success">
                                                            <i className="fas fa-check me-1"></i>
                                                            {user.correctAnswers}
                                                        </span>
                                                        <span className="badge bg-danger">
                                                            <i className="fas fa-times me-1"></i>
                                                            {user.wrongAnswers}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="badge bg-light text-dark">
                                                        <i className="fas fa-clock me-1"></i>
                                                        {user.timeSpent} min
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${getPassStatus(user.score, examData?.passingScore || 60) === 'PASS' ? 'bg-success' : 'bg-danger'}`}>
                                                        {getPassStatus(user.score, examData?.passingScore || 60)}
                                                    </span>
                                                </td>
                                                <td>
                                                    {new Date(user.submittedAt).toLocaleString()}
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() => handleUserClick(user)}
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Detail Modal */}
            <UserExamModal
                show={showModal}
                onHide={() => setShowModal(false)}
                user={selectedUser}
                examData={examData}
            />
        </div>
        </ProtectedRoute>
    );
}