'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiPlus, FiGrid, FiList, FiSearch, FiFilter } from 'react-icons/fi';
import ExamCard from './ExamCard';
import ExamTable from './ExamTable';
import ExamSkeleton from './ExamSkeleton';
import ExamViewModal from './ExamViewModal';
import ExamAnalyticsModal from '../shared/ExamAnalyticsModal';
import { toast } from 'react-toastify';

const ExamList = () => {
    const [viewMode, setViewMode] = useState('list');
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [selectedExam, setSelectedExam] = useState(null);
    const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
    const [analyticsExam, setAnalyticsExam] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000); // Update every 1 second
        return () => clearInterval(timer);
    }, []);

    const fetchExams = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (filterType) params.append('type', filterType);
            if (filterStatus) params.append('status', filterStatus);

            const res = await fetch(`/api/exams?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setExams(data.data);
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch exams');
        } finally {
            setLoading(false);
        }
    };

    // Test function to create notifications for live exams
    const testCreateNotifications = async () => {
        try {
            const res = await fetch('/api/test-notifications', {
                method: 'POST',
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to create test notifications');
        }
    };

    useEffect(() => {
        fetchExams();
    }, [search, filterType, filterStatus]);

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this exam?')) return;
        try {
            const res = await fetch(`/api/exams/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                toast.success('Exam deleted successfully');
                fetchExams();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error('Failed to delete exam');
        }
    };

    const handleAnalytics = (exam) => {
        setAnalyticsExam(exam);
        setShowAnalyticsModal(true);
    };

    return (
        <div className="container-fluid p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-3">
                    <h2 className="fw-bold">Exams</h2>
                    <div className="dropdown">
                        <button className="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                            <FiPlus className="me-1" /> Add Exam
                        </button>
                        <ul className="dropdown-menu">
                            <li><Link className="dropdown-item" href="/exam/add/live">Live Exam</Link></li>
                            <li><Link className="dropdown-item" href="/exam/add/regular">Regular Exam</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="btn-group">
                    <button
                        className={`btn btn-outline-secondary ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                    >
                        <FiList />
                    </button>
                    <button
                        className={`btn btn-outline-secondary ${viewMode === 'card' ? 'active' : ''}`}
                        onClick={() => setViewMode('card')}
                    >
                        <FiGrid />
                    </button>
                </div>
            </div>

            <div className="card mb-4">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-4">
                            <div className="input-group">
                                <span className="input-group-text"><FiSearch /></span>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search exams..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-md-8">
                            <div className="d-flex gap-2">
                                <button
                                    className={`btn ${filterType === '' ? 'btn-dark' : 'btn-outline-dark'}`}
                                    onClick={() => setFilterType('')}
                                >
                                    All
                                </button>
                                <button
                                    className={`btn ${filterType === 'live' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setFilterType('live')}
                                >
                                    Live Exams
                                </button>
                                <button
                                    className={`btn ${filterType === 'regular' ? 'btn-info' : 'btn-outline-info'}`}
                                    onClick={() => setFilterType('regular')}
                                >
                                    Regular Exams
                                </button>
                                <select className="form-select w-auto ms-auto" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                    <option value="">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <ExamSkeleton viewMode={viewMode} />
            ) : exams.length === 0 ? (
                <div className="text-center py-5">
                    <h4 className="text-muted">No exams found</h4>
                </div>
            ) : viewMode === 'list' ? (
                <ExamTable
                    exams={exams}
                    onDelete={handleDelete}
                    onView={setSelectedExam}
                    onAnalytics={handleAnalytics}
                    currentTime={currentTime}
                />
            ) : (
                <div className="row">
                    {exams.map(exam => (
                        <ExamCard
                            key={exam._id}
                            exam={exam}
                            onDelete={handleDelete}
                            onView={setSelectedExam}
                            onAnalytics={handleAnalytics}
                            currentTime={currentTime}
                        />
                    ))}
                </div>
            )}

            {selectedExam && (
                <ExamViewModal
                    exam={selectedExam}
                    onClose={() => setSelectedExam(null)}
                    currentTime={currentTime}
                />
            )}

            {showAnalyticsModal && (
                <ExamAnalyticsModal
                    show={showAnalyticsModal}
                    onHide={() => {
                        setShowAnalyticsModal(false);
                        setAnalyticsExam(null);
                    }}
                    examId={analyticsExam?._id}
                    examTitle={analyticsExam?.name}
                />
            )}
        </div>
    );
};

export default ExamList;
