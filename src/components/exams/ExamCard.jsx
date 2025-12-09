import React from 'react';
import { FiCalendar, FiClock, FiCheckCircle, FiXCircle, FiMoreVertical, FiEdit, FiTrash2, FiEye, FiBarChart } from 'react-icons/fi';
import Link from 'next/link';

const ExamCard = ({ exam, onDelete, onView, onAnalytics, currentTime }) => {
    // const statusColor = exam.status === 'active' ? 'success' : 'danger';
    // const statusIcon = exam.status === 'active' ? <FiCheckCircle /> : <FiXCircle />;

    const isLive = (exam) => {
        if (exam.status !== 'active') return false;
        if (!currentTime || !exam.startDate || !exam.endDate) return false;
        const start = new Date(exam.startDate).getTime();
        const end = new Date(exam.endDate).getTime();
        const current = currentTime.getTime();
        return current >= start && current <= end;
    };

    const liveStatus = isLive(exam);

    const getStatus = (exam) => {
        if (exam.status === 'inactive') return { label: 'Inactive', color: 'danger', icon: <FiXCircle /> };
        if (!currentTime) return { label: '...', color: 'secondary', icon: <FiClock /> };
        
        const now = currentTime.getTime();
        const start = new Date(exam.startDate).getTime();
        const end = new Date(exam.endDate).getTime();

        if (now < start) return { label: 'Upcoming', color: 'warning text-dark', icon: <FiClock /> };
        if (now >= start && now <= end) return { label: 'Live', color: 'success', icon: <FiCheckCircle /> };
        if (now > end) return { label: 'Completed', color: 'secondary', icon: <FiCheckCircle /> };
        
        return { label: 'Active', color: 'success', icon: <FiCheckCircle /> };
    };

    const status = getStatus(exam);

    return (
        <div className="col-md-6 col-lg-4 mb-4">
            <div className="card h-100 shadow-sm">
                <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
                    <h5 className="card-title mb-0 text-truncate d-flex align-items-center" title={exam.name}>
                        {liveStatus && (
                            <span className="live-indicator me-2" title="Live Now"></span>
                        )}
                        {exam.name}
                    </h5>
                    <div className="dropdown">
                        <button className="btn btn-link text-muted p-0" type="button" data-bs-toggle="dropdown">
                            <FiMoreVertical />
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end">
                            <li><button className="dropdown-item" onClick={() => onView(exam)}><FiEye className="me-2" /> View</button></li>
                            <li><button className="dropdown-item" onClick={() => onAnalytics(exam)}><FiBarChart className="me-2" /> Analytics</button></li>
                            <li><Link className="dropdown-item" href={`/exam/edit/${exam._id}`}><FiEdit className="me-2" /> Edit</Link></li>
                            <li><button className="dropdown-item text-danger" onClick={() => onDelete(exam._id)}><FiTrash2 className="me-2" /> Delete</button></li>
                        </ul>
                    </div>
                </div>
                <div className="card-body">
                    <div className="mb-2">
                        <span className={`badge bg-${status.color} me-2`}>{status.icon} {status.label}</span>
                        <span className="badge bg-info text-dark">{exam.type === 'live' ? 'Live Exam' : 'Regular Exam'}</span>
                    </div>
                    <p className="text-muted small mb-3">{exam.category?.name || 'Uncategorized'}</p>
                    
                    <div className="d-flex justify-content-between mb-2">
                        <small className="text-muted"><FiCalendar className="me-1" /> Start:</small>
                        <small>{new Date(exam.startDate).toLocaleString()}</small>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                        <small className="text-muted"><FiCalendar className="me-1" /> End:</small>
                        <small>{new Date(exam.endDate).toLocaleString()}</small>
                    </div>
                    <div className="d-flex justify-content-between mb-3">
                        <small className="text-muted"><FiClock className="me-1" /> Duration:</small>
                        <small>{exam.duration} mins</small>
                    </div>

                    <div className="border-top pt-2 mt-2">
                        <div className="row text-center">
                            <div className="col-6 border-end">
                                <h6 className="mb-0">{exam.totalMarks}</h6>
                                <small className="text-muted">Marks</small>
                            </div>
                            <div className="col-6">
                                <h6 className="mb-0">{exam.questionGroups?.length || 0}</h6>
                                <small className="text-muted">Groups</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamCard;
