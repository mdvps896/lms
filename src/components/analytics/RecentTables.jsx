
import React, { useState, useMemo } from 'react';
import { FaChevronDown, FaChevronUp, FaUserCircle, FaFilePdf, FaBook, FaPenAlt, FaInbox } from 'react-icons/fa';

const RecentTables = ({ attempts, materials, pdfViews, payments }) => {
    const [activeTab, setActiveTab] = useState('activity');
    const [expandedUsers, setExpandedUsers] = useState({});
    // Track active sub-tab for each user: { userId: 'exam' | 'pdf' | 'course' }
    const [userTabs, setUserTabs] = useState({});

    // Group attempts by user
    const groupedData = useMemo(() => {
        const groups = {};

        // Helper to add user if not exists
        const ensureUser = (user, date) => {
            if (!user) return null;
            const userId = user._id;
            if (!groups[userId]) {
                groups[userId] = {
                    user: user,
                    activities: [],
                    exams: [],
                    pdfs: [],
                    courses: [],
                    latestActivity: new Date(date)
                };
            }
            const currentDate = new Date(date);
            if (currentDate > groups[userId].latestActivity) {
                groups[userId].latestActivity = currentDate;
            }
            return groups[userId];
        };

        // Process Exam Attempts
        if (attempts && attempts.length > 0) {
            attempts.forEach(attempt => {
                const group = ensureUser(attempt.user, attempt.startedAt);
                if (!group) return;

                const item = {
                    type: 'exam',
                    title: attempt.exam ? (attempt.exam.name || attempt.exam.title) : 'Deleted Exam',
                    date: attempt.startedAt,
                    status: attempt.status,
                    score: attempt.score,
                    id: attempt._id
                };
                group.exams.push(item);
                group.activities.push(item);
            });
        }

        // Process PDF Views
        if (pdfViews && pdfViews.length > 0) {
            pdfViews.forEach(view => {
                const group = ensureUser(view.user, view.createdAt);
                if (!group) return;

                const item = {
                    type: 'pdf',
                    title: view.pdfName || view.lectureName || 'Untitled PDF',
                    date: view.createdAt,
                    status: 'viewed',
                    score: view.duration ? `${Math.floor(view.duration / 60)}m ${view.duration % 60}s` : '0s',
                    id: view._id
                };
                group.pdfs.push(item);
                group.activities.push(item);
            });
        }

        // Process Course Payments
        if (payments && payments.length > 0) {
            payments.forEach(payment => {
                const group = ensureUser(payment.user, payment.createdAt);
                if (!group) return;

                const item = {
                    type: 'course',
                    title: payment.course?.title || 'Unknown Course',
                    date: payment.createdAt,
                    status: 'purchased',
                    score: `₹${payment.amount}`,
                    id: payment._id
                };
                group.courses.push(item);
                group.activities.push(item);
            });
        }

        // Convert to array and sort by latest activity
        return Object.values(groups).sort((a, b) => b.latestActivity - a.latestActivity);
    }, [attempts, pdfViews, payments]);

    const toggleUser = (userId) => {
        setExpandedUsers(prev => ({
            ...prev,
            [userId]: !prev[userId]
        }));
        // Set default tab if not set
        if (!userTabs[userId]) {
            setUserTabs(prev => ({ ...prev, [userId]: 'exam' }));
        }
    };

    const setUserTab = (userId, tab) => {
        setUserTabs(prev => ({ ...prev, [userId]: tab }));
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'exam': return <FaPenAlt className="text-primary" />;
            case 'pdf': return <FaFilePdf className="text-danger" />;
            case 'course': return <FaBook className="text-success" />;
            default: return <FaPenAlt className="text-muted" />;
        }
    };

    return (
        <div className="card h-100 mb-4 border shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3 border-bottom">
                <h5 className="mb-0 fw-bold text-dark">Recent Activity</h5>
                <ul className="nav nav-pills card-header-pills">
                    <li className="nav-item">
                        <button
                            className={`nav-link btn-sm ${activeTab === 'activity' ? 'active' : ''}`}
                            onClick={() => setActiveTab('activity')}
                        >
                            User Activity
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link btn-sm ${activeTab === 'materials' ? 'active' : ''}`}
                            onClick={() => setActiveTab('materials')}
                        >
                            New Materials
                        </button>
                    </li>
                </ul>
            </div>
            <div className="card-body p-0">
                {activeTab === 'activity' ? (
                    <div className="accordion accordion-flush" id="recentActivityAccordion">
                        {groupedData.length > 0 ? (
                            groupedData.map((group) => {
                                const currentTab = userTabs[group.user._id] || 'exam';
                                const activeData = currentTab === 'exam' ? group.exams :
                                    currentTab === 'pdf' ? group.pdfs : group.courses;

                                return (
                                    <div className="accordion-item" key={group.user._id}>
                                        <h2 className="accordion-header">
                                            <button
                                                className={`accordion-button ${!expandedUsers[group.user._id] ? 'collapsed' : ''} bg-white`}
                                                type="button"
                                                onClick={() => toggleUser(group.user._id)}
                                                style={{ boxShadow: 'none' }}
                                            >
                                                <div className="d-flex align-items-center w-100">
                                                    <div className="avatar avatar-sm bg-primary-subtle text-primary rounded-circle me-3 d-flex align-items-center justify-content-center fw-bold" style={{ width: 40, height: 40 }}>
                                                        {group.user.name?.charAt(0).toUpperCase() || <FaUserCircle />}
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <h6 className="mb-0 fw-semibold text-dark">{group.user.name || 'Unknown User'}</h6>
                                                        <small className="text-muted">{group.user.email} • {group.exams.length} Exams</small>
                                                    </div>
                                                    <div className="me-3 text-end text-muted small d-none d-sm-block">
                                                        {new Date(group.latestActivity).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </button>
                                        </h2>
                                        <div className={`accordion-collapse collapse ${expandedUsers[group.user._id] ? 'show' : ''}`}>
                                            <div className="accordion-body p-0 bg-light-subtle">
                                                {/* Inner Tabs */}
                                                <div className="px-4 pt-3 pb-2 border-bottom">
                                                    <div className="btn-group btn-group-sm" role="group">
                                                        <button
                                                            type="button"
                                                            className={`btn ${currentTab === 'exam' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                            onClick={() => setUserTab(group.user._id, 'exam')}
                                                        >
                                                            <FaPenAlt className="me-1" /> Exams ({group.exams.length})
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={`btn ${currentTab === 'pdf' ? 'btn-danger text-white' : 'btn-outline-secondary'}`}
                                                            onClick={() => setUserTab(group.user._id, 'pdf')}
                                                            style={currentTab === 'pdf' ? { backgroundColor: '#dc3545', borderColor: '#dc3545' } : {}}
                                                        >
                                                            <FaFilePdf className="me-1" /> PDFs ({group.pdfs.length})
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={`btn ${currentTab === 'course' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                                                            onClick={() => setUserTab(group.user._id, 'course')}
                                                            style={currentTab === 'course' ? { backgroundColor: '#198754', borderColor: '#198754' } : {}}
                                                        >
                                                            <FaBook className="me-1" /> Courses ({group.courses.length})
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Tab Content */}
                                                <div className="table-responsive">
                                                    {activeData.length > 0 ? (
                                                        <table className="table table-sm table-hover mb-0">
                                                            <thead className="text-muted small text-uppercase">
                                                                <tr>
                                                                    <th className="ps-4">Type</th>
                                                                    <th>Title</th>
                                                                    <th>Date</th>
                                                                    <th>Status</th>
                                                                    <th className="text-end pe-4">Score/Info</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="border-top-0">
                                                                {activeData.map((activity, idx) => (
                                                                    <tr key={idx}>
                                                                        <td className="ps-4 text-center" style={{ width: '50px' }}>
                                                                            {getTypeIcon(activity.type)}
                                                                        </td>
                                                                        <td className="fw-medium text-dark">
                                                                            {activity.title}
                                                                        </td>
                                                                        <td className="small text-muted">{new Date(activity.date).toLocaleString()}</td>
                                                                        <td>
                                                                            <span className={`badge bg-${activity.status === 'submitted' || activity.status === 'success' || activity.status === 'viewed' ? 'success' :
                                                                                activity.status === 'active' ? 'primary' :
                                                                                    activity.status === 'purchased' ? 'info' : 'warning'
                                                                                }-subtle text-${activity.status === 'submitted' || activity.status === 'success' || activity.status === 'viewed' ? 'success' :
                                                                                    activity.status === 'active' ? 'primary' :
                                                                                        activity.status === 'purchased' ? 'info' : 'warning'
                                                                                } border border-${activity.status === 'submitted' || activity.status === 'success' || activity.status === 'viewed' ? 'success' :
                                                                                    activity.status === 'active' ? 'primary' :
                                                                                        activity.status === 'purchased' ? 'info' : 'warning'
                                                                                }-subtle`}>
                                                                                {activity.status}
                                                                            </span>
                                                                        </td>
                                                                        <td className="text-end pe-4 fw-bold">
                                                                            {activity.score !== undefined ? activity.score : '-'}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    ) : (
                                                        <div className="text-center py-4 text-muted">
                                                            <FaInbox className="mb-2" size={24} style={{ opacity: 0.5 }} />
                                                            <p className="mb-0 small">No {currentTab} activity found.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-5">
                                <p className="text-muted mb-0">No recent activity found.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    // Materials Tab (Global)
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light text-muted small text-uppercase">
                                <tr>
                                    <th className="px-4">Title</th>
                                    <th>Category</th>
                                    <th>Date</th>
                                    <th className="text-end px-4">Files</th>
                                </tr>
                            </thead>
                            <tbody>
                                {materials.length > 0 ? (
                                    materials.map((material, index) => (
                                        <tr key={index}>
                                            <td className="px-4 fw-semibold text-dark">{material.title}</td>
                                            <td className="text-muted">{material.category?.name || 'N/A'}</td>
                                            <td className="text-muted small">{new Date(material.createdAt).toLocaleDateString()}</td>
                                            <td className="text-end px-4"><span className="badge bg-secondary-subtle text-secondary border">{material.files?.length || 0} files</span></td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="4" className="text-center py-4 text-muted">No recent materials found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecentTables;
