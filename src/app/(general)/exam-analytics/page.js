'use client'
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import UserExamDetailModal from '../../../components/exam-analytics/UserExamDetailModal';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { getFallbackExams } from './_components/fallbackData';
import { fetchExamAnalyticsData, fetchRealExamAnalyticsData, buildExamDetailData } from './_components/examDataHelpers';
import ExamDetailView from './_components/ExamDetailView';
import ExamFiltersHeader from './_components/ExamFiltersHeader';
import ExamSummaryStats from './_components/ExamSummaryStats';
import ExamsTable from './_components/ExamsTable';
import ExamAnalyticsSection from './_components/ExamAnalyticsSection';

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
            // Fetch real exam data from API
            const response = await fetch('/api/exams?analytics=true');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.success && result.data && result.data.length > 0) {
                setExams(result.data);
                } else {
                // Use fallback data
                setExams(getFallbackExams());
            }
        } catch (error) {
            console.error('Error fetching exams:', error);
            // Always provide fallback data on error
            setExams(getFallbackExams());
        } finally {
            setLoading(false);
        }
    };

    const fetchExamAnalytics = async (examId) => {
        try {
            const mockAnalytics = await fetchExamAnalyticsData(examId);
            setExamData(mockAnalytics);
        } catch (error) {
            console.error('Error fetching exam analytics:', error);
        }
    };

    const fetchRealExamData = async (examId) => {
        try {
            const { topicBreakdown, questionAnalysis } = await fetchRealExamAnalyticsData(examId);
            setRealTopicData(topicBreakdown);
            setRealQuestionData(questionAnalysis);
        } catch (error) {
            console.error('Error fetching real exam data:', error);
        }
    };

    const fetchExamDetailData = async (examId) => {
        try {
            // Fetch real exam data from database
            const examResponse = await fetch(`/api/exams/${examId}`);
            if (!examResponse.ok) {
                throw new Error('Failed to fetch exam details');
            }

            const examResult = await examResponse.json();
            if (!examResult.success || !examResult.data) {
                throw new Error('Invalid exam data');
            }

            const exam = examResult.data;

            // Fetch real analytics data (questions and topics)
            await fetchRealExamData(examId);

            const detailData = buildExamDetailData(exam, realTopicData, realQuestionData);

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

    const handleViewDetails = (exam) => {
        setSelectedExam(exam); // Preserve selection
        router.push(`/exam-analytics?exam=${exam.id}`);
    };

    const handleUserClick = (user) => {
        setSelectedUser(user);
        setShowUserModal(true);
    };

    // If exam detail view is requested, show exam detail page
    if (examDetailView && examDetailData && !loading) {
        return (
            <ExamDetailView examDetailData={examDetailData} onBackToList={handleBackToList} />
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
            <ExamFiltersHeader
                selectedExam={selectedExam}
                exams={exams}
                filteredExams={filteredExams}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                subjectFilter={subjectFilter}
                setSubjectFilter={setSubjectFilter}
            />

            {/* Summary Stats */}
            <ExamSummaryStats exams={exams} />

            {/* Exams Table */}
            <ExamsTable
                exams={exams}
                filteredExams={filteredExams}
                selectedExam={selectedExam}
                onExamSelect={handleExamSelect}
                onViewDetails={handleViewDetails}
            />

            <ExamAnalyticsSection
                selectedExam={selectedExam}
                examData={examData}
                filteredExams={filteredExams}
                searchTerm={searchTerm}
                onUserClick={handleUserClick}
            />

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
