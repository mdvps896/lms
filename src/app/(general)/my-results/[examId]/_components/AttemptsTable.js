import React from 'react';
import Link from 'next/link';
import { FiClock, FiCalendar, FiEye, FiDownload, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { formatDate, formatDuration } from './formatters';

const AttemptsTable = ({
    exam,
    examId,
    attempts,
    filteredAttempts,
    downloadingCertificate,
    onDownloadCertificate
}) => {
    return (
        <div className="row">
            <div className="col-12">
                <div className="card border-0 shadow-sm">
                    <div className="card-header bg-white">
                        <h6 className="mb-0">All Attempts</h6>
                    </div>
                    <div className="card-body p-0">
                        {filteredAttempts.length === 0 ? (
                            <div className="text-center py-5">
                                <p className="text-muted">
                                    {attempts.length === 0
                                        ? 'No attempts found for this exam.'
                                        : 'No attempts match your filters.'}
                                </p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead className="bg-light">
                                        <tr>
                                            <th>EXAM</th>
                                            <th>DATE</th>
                                            <th>SCORE</th>
                                            <th>STATUS</th>
                                            <th>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAttempts.map((attempt, index) => (
                                            <tr key={attempt._id}>
                                                <td>
                                                    <div className="fw-bold">{exam?.title}</div>
                                                    <div className="text-muted small">
                                                        Duration: {attempt.timeTaken ? formatDuration(attempt.timeTaken) : 'N/A'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <FiCalendar className="me-2 text-muted" size={14} />
                                                        <span>{formatDate(attempt.submittedAt || attempt.createdAt)}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="progress" style={{ width: '100px', height: '8px' }}>
                                                            <div
                                                                className={`progress-bar ${
                                                                    attempt.resultStatus === 'draft'
                                                                        ? 'bg-warning'
                                                                        : attempt.score >= 50 ? 'bg-success' : 'bg-danger'
                                                                }`}
                                                                style={{
                                                                    width: attempt.resultStatus === 'draft' ? '100%' : `${attempt.score}%`
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <span className="ms-2 fw-bold">
                                                            {attempt.resultStatus === 'draft' ? 'Checking' : `${attempt.score?.toFixed(2)}%`}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    {attempt.resultStatus === 'draft' ? (
                                                        <span className="badge bg-warning text-dark">
                                                            <FiClock className="me-1" size={12} />
                                                            Under Checking
                                                        </span>
                                                    ) : attempt.passed ? (
                                                        <span className="badge bg-success">
                                                            <FiCheckCircle className="me-1" size={12} />
                                                            Passed
                                                        </span>
                                                    ) : (
                                                        <span className="badge bg-danger">
                                                            <FiXCircle className="me-1" size={12} />
                                                            Failed
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-2">
                                                        <Link
                                                            href={`/my-results/${examId}/${attempt._id}`}
                                                            className="btn btn-sm btn-primary"
                                                            title="View Details"
                                                        >
                                                            <FiEye size={14} />
                                                        </Link>
                                                        <button
                                                            className="btn btn-sm btn-success"
                                                            title="Download Certificate"
                                                            onClick={() => onDownloadCertificate(attempt)}
                                                            disabled={downloadingCertificate === attempt._id}
                                                        >
                                                            {downloadingCertificate === attempt._id ? (
                                                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                            ) : (
                                                                <FiDownload size={14} />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttemptsTable;
