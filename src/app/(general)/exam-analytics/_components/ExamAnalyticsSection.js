'use client'

import ExamStatsCard from '../../../../components/exam-analytics/ExamStatsCard';
import TopPerformersCard from '../../../../components/exam-analytics/TopPerformersCard';
import MostMissedQuestionsCard from '../../../../components/exam-analytics/MostMissedQuestionsCard';

// Stats cards + top performers + most missed questions for the selected exam,
// or an empty-search message when nothing matches.
export default function ExamAnalyticsSection({ selectedExam, examData, filteredExams, searchTerm, onUserClick }) {
    if (selectedExam && examData) {
        return (
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
                            onUserClick={onUserClick}
                        />
                    </div>
                    <div className="col-lg-6 mb-4">
                        <MostMissedQuestionsCard
                            questions={examData.mostMissedQuestions}
                        />
                    </div>
                </div>
            </>
        );
    }

    if (filteredExams.length === 0 && searchTerm) {
        return (
            <div className="text-center py-5">
                <div className="text-muted">
                    <i className="fas fa-search fa-4x mb-3"></i>
                    <h5>No exams found</h5>
                    <p>Try adjusting your search criteria</p>
                </div>
            </div>
        );
    }

    return null;
}
