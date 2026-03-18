import React from 'react'
import { FiBookOpen } from 'react-icons/fi'

const StudentExamsTab = ({ details, formatDate }) => {
    return (
        <div className="animate__animated animate__fadeIn">
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                    <h6 className="card-title fw-bold mb-0">Exam Attempts History</h6>
                    <div className="d-flex gap-2">
                        <span className="badge bg-light text-primary">{details.attempts?.length || 0} Records</span>
                        {details.attempts && details.attempts.length > 0 && (
                            <span className="badge bg-soft-danger text-danger">
                                Total Time: {(() => {
                                    const totalSec = details.attempts
                                        .filter(a => !a.isFreeMaterial)
                                        .reduce((acc, curr) => acc + (curr.timeTaken || 0), 0);
                                    const h = Math.floor(totalSec / 3600);
                                    const m = Math.floor((totalSec % 3600) / 60);
                                    return h > 0 ? `${h}h ${m}m` : `${m}m`;
                                })()}
                            </span>
                        )}
                    </div>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover table-nowrap mb-0 align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th className="ps-4">Exam Name</th>
                                    <th>Started At</th>
                                    <th>Ended At</th>
                                    <th>Time Taken</th>
                                    <th>Score</th>
                                    <th>Status</th>
                                    <th>Result</th>
                                </tr>
                            </thead>
                            <tbody>
                                {details.attempts && details.attempts.filter(a => !a.isFreeMaterial).length > 0 ? (
                                    details.attempts.filter(a => !a.isFreeMaterial).map((attempt) => (
                                        <tr key={attempt.id}>
                                            <td className="ps-4 fw-medium text-dark">
                                                {attempt.examTitle}
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column">
                                                    <span className="fs-12 fw-medium">{formatDate(attempt.startedAt)}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column">
                                                    <span className="fs-12 fw-medium">{formatDate(attempt.submittedAt)}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="fs-12 fw-medium">
                                                    {(() => {
                                                        const sec = attempt.timeTaken || 0;
                                                        const h = Math.floor(sec / 3600);
                                                        const m = Math.floor((sec % 3600) / 60);
                                                        const s = sec % 60;
                                                        return h > 0 
                                                            ? `${h}h ${m}m ${s}s` 
                                                            : m > 0 
                                                                ? `${m}m ${s}s` 
                                                                : `${s}s`;
                                                    })()}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="fw-bold text-dark">{attempt.score || 0}</span>
                                                <span className="text-muted fs-11"> / {attempt.totalMarks}</span>
                                            </td>
                                            <td>
                                                <span className={`badge bg-soft-${attempt.status === 'submitted' ? 'success' : 'warning'
                                                    } text-${attempt.status === 'submitted' ? 'success' : 'warning'
                                                    }`}>
                                                    {attempt.status}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge rounded-pill ${attempt.result === 'Pass' ? 'bg-success' : 'bg-danger'
                                                    }`}>
                                                    {attempt.result}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center py-5 text-muted">
                                            <FiBookOpen size={24} className="mb-2 opacity-50" />
                                            <p className="mb-0">No exam attempts found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StudentExamsTab
