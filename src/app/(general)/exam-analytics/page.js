'use client'
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ExamStatsCard from '../../../components/exam-analytics/ExamStatsCard';
import TopPerformersCard from '../../../components/exam-analytics/TopPerformersCard';
import MostMissedQuestionsCard from '../../../components/exam-analytics/MostMissedQuestionsCard';
import UserExamDetailModal from '../../../components/exam-analytics/UserExamDetailModal';
import ProtectedRoute from '@/components/shared/ProtectedRoute';

export default function ExamAnalytics() {
    const [exams, setExams] = useState([]);
    const [filteredExams, setFilteredExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState(null);
    const [examData, setExamData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [subjectFilter, setSubjectFilter] = useState('all');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [examDetailView, setExamDetailView] = useState(false);
    const [examId, setExamId] = useState(null);
    const [examDetailData, setExamDetailData] = useState(null);
    const [realTopicData, setRealTopicData] = useState([]);
    const [realQuestionData, setRealQuestionData] = useState([]);
    
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Load fallback data immediately to prevent loading
        setExams(getFallbackExams());
        setLoading(false);
        
        // Then try to fetch real data
        fetchExams();
    }, []);

    useEffect(() => {
        // Check if we have exam parameter for detail view
        const examParam = searchParams.get('exam');
        if (examParam && exams.length > 0) {
            setExamId(examParam);
            setExamDetailView(true);
            fetchExamDetailData(examParam);
        } else if (!examParam) {
            // Reset detail view when no exam parameter
            setExamDetailView(false);
            setExamId(null);
            setExamDetailData(null);
        }
    }, [searchParams, exams]);

    useEffect(() => {
        let filtered = exams;

        // Only show completed exams
        filtered = filtered.filter(exam => exam.status === 'completed');

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(exam => 
                exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                exam.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                exam.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(exam => exam.status === statusFilter);
        }

        // Filter by subject
        if (subjectFilter !== 'all') {
            filtered = filtered.filter(exam => exam.subject === subjectFilter);
        }

        setFilteredExams(filtered);
    }, [searchTerm, statusFilter, subjectFilter, exams]);

    useEffect(() => {
        const examParam = searchParams.get('exam');
        if (examParam && exams.length > 0) {
            const exam = exams.find(e => e.id === examParam);
            if (exam) {
                setSelectedExam(exam);
                fetchExamAnalytics(examParam);
            }
        }
    }, [searchParams, exams]);

    const fetchExams = async () => {
        try {
            setLoading(true);
            console.log('Fetching exams from API...');
            
            // Fetch real exam data from API
            const response = await fetch('/api/exams?analytics=true');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('API Response:', result);
            
            if (result.success && result.data && result.data.length > 0) {
                setExams(result.data);
                console.log('Loaded real exams:', result.data.length);
            } else {
                console.log('No real exams found, using fallback data');
                // Use fallback data
                setExams(getFallbackExams());
            }
        } catch (error) {
            console.error('Error fetching exams:', error);
            console.log('API failed, using fallback data');
            // Always provide fallback data on error
            setExams(getFallbackExams());
        } finally {
            setLoading(false);
        }
    };

    const getFallbackExams = () => {
        return [
            { 
                id: '1', 
                title: 'mah exam', 
                subject: 'BCA', 
                description: 'Comprehensive BCA examination covering Python and Java programming',
                totalQuestions: 50, 
                duration: 133,
                totalStudents: 0,
                averageScore: 0,
                highestScore: 0,
                lowestScore: 0,
                passRate: 0,
                status: 'completed',
                createdAt: new Date('2025-12-03'),
                completedAt: new Date('2025-12-04'),
                difficulty: 'Medium'
            },
            { 
                id: '2', 
                title: 'Python Programming Test', 
                subject: 'Python', 
                description: 'Advanced Python programming assessment',
                totalQuestions: 40, 
                duration: 90,
                totalStudents: 0,
                averageScore: 0,
                highestScore: 0,
                lowestScore: 0,
                passRate: 0,
                status: 'active',
                createdAt: new Date('2025-11-28'),
                completedAt: null,
                difficulty: 'Hard'
            }
        ];
    };

    const fetchExamAnalytics = async (examId) => {
        try {
            // Mock exam analytics data
            const mockAnalytics = {
                totalAttempts: 8,
                completedAttempts: 8,
                averageScore: 6.04,
                highestScore: { score: 7, total: 29 },
                topPerformers: [
                    { id: 1, name: 'John Doe', email: 'john@example.com', score: 24, percentage: 96, timeSpent: 85, correctAnswers: 24, wrongAnswers: 1 },
                    { id: 2, name: 'Jane Smith', email: 'jane@example.com', score: 22, percentage: 88, timeSpent: 92, correctAnswers: 22, wrongAnswers: 3 },
                    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', score: 21, percentage: 84, timeSpent: 78, correctAnswers: 21, wrongAnswers: 4 }
                ],
                mostMissedQuestions: [
                    { id: 1, question: 'What is the derivative of sin(x)?', incorrectCount: 6, totalAttempts: 8, percentage: 75 },
                    { id: 2, question: 'Solve for x: 2x + 5 = 15', incorrectCount: 5, totalAttempts: 8, percentage: 62.5 },
                    { id: 3, question: 'What is the integral of x²?', incorrectCount: 4, totalAttempts: 8, percentage: 50 }
                ]
            };
            setExamData(mockAnalytics);
        } catch (error) {
            console.error('Error fetching exam analytics:', error);
        }
    };

    const fetchRealExamData = async (examId) => {
        try {
            console.log('Fetching real exam analytics data for:', examId);
            
            // Fetch real topic and question data
            const response = await fetch(`/api/exam-analytics/${examId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setRealTopicData(data.topicBreakdown || []);
                    setRealQuestionData(data.questionAnalysis || []);
                }
            }
        } catch (error) {
            console.error('Error fetching real exam data:', error);
        }
    };

    const fetchExamDetailData = async (examId) => {
        try {
            console.log('Fetching detail data for exam:', examId);
            
            // Fetch real exam data from database
            const examResponse = await fetch(`/api/exams/${examId}`);
            if (!examResponse.ok) {
                throw new Error('Failed to fetch exam details');
            }
            
            const examResult = await examResponse.json();
            console.log('Exam API response:', examResult);
            
            if (!examResult.success || !examResult.data) {
                throw new Error('Invalid exam data');
            }
            
            const exam = examResult.data;
            
            // Fetch real analytics data (questions and topics)
            await fetchRealExamData(examId);
            
            // Calculate real statistics from attempts
            const attempts = exam.attempts || [];
            const completedAttempts = attempts.filter(a => a.status === 'submitted' || a.status === 'expired');
            
            let totalScore = 0;
            let maxScore = 0;
            let minScore = 100;
            let passCount = 0;
            
            const scoreRanges = {
                '90-100': 0,
                '80-89': 0,
                '70-79': 0,
                '60-69': 0,
                '50-59': 0,
                '0-49': 0
            };
            
            const timeRanges = {};
            const quarterDuration = Math.floor((exam.duration || 120) / 4);
            
            completedAttempts.forEach(attempt => {
                const score = attempt.score || 0;
                totalScore += score;
                maxScore = Math.max(maxScore, score);
                minScore = Math.min(minScore, score);
                
                if (attempt.passed) passCount++;
                
                // Score distribution
                if (score >= 90) scoreRanges['90-100']++;
                else if (score >= 80) scoreRanges['80-89']++;
                else if (score >= 70) scoreRanges['70-79']++;
                else if (score >= 60) scoreRanges['60-69']++;
                else if (score >= 50) scoreRanges['50-59']++;
                else scoreRanges['0-49']++;
            });
            
            const averageScore = completedAttempts.length > 0 ? (totalScore / completedAttempts.length).toFixed(2) : 0;
            const passPercentage = completedAttempts.length > 0 ? ((passCount / completedAttempts.length) * 100).toFixed(1) : 0;
            
            // Build score distribution array
            const scoreDistribution = Object.entries(scoreRanges).map(([range, count]) => ({
                range,
                count,
                percentage: completedAttempts.length > 0 ? ((count / completedAttempts.length) * 100).toFixed(1) : 0
            }));
            
            // Get recent submissions with real user data
            const recentSubmissions = completedAttempts
                .sort((a, b) => new Date(b.submittedAt || b.updatedAt) - new Date(a.submittedAt || a.updatedAt))
                .slice(0, 5)
                .map(attempt => {
                    let grade = 'F';
                    const score = attempt.score || 0;
                    if (score >= 90) grade = 'A';
                    else if (score >= 80) grade = 'B+';
                    else if (score >= 70) grade = 'B';
                    else if (score >= 60) grade = 'C+';
                    else if (score >= 50) grade = 'C';
                    
                    return {
                        studentId: attempt.userId?.toString() || 'Unknown',
                        name: attempt.userName || 'Student',
                        score: score,
                        completionTime: attempt.timeTaken || 0,
                        submittedAt: attempt.submittedAt || attempt.updatedAt,
                        grade: grade
                    };
                });
            
            const detailData = {
                id: exam._id.toString(),
                title: exam.title,
                subject: exam.subject?.name || 'N/A',
                description: exam.description || '',
                status: new Date(exam.endDate) < new Date() ? 'completed' : 'active',
                difficulty: exam.difficulty || 'Medium',
                totalQuestions: exam.questions?.length || 0,
                duration: exam.duration || 120,
                participants: completedAttempts.length,
                averageScore: parseFloat(averageScore),
                completionDate: exam.endDate ? new Date(exam.endDate).toISOString().split('T')[0] : null,
                maxScore: maxScore || 0,
                minScore: completedAttempts.length > 0 ? minScore : 0,
                passPercentage: parseFloat(passPercentage),
                topicBreakdown: realTopicData.length > 0 ? realTopicData : [],
                scoreDistribution: scoreDistribution,
                timeAnalysis: {
                    averageTime: Math.floor(exam.duration * 0.85),
                    fastestCompletion: Math.floor(exam.duration * 0.6),
                    slowestCompletion: exam.duration,
                    timeDistribution: [
                        { range: `${Math.floor(exam.duration * 0.6)}-${Math.floor(exam.duration * 0.7)} min`, count: 0, percentage: 0 },
                        { range: `${Math.floor(exam.duration * 0.7)}-${Math.floor(exam.duration * 0.8)} min`, count: 0, percentage: 0 },
                        { range: `${Math.floor(exam.duration * 0.8)}-${Math.floor(exam.duration * 0.9)} min`, count: 0, percentage: 0 },
                        { range: `${Math.floor(exam.duration * 0.9)}-${exam.duration} min`, count: 0, percentage: 0 }
                    ]
                },
                questionAnalysis: realQuestionData.length > 0 ? realQuestionData : [],
                recentSubmissions: recentSubmissions
            };
            
            console.log('Generated detail data:', detailData);
            setExamDetailData(detailData);
        } catch (error) {
            console.error('Error fetching exam detail data:', error);
            setExamDetailData(null);
        }
    };

    const handleBackToList = () => {
        setExamDetailView(false);
        setExamId(null);
        setExamDetailData(null);
        setSelectedExam(null); // Reset selected exam
        setExamData(null);     // Reset exam data
        router.push('/exam-analytics', { scroll: false }); // Prevent scroll reset
    };

    const handleExamSelect = (exam) => {
        setSelectedExam(exam);
        router.push(`/exam-analytics?exam=${exam.id}`);
    };

    const handleUserClick = (user) => {
        setSelectedUser(user);
        setShowUserModal(true);
    };

    // If exam detail view is requested, show exam detail page
    if (examDetailView && examDetailData && !loading) {
        return (
            <div className="container-fluid">
                {/* Header with back button */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <button 
                                    className="btn btn-outline-primary me-3"
                                    onClick={handleBackToList}
                                >
                                    <i className="fas fa-arrow-left me-2"></i>Back to Exams
                                </button>
                                <h2 className="d-inline-block mb-0">{examDetailData.title}</h2>
                            </div>
                            <div className="d-flex gap-2">
                                <span className={`badge bg-${examDetailData.status === 'completed' ? 'success' : examDetailData.status === 'active' ? 'warning' : 'secondary'}`}>
                                    {examDetailData.status.toUpperCase()}
                                </span>
                                <span className="badge bg-info">{examDetailData.subject}</span>
                                <span className={`badge bg-${examDetailData.difficulty === 'Easy' ? 'success' : examDetailData.difficulty === 'Medium' ? 'warning' : 'danger'}`}>
                                    {examDetailData.difficulty}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Overview Stats */}
                <div className="row mb-4">
                    <div className="col-md-3">
                        <div className="card text-center">
                            <div className="card-body">
                                <h4 className="text-primary">{examDetailData.participants}</h4>
                                <p className="mb-0">Total Participants</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card text-center">
                            <div className="card-body">
                                <h4 className="text-success">{examDetailData.averageScore}%</h4>
                                <p className="mb-0">Average Score</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card text-center">
                            <div className="card-body">
                                <h4 className="text-info">{examDetailData.passPercentage}%</h4>
                                <p className="mb-0">Pass Rate</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card text-center">
                            <div className="card-body">
                                <h4 className="text-warning">{examDetailData.timeAnalysis.averageTime} min</h4>
                                <p className="mb-0">Avg. Completion Time</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Score Distribution Chart */}
                <div className="row mb-4">
                    <div className="col-md-6">
                        <div className="card">
                            <div className="card-header">
                                <h5 className="mb-0">
                                    <i className="fas fa-chart-bar me-2"></i>Score Distribution
                                </h5>
                            </div>
                            <div className="card-body">
                                {examDetailData.scoreDistribution.map((dist, index) => (
                                    <div key={index} className="mb-3">
                                        <div className="d-flex justify-content-between">
                                            <span>{dist.range}%</span>
                                            <span>{dist.count} students ({dist.percentage}%)</span>
                                        </div>
                                        <div className="progress" style={{height: '8px'}}>
                                            <div 
                                                className="progress-bar bg-primary" 
                                                style={{width: `${dist.percentage}%`}}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="card">
                            <div className="card-header">
                                <h5 className="mb-0">
                                    <i className="fas fa-clock me-2"></i>Time Analysis
                                </h5>
                            </div>
                            <div className="card-body">
                                <div className="row mb-3">
                                    <div className="col-6">
                                        <small className="text-muted">Fastest</small>
                                        <div className="h6">{examDetailData.timeAnalysis.fastestCompletion} min</div>
                                    </div>
                                    <div className="col-6">
                                        <small className="text-muted">Slowest</small>
                                        <div className="h6">{examDetailData.timeAnalysis.slowestCompletion} min</div>
                                    </div>
                                </div>
                                {examDetailData.timeAnalysis.timeDistribution.map((time, index) => (
                                    <div key={index} className="mb-2">
                                        <div className="d-flex justify-content-between">
                                            <span>{time.range}</span>
                                            <span>{time.count} ({time.percentage}%)</span>
                                        </div>
                                        <div className="progress" style={{height: '6px'}}>
                                            <div 
                                                className="progress-bar bg-info" 
                                                style={{width: `${time.percentage}%`}}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Topic Breakdown */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header">
                                <h5 className="mb-0">
                                    <i className="fas fa-tasks me-2"></i>Topic-wise Performance
                                </h5>
                            </div>
                            <div className="card-body">
                                <div className="row">
                                    {examDetailData.topicBreakdown.map((topic, index) => (
                                        <div key={index} className="col-md-4">
                                            <div className="card bg-light">
                                                <div className="card-body text-center">
                                                    <h5>{topic.topic}</h5>
                                                    <p className="text-muted">{topic.questions} questions</p>
                                                    <h4 className={`text-${topic.averageScore >= 80 ? 'success' : topic.averageScore >= 70 ? 'warning' : 'danger'}`}>
                                                        {topic.averageScore}%
                                                    </h4>
                                                    <span className={`badge bg-${topic.difficulty === 'Easy' ? 'success' : topic.difficulty === 'Medium' ? 'warning' : 'danger'}`}>
                                                        {topic.difficulty}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Question Analysis */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header">
                                <h5 className="mb-0">
                                    <i className="fas fa-question-circle me-2"></i>Question Performance Analysis
                                </h5>
                            </div>
                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="table table-striped">
                                        <thead>
                                            <tr>
                                                <th>Question</th>
                                                <th>Topic</th>
                                                <th>Difficulty</th>
                                                <th>Correct Answers</th>
                                                <th>Success Rate</th>
                                                <th>Avg. Time</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {examDetailData.questionAnalysis.map((q, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <div>
                                                            <strong>#{q.questionNo}</strong>
                                                            {q.questionText && (
                                                                <div className="small text-muted mt-1">
                                                                    {q.questionText}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>{q.topic}</td>
                                                    <td>
                                                        <span className={`badge bg-${q.difficulty === 'Easy' ? 'success' : q.difficulty === 'Medium' ? 'warning' : 'danger'}`}>
                                                            {q.difficulty}
                                                        </span>
                                                    </td>
                                                    <td>{q.correctAnswers}/{q.totalAttempts || examDetailData.participants}</td>
                                                    <td>
                                                        <span className={`text-${q.percentage >= 80 ? 'success' : q.percentage >= 60 ? 'warning' : 'danger'}`}>
                                                            {q.percentage}%
                                                        </span>
                                                    </td>
                                                    <td>{q.avgTime} min</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Submissions */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header">
                                <h5 className="mb-0">
                                    <i className="fas fa-users me-2"></i>Recent Submissions
                                </h5>
                            </div>
                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="table table-striped">
                                        <thead>
                                            <tr>
                                                <th>Student ID</th>
                                                <th>Name</th>
                                                <th>Score</th>
                                                <th>Grade</th>
                                                <th>Completion Time</th>
                                                <th>Submitted At</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {examDetailData.recentSubmissions.map((submission, index) => (
                                                <tr key={index}>
                                                    <td>{submission.studentId}</td>
                                                    <td>{submission.name}</td>
                                                    <td>
                                                        <span className={`badge bg-${submission.score >= 90 ? 'success' : submission.score >= 80 ? 'info' : submission.score >= 70 ? 'warning' : 'danger'}`}>
                                                            {submission.score}%
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge bg-${submission.grade.startsWith('A') ? 'success' : submission.grade.startsWith('B') ? 'info' : submission.grade.startsWith('C') ? 'warning' : 'danger'}`}>
                                                            {submission.grade}
                                                        </span>
                                                    </td>
                                                    <td>{submission.completionTime} min</td>
                                                    <td>{submission.submittedAt}</td>
                                                    <td>
                                                        <button className="btn btn-sm btn-outline-primary">
                                                            <i className="fas fa-eye me-1"></i> View
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
            </div>
        );
    }

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
            {/* Header & Filters */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <h2 className="mb-1">Exam Analytics Dashboard</h2>
                            <p className="text-muted mb-0">
                                {selectedExam ? `Analytics for ${selectedExam.title}` : 'Comprehensive exam performance analysis and insights'}
                            </p>
                        </div>
                    </div>
                    
                    {/* Filters Row */}
                    <div className="d-flex flex-wrap gap-3 align-items-center">
                        {/* Search */}
                        <div className="position-relative">
                            <i className="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                            <input
                                type="text"
                                className="form-control ps-5"
                                placeholder="Search exams..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '250px' }}
                            />
                        </div>
                        
                        {/* Status Filter */}
                        <select 
                            className="form-select" 
                            style={{ width: 'auto' }}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="completed">Completed</option>
                            <option value="active">Active</option>
                            <option value="draft">Draft</option>
                        </select>
                        
                        {/* Subject Filter */}
                        <select 
                            className="form-select" 
                            style={{ width: 'auto' }}
                            value={subjectFilter}
                            onChange={(e) => setSubjectFilter(e.target.value)}
                        >
                            <option value="all">All Subjects</option>
                            {[...new Set(exams.map(exam => exam.subject))].map(subject => (
                                <option key={subject} value={subject}>{subject}</option>
                            ))}
                        </select>
                        
                        {/* Results Count */}
                        <span className="text-muted ms-auto">
                            Showing {filteredExams.length} of {exams.length} exams
                        </span>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="row mb-4">
                <div className="col-md-3">
                    <div className="card bg-primary text-white">
                        <div className="card-body text-center">
                            <i className="fas fa-file-alt fa-2x mb-2"></i>
                            <h3 className="mb-0">{exams.length}</h3>
                            <small>Total Exams</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-success text-white">
                        <div className="card-body text-center">
                            <i className="fas fa-check-circle fa-2x mb-2"></i>
                            <h3 className="mb-0">{exams.filter(e => e.status === 'completed').length}</h3>
                            <small>Completed Exams</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-warning text-white">
                        <div className="card-body text-center">
                            <i className="fas fa-users fa-2x mb-2"></i>
                            <h3 className="mb-0">{exams.reduce((sum, exam) => sum + exam.totalStudents, 0)}</h3>
                            <small>Total Participants</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-info text-white">
                        <div className="card-body text-center">
                            <i className="fas fa-percentage fa-2x mb-2"></i>
                            <h3 className="mb-0">
                                {exams.filter(e => e.status === 'completed').length > 0 
                                    ? (exams.filter(e => e.status === 'completed').reduce((sum, exam) => sum + exam.averageScore, 0) / exams.filter(e => e.status === 'completed').length).toFixed(1)
                                    : 0}%
                            </h3>
                            <small>Overall Average</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Exams Table */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">
                                <i className="fas fa-list me-2"></i>Exam Results & Analytics
                            </h5>
                            <div className="d-flex gap-2">
                                <span className="badge bg-success">{exams.filter(e => e.status === 'completed').length} Completed</span>
                                <span className="badge bg-warning">{exams.filter(e => e.status === 'active').length} Active</span>
                                <span className="badge bg-secondary">{exams.filter(e => e.status === 'draft').length} Draft</span>
                            </div>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Exam Title</th>
                                            <th>Subject</th>
                                            <th>Questions</th>
                                            <th>Students</th>
                                            <th>Avg Score</th>
                                            <th>Highest Score</th>
                                            <th>Pass Rate</th>
                                            <th>Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredExams.map((exam) => {
                                            // Format date as day/month/year
                                            const formatDate = (date) => {
                                                if (!date) return 'N/A';
                                                const d = new Date(date);
                                                const day = String(d.getDate()).padStart(2, '0');
                                                const month = String(d.getMonth() + 1).padStart(2, '0');
                                                const year = d.getFullYear();
                                                return `${day}/${month}/${year}`;
                                            };

                                            return (
                                                <tr key={exam.id} className={selectedExam?.id === exam.id ? 'table-primary' : ''}>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <div>
                                                                <h6 className="mb-0">{exam.title}</h6>
                                                                <small className="text-muted">{exam.duration} minutes</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-light text-dark">{exam.subjects || exam.subject}</span>
                                                    </td>
                                                    <td>{exam.questionCount || exam.totalQuestions || 0}</td>
                                                    <td>{exam.totalStudents}</td>
                                                    <td>
                                                        <span className={`badge ${exam.averageScore >= 80 ? 'bg-success' : exam.averageScore >= 60 ? 'bg-warning' : 'bg-danger'}`}>
                                                            {exam.averageScore.toFixed(1)}%
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-primary">{exam.highestScore}%</span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${exam.passRate >= 80 ? 'bg-success' : exam.passRate >= 60 ? 'bg-warning' : 'bg-danger'}`}>
                                                            {exam.passRate}%
                                                        </span>
                                                    </td>
                                                    <td>{formatDate(exam.createdAt)}</td>
                                                    <td>
                                                        <div className="d-flex gap-2">
                                                            <button
                                                                className={`btn btn-sm ${selectedExam?.id === exam.id ? 'btn-primary' : 'btn-outline-primary'}`}
                                                                onClick={() => handleExamSelect(exam)}
                                                                title="View Analytics"
                                                            >
                                                                <i className="fas fa-chart-bar me-1"></i>
                                                                {selectedExam?.id === exam.id ? 'Selected' : 'Analytics'}
                                                            </button>
                                                            {exam.status === 'completed' && (
                                                                <button
                                                                    className="btn btn-sm btn-info"
                                                                    onClick={() => {
                                                                        setSelectedExam(exam); // Preserve selection
                                                                        router.push(`/exam-analytics?exam=${exam.id}`);
                                                                    }}
                                                                    title="View Detailed Analytics"
                                                                >
                                                                    <i className="fas fa-eye me-1"></i>
                                                                    Details
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {selectedExam && examData ? (
                <>
                    {/* Stats Cards */}
                    <div className="row mb-4">
                        <div className="col-md-3">
                            <ExamStatsCard
                                title="Total Attempts"
                                value={examData.totalAttempts}
                                icon="fas fa-users"
                                bgColor="primary"
                            />
                        </div>
                        <div className="col-md-3">
                            <ExamStatsCard
                                title="Completed Attempts"
                                value={examData.completedAttempts}
                                icon="fas fa-check-circle"
                                bgColor="success"
                            />
                        </div>
                        <div className="col-md-3">
                            <ExamStatsCard
                                title="Average Score"
                                value={`${examData.averageScore}%`}
                                icon="fas fa-chart-bar"
                                bgColor="warning"
                            />
                        </div>
                        <div className="col-md-3">
                            <ExamStatsCard
                                title="Highest Score"
                                value={`${examData.highestScore.score}/${examData.highestScore.total}`}
                                icon="fas fa-trophy"
                                bgColor="info"
                            />
                        </div>
                    </div>

                    {/* Analytics Cards */}
                    <div className="row">
                        <div className="col-lg-6 mb-4">
                            <TopPerformersCard
                                performers={examData.topPerformers}
                                onUserClick={handleUserClick}
                            />
                        </div>
                        <div className="col-lg-6 mb-4">
                            <MostMissedQuestionsCard
                                questions={examData.mostMissedQuestions}
                            />
                        </div>
                    </div>
                </>
            ) : (
                filteredExams.length === 0 && searchTerm && (
                    <div className="text-center py-5">
                        <div className="text-muted">
                            <i className="fas fa-search fa-4x mb-3"></i>
                            <h5>No exams found</h5>
                            <p>Try adjusting your search criteria</p>
                        </div>
                    </div>
                )
            )}

            {/* User Detail Modal */}
            <UserExamDetailModal
                show={showUserModal}
                onHide={() => setShowUserModal(false)}
                user={selectedUser}
                examData={selectedExam}
            />
        </div>
        </ProtectedRoute>
    );
}