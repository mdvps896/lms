import React, { useState, useEffect } from 'react';
import { FiChevronDown, FiChevronUp, FiCamera, FiClock, FiCalendar, FiFileText, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import SelfieViewerModal from '../SelfieViewerModal';

const StudentFreeMaterialsTab = ({ studentId, freeMaterialViews = [] }) => {
    const [activeTab, setActiveTab] = useState('pdfs');
    const [testHistory, setTestHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [selfieModal, setSelfieModal] = useState({ show: false, sessionId: null });

    useEffect(() => {
        fetchTestHistory();
    }, [studentId]);

    const fetchTestHistory = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/users/${studentId}/free-materials-selfies`);
            const result = await response.json();

            if (result.success) {
                if (!Array.isArray(result.data)) {
                    setTestHistory(result.data.testHistory || []);
                }
            } else {
                setError(result.message);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const openSelfieModal = (sessionId) => {
        setSelfieModal({ show: true, sessionId });
    };

    const closeSelfieModal = () => {
        setSelfieModal({ show: false, sessionId: null });
    };

    const formatTime = (seconds) => {
        if (!seconds) return '0 sec';
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
        if (mins > 0) return `${mins}m ${secs}s`;
        return `${secs} sec`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Group PDF sessions by title
    const groupedPdfs = freeMaterialViews.reduce((acc, view) => {
        const name = view.title || 'Untitled Material';
        if (!acc[name]) acc[name] = [];
        acc[name].push(view);
        return acc;
    }, {});

    return (
        <div className="p-3">
            {/* Sub-tabs */}
            <ul className="nav nav-pills mb-4 gap-2">
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'pdfs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pdfs')}
                    >
                        <FiFileText className="me-2" />
                        PDFs ({freeMaterialViews.length})
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'tests' ? 'active' : ''}`}
                        onClick={() => setActiveTab('tests')}
                    >
                        <FiCheckCircle className="me-2" />
                        Tests ({testHistory.length})
                    </button>
                </li>
            </ul>

            {/* Content */}
            {activeTab === 'pdfs' && (
                <div className="accordion" id="freeMaterialsAccordion">
                    {freeMaterialViews.length === 0 ? (
                        <div className="text-center p-5 text-muted border rounded bg-light">
                            <FiCamera size={48} className="mb-3 opacity-25" />
                            <p>No PDF viewing history found.</p>
                        </div>
                    ) : (
                        Object.entries(groupedPdfs).map(([materialTitle, sessions], index) => {
                            const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
                            const lastViewed = sessions.reduce((latest, s) => new Date(s.lastViewed) > new Date(latest) ? s.lastViewed : latest, sessions[0].lastViewed);
                            const isExpanded = expandedId === index;

                            return (
                                <div className="card mb-3 border shadow-sm" key={index}>
                                    <div
                                        className="card-header bg-white p-3 cursor-pointer d-flex justify-content-between align-items-center"
                                        onClick={() => toggleExpand(index)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="avatar avatar-sm bg-light text-primary rounded-circle d-flex align-items-center justify-content-center">
                                                <FiFileText size={18} />
                                            </div>
                                            <div>
                                                <h6 className="mb-0 fw-bold">{materialTitle}</h6>
                                                <div className="text-muted fs-12 mt-1">
                                                    {sessions.length} Sessions • Total: {formatTime(totalDuration)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-3">
                                            <span className="badge bg-light text-muted border fw-normal">
                                                Last: {formatDate(lastViewed)}
                                            </span>
                                            {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="card-body bg-light">
                                            <div className="table-responsive">
                                                <table className="table table-hover table-nowrap mb-0 align-middle bg-white rounded border">
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th className="ps-4">Date</th>
                                                            <th>Duration</th>
                                                            <th>Time (Start - End)</th>
                                                            <th>Location</th>
                                                            <th className="text-end pe-4">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {sessions.map((session) => (
                                                            <tr key={session.id}>
                                                                <td className="ps-4">
                                                                    <span className="fs-13">{formatDate(session.startTime).split(',')[0]}</span>
                                                                </td>
                                                                <td>
                                                                    <span className="badge bg-light text-dark border font-monospace">
                                                                        {formatTime(session.duration)}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <span className="text-muted fs-12 font-monospace">
                                                                        {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        {' - '}
                                                                        {new Date(session.lastViewed).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <span className="text-muted fs-12">
                                                                        {session.locationName || 'Unknown Location'}
                                                                    </span>
                                                                </td>
                                                                <td className="text-end pe-4">
                                                                    <button
                                                                        className="btn btn-sm btn-soft-primary d-inline-flex align-items-center gap-2"
                                                                        onClick={() => openSelfieModal(session.id)}
                                                                    >
                                                                        <FiCamera size={14} />
                                                                        View Selfies {session.selfieCount > 0 ? `(${session.selfieCount})` : ''}
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {activeTab === 'tests' && (
                <div className="accordion" id="freeTestsAccordion">
                    {testHistory.length === 0 ? (
                        <div className="text-center p-5 text-muted border rounded bg-light">
                            <FiCheckCircle size={48} className="mb-3 opacity-25" />
                            <p>No free questions/tests attempted yet.</p>
                        </div>
                    ) : (() => {
                        // Group test attempts by exam name
                        const groupedTests = testHistory.reduce((acc, test) => {
                            const examName = test.exam?.name || 'Unknown Exam';
                            if (!acc[examName]) acc[examName] = [];
                            acc[examName].push(test);
                            return acc;
                        }, {});

                        return Object.entries(groupedTests).map(([examName, attempts], index) => {
                            // Sort attempts by date (most recent first)
                            const sortedAttempts = [...attempts].sort((a, b) =>
                                new Date(b.startedAt) - new Date(a.startedAt)
                            );

                            const mostRecent = sortedAttempts[0];
                            const totalTime = attempts.reduce((sum, a) => sum + (a.timeTaken || 0), 0);
                            const isExpanded = expandedId === `test-${index}`;

                            return (
                                <div className="card mb-3 border shadow-sm" key={index}>
                                    <div
                                        className="card-header bg-white p-3 cursor-pointer d-flex justify-content-between align-items-center"
                                        onClick={() => toggleExpand(`test-${index}`)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="avatar avatar-sm bg-light text-primary rounded-circle d-flex align-items-center justify-content-center">
                                                <FiCheckCircle size={18} />
                                            </div>
                                            <div>
                                                <h6 className="mb-0 fw-bold">{examName}</h6>
                                                <div className="text-muted fs-12 mt-1">
                                                    {attempts.length} Attempts • Total: {formatTime(totalTime)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-3">
                                            <span className="badge bg-light text-dark border fw-normal">
                                                Recent: {mostRecent.score}/{mostRecent.totalMarks}
                                            </span>
                                            {mostRecent.passed ? (
                                                <span className="badge bg-soft-success text-success">
                                                    <FiCheckCircle className="me-1" /> Pass
                                                </span>
                                            ) : (
                                                <span className="badge bg-soft-danger text-danger">
                                                    <FiXCircle className="me-1" /> Fail
                                                </span>
                                            )}
                                            {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="card-body bg-light">
                                            <div className="table-responsive">
                                                <table className="table table-hover table-nowrap mb-0 align-middle bg-white rounded border">
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th className="ps-4">Date</th>
                                                            <th>Score</th>
                                                            <th>Time Taken</th>
                                                            <th>Selfies</th>
                                                            <th>Result</th>
                                                            <th className="text-end pe-4">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {sortedAttempts.map((attempt) => (
                                                            <tr key={attempt._id}>
                                                                <td className="ps-4">
                                                                    <div className="d-flex flex-column">
                                                                        <span className="fs-13">{new Date(attempt.startedAt).toLocaleDateString()}</span>
                                                                        <small className="text-muted">{new Date(attempt.startedAt).toLocaleTimeString()}</small>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <span className="fw-bold text-primary">{attempt.score}</span>
                                                                    <span className="text-muted"> / {attempt.totalMarks}</span>
                                                                </td>
                                                                <td>
                                                                    <span className="badge bg-light text-dark border font-monospace">
                                                                        {formatTime(attempt.timeTaken)}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <span className="badge bg-light text-dark border">
                                                                        <FiCamera className="me-1" size={12} />
                                                                        {attempt.selfieCount || 0}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    {attempt.passed ? (
                                                                        <span className="badge bg-soft-success text-success">
                                                                            <FiCheckCircle className="me-1" /> Pass
                                                                        </span>
                                                                    ) : (
                                                                        <span className="badge bg-soft-danger text-danger">
                                                                            <FiXCircle className="me-1" /> Fail
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="text-end pe-4">
                                                                    <button
                                                                        className="btn btn-sm btn-soft-primary d-inline-flex align-items-center gap-2"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openSelfieModal(attempt._id);
                                                                        }}
                                                                    >
                                                                        <FiCamera size={14} />
                                                                        View Selfies
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        });
                    })()}
                </div>
            )}

            {/* Selfie Viewer Modal */}
            <SelfieViewerModal
                show={selfieModal.show}
                sessionId={selfieModal.sessionId}
                onClose={closeSelfieModal}
            />
        </div>
    );
};

export default StudentFreeMaterialsTab;
