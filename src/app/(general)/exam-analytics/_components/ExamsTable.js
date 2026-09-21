'use client'

// Main exams results table with status badges and per-row actions.
export default function ExamsTable({ exams, filteredExams, selectedExam, onExamSelect, onViewDetails }) {
    return (
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
                                                            onClick={() => onExamSelect(exam)}
                                                            title="View Analytics"
                                                        >
                                                            <i className="fas fa-chart-bar me-1"></i>
                                                            {selectedExam?.id === exam.id ? 'Selected' : 'Analytics'}
                                                        </button>
                                                        {exam.status === 'completed' && (
                                                            <button
                                                                className="btn btn-sm btn-info"
                                                                onClick={() => onViewDetails(exam)}
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
    );
}
