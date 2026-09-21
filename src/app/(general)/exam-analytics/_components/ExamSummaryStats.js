'use client'

// Top summary cards: total exams, completed exams, participants, overall average.
export default function ExamSummaryStats({ exams }) {
    return (
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
    );
}
