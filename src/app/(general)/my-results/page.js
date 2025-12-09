'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiClock, FiCalendar, FiFileText, FiEye, FiSearch, FiFilter } from 'react-icons/fi';
import Swal from 'sweetalert2';

const MyResultsPage = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [exams, setExams] = useState([]);
    const [filteredExams, setFilteredExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, passed, failed
    const [sortBy, setSortBy] = useState('recent'); // recent, score, attempts

    useEffect(() => {
        if (!user) {
            router.push('/authentication/login');
            return;
        }

        if (user.role !== 'student') {
            router.push('/');
            return;
        }

        fetchMyExams();
    }, [user]);

    useEffect(() => {
        applyFilters();
    }, [exams, searchQuery, filterStatus, sortBy]);

    const applyFilters = () => {
        let filtered = [...exams];

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(exam =>
                exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                exam.subject?.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Status filter
        if (filterStatus !== 'all') {
            filtered = filtered.filter(exam => {
                if (filterStatus === 'passed') return exam.lastAttempt?.passed;
                if (filterStatus === 'failed') return exam.lastAttempt && !exam.lastAttempt.passed;
                return true;
            });
        }

        // Sort
        filtered.sort((a, b) => {
            if (sortBy === 'recent') {
                return new Date(b.lastAttempt?.completedAt || 0) - new Date(a.lastAttempt?.completedAt || 0);
            }
            if (sortBy === 'score') {
                return (b.lastAttempt?.score || 0) - (a.lastAttempt?.score || 0);
            }
            if (sortBy === 'attempts') {
                return b.totalAttempts - a.totalAttempts;
            }
            return 0;
        });

        setFilteredExams(filtered);
    };

    const fetchMyExams = async () => {
        try {
            const response = await fetch('/api/student/my-results');

            if (!response.ok) {
                console.error('API Response not OK:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('Error response:', errorText);
                setLoading(false);
                return;
            }

            const data = await response.json();
            console.log('API Response:', data);

            if (data.success) {
                setExams(data.exams || []);
            } else {
                console.error('API Error:', data);
                setExams([]);
            }
        } catch (error) {
            console.error('Error fetching results:', error);
            setExams([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                        <div className="page-header">
                            <div className="page-header-left d-flex align-items-center">
                                <div className="page-header-title">
                                    <h5 className="m-b-10">My Results</h5>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Skeleton Loader */}
                <div className="row g-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="col-xxl-3 col-xl-4 col-md-6">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className="flex-grow-1">
                                            <div className="skeleton skeleton-text mb-2" style={{ width: '80%', height: '20px' }}></div>
                                            <div className="skeleton skeleton-text" style={{ width: '50%', height: '14px' }}></div>
                                        </div>
                                        <div className="skeleton skeleton-badge" style={{ width: '60px', height: '24px' }}></div>
                                    </div>
                                    <div className="mb-3">
                                        <div className="skeleton skeleton-text mb-2" style={{ width: '70%', height: '14px' }}></div>
                                        <div className="skeleton skeleton-text" style={{ width: '60%', height: '14px' }}></div>
                                    </div>
                                    <div className="mb-3 p-2 bg-light rounded">
                                        <div className="skeleton skeleton-text mb-2" style={{ width: '40%', height: '12px' }}></div>
                                        <div className="skeleton skeleton-text" style={{ width: '100%', height: '20px' }}></div>
                                    </div>
                                    <div className="skeleton skeleton-button" style={{ width: '100%', height: '36px' }}></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <style jsx>{`
                    .skeleton {
                        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                        background-size: 200% 100%;
                        animation: loading 1.5s infinite;
                        border-radius: 4px;
                    }
                    @keyframes loading {
                        0% { background-position: 200% 0; }
                        100% { background-position: -200% 0; }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-12">
                    <div className="page-header">
                        <div className="page-header-left d-flex align-items-center">
                            <div className="page-header-title">
                                <h5 className="m-b-10">My Results</h5>
                            </div>
                        </div>
                        <div className="page-header-right ms-auto">
                            <div className="d-flex align-items-center gap-2">
                                <span className="badge bg-primary">
                                    Total Exams: {exams.length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="row g-3 align-items-center">
                                {/* Search */}
                                <div className="col-md-4">
                                    <div className="input-group">
                                        <span className="input-group-text bg-white">
                                            <FiSearch size={16} />
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Search exams..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Status Filter */}
                                <div className="col-md-3">
                                    <select
                                        className="form-select"
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                    >
                                        <option value="all">All Status</option>
                                        <option value="passed">Passed</option>
                                        <option value="failed">Failed</option>
                                    </select>
                                </div>

                                {/* Sort By */}
                                <div className="col-md-3">
                                    <select
                                        className="form-select"
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                    >
                                        <option value="recent">Most Recent</option>
                                        <option value="score">Highest Score</option>
                                        <option value="attempts">Most Attempts</option>
                                    </select>
                                </div>

                                {/* Results Count */}
                                <div className="col-md-2 text-end">
                                    <span className="text-muted">
                                        {filteredExams.length} {filteredExams.length === 1 ? 'result' : 'results'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-3">{/* Added g-3 for gap */}
                {filteredExams.length === 0 ? (
                    <div className="col-12">
                        <div className="card border-0">
                            <div className="card-body text-center py-5">
                                <FiFileText size={64} className="text-muted mb-3" />
                                <h5 className="text-muted">
                                    {exams.length === 0 ? 'No exam results found' : 'No results match your filters'}
                                </h5>
                                <p className="text-muted">
                                    {exams.length === 0 
                                        ? "You haven't attempted any exams yet." 
                                        : 'Try adjusting your search or filters.'}
                                </p>
                                {exams.length === 0 && (
                                    <Link href="/my-exams" className="btn btn-primary mt-3">
                                        Browse Available Exams
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    filteredExams.map((exam) => (
                        <div key={exam._id} className="col-xxl-3 col-xl-4 col-md-6">
                            <div className="card border-0 shadow-sm h-100 hover-card">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className="flex-grow-1">
                                            <h6 className="fw-bold mb-2">{exam.title}</h6>
                                            <p className="text-muted small mb-0">
                                                {exam.subject?.name || 'N/A'}
                                            </p>
                                        </div>
                                        <span className={`badge ${exam.totalAttempts > 0 ? 'bg-success' : 'bg-secondary'}`}>
                                            {exam.totalAttempts} {exam.totalAttempts === 1 ? 'Attempt' : 'Attempts'}
                                        </span>
                                    </div>

                                    <div className="mb-3">
                                        <div className="d-flex align-items-center text-muted small mb-2">
                                            <FiClock className="me-2" size={14} />
                                            <span>Duration: {exam.duration} minutes</span>
                                        </div>
                                        <div className="d-flex align-items-center text-muted small">
                                            <FiFileText className="me-2" size={14} />
                                            <span>Total Questions: {exam.totalQuestions}</span>
                                        </div>
                                    </div>

                                    {exam.lastAttempt && (
                                        <div className="mb-3 p-2 bg-light rounded">
                                            <div className="small text-muted mb-1">Last Attempt:</div>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <span className="fw-bold">
                                                    {exam.lastAttempt.score?.toFixed(2)}%
                                                </span>
                                                <span className={`badge ${
                                                    exam.lastAttempt.resultStatus === 'draft' 
                                                        ? 'bg-warning' 
                                                        : exam.lastAttempt.passed 
                                                        ? 'bg-success' 
                                                        : 'bg-danger'
                                                }`}>
                                                    {exam.lastAttempt.resultStatus === 'draft' 
                                                        ? 'Under Review' 
                                                        : exam.lastAttempt.passed 
                                                        ? 'Passed' 
                                                        : 'Failed'
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <Link
                                        href={`/my-results/${exam._id}`}
                                        className="btn btn-primary w-100 btn-sm"
                                    >
                                        <FiEye className="me-2" size={14} />
                                        View All Attempts
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <style jsx>{`
                .hover-card {
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .hover-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
                }
            `}</style>
        </div>
    );
};

export default MyResultsPage;
