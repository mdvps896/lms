
'use client'

import React from 'react'
import { FiEdit, FiTrash2, FiClock, FiVideo, FiCalendar, FiExternalLink } from 'react-icons/fi'

const MeetingList = ({ meetings, loading, onEdit, onDelete }) => {
    if (loading) {
        return (
            <div className="p-5 text-center">
                <div className="spinner-border text-primary" role="status"></div>
                <div className="mt-2 text-muted">Loading meetings...</div>
            </div>
        )
    }

    if (!meetings || meetings.length === 0) {
        return (
            <div className="p-5 text-center">
                <div className="fs-1 text-muted mb-3"><FiCalendar /></div>
                <h5>No meetings found</h5>
                <p className="text-muted">Create a new meeting to get started.</p>
            </div>
        )
    }

    return (
        <div className="table-responsive">
            <table className="table table-hover mb-0">
                <thead className="bg-light">
                    <tr>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Subjects</th>
                        <th>Schedule</th>
                        <th>Links</th>
                        <th>Status</th>
                        <th className="text-end">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {meetings.map((meeting) => {
                        const isLive = new Date() >= new Date(meeting.startTime) && new Date() <= new Date(meeting.endTime);
                        const isExpired = new Date() > new Date(meeting.endTime);

                        return (
                            <tr key={meeting._id}>
                                <td>
                                    <div className="fw-bold">{meeting.title}</div>
                                </td>
                                <td>
                                    <span className="badge bg-light text-dark border">
                                        {meeting.category?.name || 'Uncategorized'}
                                    </span>
                                </td>
                                <td>
                                    <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '200px' }}>
                                        {meeting.subjects && meeting.subjects.length > 0 ? (
                                            meeting.subjects.slice(0, 2).map((sub, i) => (
                                                <span key={i} className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '10px' }}>
                                                    {sub.name}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-muted small">All Subjects</span>
                                        )}
                                        {meeting.subjects && meeting.subjects.length > 2 && (
                                            <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '10px' }}>
                                                +{meeting.subjects.length - 2}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <div className="small">
                                        <div className="d-flex align-items-center mb-1">
                                            <FiCalendar className="me-2 text-muted" size={12} />
                                            {new Date(meeting.startTime).toLocaleDateString()}
                                        </div>
                                        <div className="d-flex align-items-center text-muted">
                                            <FiClock className="me-2" size={12} />
                                            {new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                            {new Date(meeting.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="d-flex flex-column gap-1">
                                        {meeting.links && meeting.links.map((link, i) => (
                                            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                                                className="btn btn-sm btn-light border d-flex align-items-center justify-content-between p-1 px-2 text-truncate"
                                                style={{ maxWidth: '150px' }} title={link.url}>
                                                <span className="text-truncate me-2 small">{link.title || 'Link ' + (i + 1)}</span>
                                                <FiExternalLink size={12} />
                                            </a>
                                        ))}
                                    </div>
                                </td>
                                <td>
                                    {isLive ? (
                                        <span className="badge bg-success-subtle text-success">Live Now</span>
                                    ) : isExpired ? (
                                        <span className="badge bg-danger-subtle text-danger">Expired</span>
                                    ) : (
                                        <span className="badge bg-primary-subtle text-primary">Upcoming</span>
                                    )}
                                </td>
                                <td className="text-end">
                                    <button className="btn btn-sm btn-icon btn-light me-1" onClick={() => onEdit(meeting)}>
                                        <FiEdit />
                                    </button>
                                    <button className="btn btn-sm btn-icon btn-light text-danger" onClick={() => onDelete(meeting._id)}>
                                        <FiTrash2 />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    )
}

export default MeetingList
