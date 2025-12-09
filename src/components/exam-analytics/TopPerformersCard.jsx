'use client'

export default function TopPerformersCard({ performers, onUserClick }) {
    const getPerformanceColor = (percentage) => {
        if (percentage >= 90) return 'success';
        if (percentage >= 80) return 'primary';
        if (percentage >= 70) return 'warning';
        return 'danger';
    };

    return (
        <div className="card h-100">
            <div className="card-header d-flex align-items-center">
                <i className="fas fa-trophy text-warning me-2"></i>
                <h5 className="mb-0">Top Performers</h5>
            </div>
            <div className="card-body">
                {performers.length > 0 ? (
                    <div className="list-group list-group-flush">
                        {performers.map((performer, index) => (
                            <div
                                key={performer.id}
                                className="list-group-item border-0 px-0 py-3 d-flex align-items-center"
                                style={{ cursor: 'pointer' }}
                                onClick={() => onUserClick(performer)}
                            >
                                <div className="flex-shrink-0 me-3">
                                    <div 
                                        className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                                        style={{ width: '40px', height: '40px' }}
                                    >
                                        <strong>#{index + 1}</strong>
                                    </div>
                                </div>
                                <div className="flex-grow-1">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <h6 className="mb-0">{performer.name}</h6>
                                        <span className={`badge bg-${getPerformanceColor(performer.percentage)} fs-6`}>
                                            {performer.percentage}%
                                        </span>
                                    </div>
                                    <small className="text-muted">{performer.email}</small>
                                    <div className="mt-2">
                                        <div className="row g-2">
                                            <div className="col-4">
                                                <div className="text-center">
                                                    <small className="text-muted d-block">Score</small>
                                                    <strong className="text-success">{performer.score}</strong>
                                                </div>
                                            </div>
                                            <div className="col-4">
                                                <div className="text-center">
                                                    <small className="text-muted d-block">Time</small>
                                                    <strong className="text-info">{performer.timeSpent}m</strong>
                                                </div>
                                            </div>
                                            <div className="col-4">
                                                <div className="text-center">
                                                    <small className="text-muted d-block">Accuracy</small>
                                                    <strong className="text-warning">
                                                        {((performer.correctAnswers / (performer.correctAnswers + performer.wrongAnswers)) * 100).toFixed(0)}%
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 ms-2">
                                    <button className="btn btn-sm btn-outline-primary">
                                        <i className="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <i className="fas fa-trophy fa-3x text-muted mb-3"></i>
                        <h6>No performance data</h6>
                        <p className="text-muted">No student attempts found for this exam</p>
                    </div>
                )}
            </div>
        </div>
    );
}