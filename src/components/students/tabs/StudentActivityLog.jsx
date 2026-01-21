import React, { useState } from 'react'
import { FiFileText, FiBookOpen, FiCamera, FiMapPin } from 'react-icons/fi'
import SelfieViewerModal from '../SelfieViewerModal'

const StudentActivityLog = ({ activityType, data, formatDate }) => {
    // activityType: 'pdf' or 'course'
    const isPdf = activityType === 'pdf';
    const title = isPdf ? 'PDF Reading History' : 'Course Viewing History';
    const Icon = isPdf ? FiFileText : FiBookOpen;
    const color = isPdf ? 'danger' : 'success';
    const emptyText = isPdf ? 'No PDF views recorded yet' : 'No Course views recorded yet';

    const [expandedId, setExpandedId] = useState(null);
    const [selfieModal, setSelfieModal] = useState({ show: false, sessionId: null });

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const openSelfieModal = (sessionId) => {
        setSelfieModal({ show: true, sessionId });
    };

    const closeSelfieModal = () => {
        setSelfieModal({ show: false, sessionId: null });
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '0 min';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h} hr ${m > 0 ? `${m} min` : ''}`;
        return `${m || 1} min`;
    };

    const globalTotalDuration = data ? data.reduce((sum, item) => sum + (item.duration || 0), 0) : 0;
    const globalTotalText = formatDuration(globalTotalDuration);

    return (
        <div className="animate__animated animate__fadeIn">
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                    <h6 className="card-title fw-bold mb-0">{title}</h6>
                    <div>
                        <span className={`badge bg-light text-${color} me-2`}>
                            {data?.length || 0} Total Sessions
                        </span>
                        <span className={`badge bg-soft-${color} text-${color}`}>
                            Total: {globalTotalText}
                        </span>
                    </div>
                </div>
                <div className="card-body p-0">
                    {data && data.length > 0 ? (
                        <div className="accordion accordion-flush">
                            {Object.entries(
                                data.reduce((acc, view) => {
                                    const name = view.title || (isPdf ? 'Unknown PDF' : 'Unknown Course');
                                    if (!acc[name]) acc[name] = [];
                                    acc[name].push(view);
                                    return acc;
                                }, {})
                            ).map(([itemName, views], index) => {
                                const totalDuration = views.reduce((sum, v) => sum + (v.duration || 0), 0);
                                const lastAccessed = views.reduce((latest, v) => new Date(v.lastViewed) > new Date(latest) ? v.lastViewed : latest, views[0].lastViewed);
                                const isExpanded = expandedId === index;

                                return (
                                    <div className="accordion-item" key={index}>
                                        <h2 className="accordion-header">
                                            <button
                                                className={`accordion-button ${!isExpanded ? 'collapsed' : ''}`}
                                                type="button"
                                                onClick={() => toggleExpand(index)}
                                                style={{ boxShadow: 'none' }}
                                            >
                                                <div className="d-flex align-items-center w-100 justify-content-between me-3">
                                                    <div className="d-flex align-items-center">
                                                        <div className={`avatar avatar-sm bg-soft-${color} text-${color} me-3 rounded`}>
                                                            <Icon size={16} />
                                                        </div>
                                                        <div>
                                                            <span className="fw-semibold text-dark">{itemName}</span>
                                                            <div className="text-muted fs-11 mt-1">
                                                                {views.length} Sessions • Total: {formatDuration(totalDuration)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="badge bg-light text-muted border fw-normal">
                                                        Last: {formatDate(lastAccessed)}
                                                    </span>
                                                </div>
                                            </button>
                                        </h2>
                                        <div className={`accordion-collapse collapse ${isExpanded ? 'show' : ''}`}>
                                            <div className="accordion-body p-0">
                                                <div className="table-responsive">
                                                    <table className="table table-hover table-nowrap mb-0 align-middle bg-light bg-opacity-10">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th className="ps-5 text-muted small text-uppercase">Date</th>
                                                                <th className="text-muted small text-uppercase">Duration</th>
                                                                <th className="text-muted small text-uppercase">Time</th>
                                                                <th className="text-muted small text-uppercase">Location</th>
                                                                {isPdf && <th className="text-end pe-5 text-muted small text-uppercase">Actions</th>}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {views.map((view) => (
                                                                <tr key={view.id}>
                                                                    <td className="ps-5">
                                                                        <span className="fs-13">{formatDate(view.startTime)}</span>
                                                                    </td>
                                                                    <td>
                                                                        <span className="badge bg-white text-dark border shadow-sm">
                                                                            {view.duration ? `${Math.round(view.duration / 60)} mins` : '< 1 min'}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <span className="text-muted fs-12 font-monospace">
                                                                            {new Date(view.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                            {' - '}
                                                                            {new Date(view.lastViewed).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        {view.latitude && view.longitude ? (
                                                                            <a
                                                                                href={`https://www.google.com/maps?q=${view.latitude},${view.longitude}`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="btn btn-sm btn-soft-success d-inline-flex align-items-center gap-1"
                                                                            >
                                                                                <FiMapPin size={12} />
                                                                                <span className="fs-11">View Map</span>
                                                                            </a>
                                                                        ) : (
                                                                            <span className="text-muted fs-11">Not Available</span>
                                                                        )}
                                                                    </td>
                                                                    {isPdf && (
                                                                        <td className="text-end pe-5">
                                                                            <button
                                                                                className="btn btn-sm btn-soft-primary d-inline-flex align-items-center gap-2"
                                                                                onClick={() => openSelfieModal(view.id)}
                                                                            >
                                                                                <FiCamera size={14} />
                                                                                View Selfies
                                                                            </button>
                                                                        </td>
                                                                    )}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-5 text-muted">
                            <Icon size={32} className="mb-3 opacity-25" />
                            <p className="mb-0 fs-14">{emptyText}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Selfie Viewer Modal */}
            <SelfieViewerModal
                show={selfieModal.show}
                sessionId={selfieModal.sessionId}
                onClose={closeSelfieModal}
            />
        </div>
    )
}

export default StudentActivityLog
