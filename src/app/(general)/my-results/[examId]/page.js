'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import Swal from 'sweetalert2';

import LoadingSkeleton from './_components/LoadingSkeleton';
import ExamInfoCard from './_components/ExamInfoCard';
import AttemptsFilters from './_components/AttemptsFilters';
import AttemptsTable from './_components/AttemptsTable';
import { formatDate } from './_components/formatters';
import { downloadCertificate } from './_components/certificateGenerator';

const ExamAttemptsPage = () => {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const examId = params.examId;

    const [exam, setExam] = useState(null);
    const [attempts, setAttempts] = useState([]);
    const [filteredAttempts, setFilteredAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all'); // all, passed, failed
    const [sortBy, setSortBy] = useState('recent'); // recent, score
    const [searchQuery, setSearchQuery] = useState('');
    const [downloadingCertificate, setDownloadingCertificate] = useState(null); // Store attempt ID being downloaded

    useEffect(() => {
        if (!user) {
            router.push('/authentication/login');
            return;
        }

        if (user.role !== 'student') {
            router.push('/');
            return;
        }

        fetchExamAttempts();
        fetchSettings();
    }, [user, examId]);

    useEffect(() => {
        applyFilters();
    }, [attempts, searchQuery, filterStatus, sortBy]);

    const applyFilters = () => {
        let filtered = [...attempts];

        // Search filter (by date)
        if (searchQuery) {
            filtered = filtered.filter(attempt => {
                const dateStr = formatDate(attempt.submittedAt || attempt.createdAt).toLowerCase();
                return dateStr.includes(searchQuery.toLowerCase());
            });
        }

        // Status filter
        if (filterStatus !== 'all') {
            filtered = filtered.filter(attempt => {
                if (filterStatus === 'passed') return attempt.passed;
                if (filterStatus === 'failed') return !attempt.passed;
                return true;
            });
        }

        // Sort
        filtered.sort((a, b) => {
            if (sortBy === 'recent') {
                return new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt);
            }
            if (sortBy === 'score') {
                return (b.score || 0) - (a.score || 0);
            }
            return 0;
        });

        setFilteredAttempts(filtered);
    };

    const fetchExamAttempts = async () => {
        try {
            const response = await fetch(`/api/student/exam-attempts/${examId}`);
            const data = await response.json();

            if (data.success) {
                setExam(data.exam);
                // Sort attempts by date - newest first
                const sortedAttempts = (data.attempts || []).sort((a, b) => {
                    const dateA = new Date(a.submittedAt || a.createdAt);
                    const dateB = new Date(b.submittedAt || b.createdAt);
                    return dateB - dateA; // Descending order (newest first)
                });
                setAttempts(sortedAttempts);
            } else {
                Swal.fire('Error', data.message || 'Failed to fetch attempts', 'error');
            }
        } catch (error) {
            console.error('Error fetching exam attempts:', error);
            Swal.fire('Error', 'Failed to load exam attempts', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/settings');
            const data = await response.json();
            if (data.success) {
                setSettings(data.data);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const handleDownloadCertificate = async (attempt) => {
        setDownloadingCertificate(attempt._id);
        try {
            await downloadCertificate({ attempt, exam, user, settings });
        } catch (error) {
            console.error('Error generating certificate:', error);
            console.error('Error details:', error.message, error.stack);
            Swal.fire('Error', 'Failed to generate certificate: ' + error.message, 'error');
        } finally {
            setDownloadingCertificate(null);
        }
    };

    if (loading) {
        return <LoadingSkeleton />;
    }

    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-12">
                    <div className="page-header">
                        <div className="page-header-left d-flex align-items-center">
                            <Link href="/my-results" className="btn btn-sm btn-light me-3">
                                <FiArrowLeft className="me-2" />
                                Back to Results
                            </Link>
                            <div className="page-header-title">
                                <h5 className="m-b-10">{exam?.title}</h5>
                                <p className="text-muted small mb-0">Exam Result Details</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ExamInfoCard exam={exam} attemptsCount={attempts.length} />

            <AttemptsFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                sortBy={sortBy}
                setSortBy={setSortBy}
                filteredCount={filteredAttempts.length}
            />

            <AttemptsTable
                exam={exam}
                examId={examId}
                attempts={attempts}
                filteredAttempts={filteredAttempts}
                downloadingCertificate={downloadingCertificate}
                onDownloadCertificate={handleDownloadCertificate}
            />
        </div>
    );
};

export default ExamAttemptsPage;
