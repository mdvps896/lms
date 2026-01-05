import React from 'react'
import { FiUser, FiBookOpen, FiCheckCircle, FiTrendingUp, FiCalendar, FiClock } from 'react-icons/fi'

const StudentOverviewTab = ({ details, formatDate }) => {

    const StatCard = ({ label, value, icon: Icon, color }) => (
        <div className="col-md-4 mb-4">
            <div className="card h-100 border-0 shadow-sm">
                <div className="card-body p-4">
                    <div className="d-flex align-items-center mb-3">
                        <div className={`avatar avatar-lg bg-soft-${color} text-${color} me-3 d-flex align-items-center justify-content-center`}>
                            <Icon size={24} />
                        </div>
                        <div>
                            <span className="text-muted d-block text-uppercase fs-11 fw-bold tracking-wider">{label}</span>
                            <h3 className="mb-0 fw-bold">{value}</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <div className="animate__animated animate__fadeIn">
            <div className="row g-4">
                {/* Stats Row */}
                <div className="col-12">
                    <div className="row g-3">
                        <StatCard
                            label="Total Exams"
                            value={details.examStats?.total || 0}
                            icon={FiBookOpen}
                            color="primary"
                        />
                        <StatCard
                            label="Passed Exams"
                            value={details.examStats?.passed || 0}
                            icon={FiCheckCircle}
                            color="success"
                        />
                        <StatCard
                            label="Completion Rate"
                            value={`${details.examStats?.total ? Math.round((details.examStats.passed / details.examStats.total) * 100) : 0}%`}
                            icon={FiTrendingUp}
                            color="info"
                        />
                    </div>
                </div>

                {/* Profile Details */}
                <div className="col-md-8">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-0 py-3">
                            <h6 className="card-title fw-bold mb-0">Personal Information</h6>
                        </div>
                        <div className="card-body">
                            <div className="row g-4">
                                <div className="col-md-6">
                                    <small className="text-muted text-uppercase fs-11">Full Name</small>
                                    <p className="fw-semibold mb-0">{details.user.name}</p>
                                </div>
                                <div className="col-md-6">
                                    <small className="text-muted text-uppercase fs-11">Phone Number</small>
                                    <p className="fw-semibold mb-0">{details.user.phone || 'N/A'}</p>
                                </div>
                                <div className="col-md-6">
                                    <small className="text-muted text-uppercase fs-11">Email Address</small>
                                    <p className="fw-semibold mb-0 d-flex align-items-center gap-2">
                                        {details.user.email}
                                        {details.user.emailVerified && <FiCheckCircle className="text-success" />}
                                    </p>
                                </div>
                                <div className="col-md-6">
                                    <small className="text-muted text-uppercase fs-11">Category</small>
                                    <p className="fw-semibold mb-0">{details.user.category?.name || 'N/A'}</p>
                                </div>
                                <div className="col-md-6">
                                    <small className="text-muted text-uppercase fs-11">Date of Birth</small>
                                    <p className="fw-semibold mb-0">{details.user.dob ? formatDate(details.user.dob) : 'N/A'}</p>
                                </div>
                                <div className="col-md-6">
                                    <small className="text-muted text-uppercase fs-11">Gender</small>
                                    <p className="fw-semibold text-capitalize mb-0">{details.user.gender || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Info */}
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-0 py-3">
                            <h6 className="card-title fw-bold mb-0">Account Activity</h6>
                        </div>
                        <div className="card-body">
                            <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
                                <li className="d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center gap-2 text-muted">
                                        <FiCalendar /> <span className="fs-13">Joined</span>
                                    </div>
                                    <span className="fw-semibold fs-13">{formatDate(details.user.createdAt)}</span>
                                </li>
                                <li className="d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center gap-2 text-muted">
                                        <FiClock /> <span className="fs-13">Last Activity</span>
                                    </div>
                                    <span className="fw-semibold fs-13">{formatDate(details.user.lastActivity || details.user.updatedAt)}</span>
                                </li>
                                <li className="d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center gap-2 text-muted">
                                        <div className="me-1">🆔</div> <span className="fs-13">Roll No</span>
                                    </div>
                                    <span className="fw-semibold fs-13">{details.user.rollNumber || 'N/A'}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StudentOverviewTab
