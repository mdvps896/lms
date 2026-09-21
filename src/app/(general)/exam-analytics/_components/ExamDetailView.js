'use client'

// Full-page detail view for a single exam's analytics. Extracted verbatim
// from page.js as part of a pure extraction refactor.
export default function ExamDetailView({ examDetailData, onBackToList }) {
    return (
        <div className="container-fluid">
            {/* Header with back button */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <button
                                className="btn btn-outline-primary me-3"
                                onClick={onBackToList}
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
