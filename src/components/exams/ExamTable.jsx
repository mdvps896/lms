import React from 'react';
import { FiEdit, FiTrash2, FiEye, FiBarChart } from 'react-icons/fi';
import Link from 'next/link';

const ExamTable = ({ exams, onDelete, onView, onAnalytics, currentTime }) => {
    const isLive = (exam) => {
        if (exam.status !== 'active') return false;
        const start = new Date(exam.startDate);
        const end = new Date(exam.endDate);
        return currentTime >= start && currentTime <= end;
    };

    const getStatus = (exam) => {
        if (exam.status === 'inactive') return { label: 'Inactive', color: 'danger' };
        if (!currentTime) return { label: '...', color: 'secondary' };
        
        const now = currentTime.getTime();
        const start = new Date(exam.startDate).getTime();
        const end = new Date(exam.endDate).getTime();

        if (now < start) return { label: 'Upcoming', color: 'warning text-dark' };
        if (now >= start && now <= end) return { label: 'Live', color: 'success' };
        if (now > end) return { label: 'Completed', color: 'secondary' };
        
        return { label: 'Active', color: 'success' };
    };

    return (
        <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light text-secondary">
                            <tr>
                                <th className="ps-4 py-3">Name</th>
                                <th className="py-3">Type</th>
                                <th className="py-3">Category</th>
                                <th className="py-3">Subjects</th>
                                <th className="py-3">Start Date</th>
                                <th className="py-3">End Date</th>
                                <th className="py-3">Duration</th>
                                <th className="py-3">Status</th>
                                <th className="text-end pe-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {exams.map((exam) => (
                                <tr key={exam._id}>
                                    <td className="ps-4">
                                        <div className="d-flex align-items-center">
                                            {isLive(exam) && <span className="live-indicator" title="Live Now"></span>}
                                            <div>
                                                <div className="fw-bold text-dark">{exam.name}</div>
                                                <small className="text-muted">ID: {exam._id.substring(0, 8)}...</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge rounded-pill bg-${exam.type === 'live' ? 'primary' : 'info'}`}>
                                            {exam.type === 'live' ? 'Live' : 'Regular'}
                                        </span>
                                    </td>
                                    <td>{exam.category?.name || '-'}</td>
                                    <td>
                                        <div className="d-flex flex-wrap gap-1">
                                            {exam.subjects?.map((sub, idx) => (
                                                <span key={idx} className="badge bg-light text-dark border">{sub.name}</span>
                                            )) || '-'}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="d-flex flex-column">
                                            <span>{new Date(exam.startDate).toLocaleDateString()}</span>
                                            <small className="text-muted">{new Date(exam.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="d-flex flex-column">
                                            <span>{new Date(exam.endDate).toLocaleDateString()}</span>
                                            <small className="text-muted">{new Date(exam.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                                        </div>
                                    </td>
                                    <td>{exam.duration} min</td>
                                    <td>
                                        {(() => {
                                            const status = getStatus(exam);
                                            return (
                                                <span className={`badge rounded-pill bg-${status.color}`}>
                                                    {status.label}
                                                </span>
                                            );
                                        })()}
                                    </td>
                                    <td className="text-end pe-4">
                                        <div className="d-flex justify-content-end gap-2">
                                            <button 
                                                className="btn btn-sm btn-light text-primary" 
                                                onClick={() => onView(exam)}
                                                title="View Details"
                                            >
                                                <FiEye size={18} />
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-light text-info" 
                                                onClick={() => onAnalytics(exam)}
                                                title="Analytics"
                                            >
                                                <FiBarChart size={18} />
                                            </button>
                                            <Link 
                                                href={`/exam/edit/${exam._id}`} 
                                                className="btn btn-sm btn-light text-warning"
                                                title="Edit Exam"
                                            >
                                                <FiEdit size={18} />
                                            </Link>
                                            <button 
                                                className="btn btn-sm btn-light text-danger" 
                                                onClick={() => onDelete(exam._id)}
                                                title="Delete Exam"
                                            >
                                                <FiTrash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ExamTable;
