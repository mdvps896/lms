import React from 'react'
import {
    FiUser, FiBookOpen, FiCheckCircle, FiTrendingUp, FiCalendar,
    FiClock, FiMapPin, FiMail, FiPhone, FiInfo, FiHash, FiShield,
    FiSmartphone, FiGlobe
} from 'react-icons/fi'
import { FaAndroid } from 'react-icons/fa'
import { FcGoogle } from 'react-icons/fc'

const StudentOverviewTab = ({ details, formatDate }) => {

    const DetailItem = ({ label, value, icon: Icon, color = "primary" }) => (
        <div className="col-md-6 col-lg-4 mb-4">
            <div className="p-3 border rounded bg-white shadow-sm h-100 d-flex align-items-start gap-3">
                <div className={`p-2 rounded bg-soft-${color} text-${color}`}>
                    <Icon size={18} />
                </div>
                <div>
                    <label className="text-muted small fw-bold text-uppercase mb-1 d-block" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>
                        {label}
                    </label>
                    <div className="fw-semibold text-dark">
                        {value || <span className="text-muted fw-normal">N/A</span>}
                    </div>
                </div>
            </div>
        </div>
    )

    const StatCard = ({ label, value, icon: Icon, color }) => (
        <div className="col-md-4">
            <div className="card h-100 border-0 shadow-sm" style={{ borderLeft: `4px solid var(--bs-${color})` }}>
                <div className="card-body p-3">
                    <div className="d-flex align-items-center">
                        <div className={`avatar avatar-md bg-soft-${color} text-${color} me-3 d-flex align-items-center justify-content-center rounded`}>
                            <Icon size={20} />
                        </div>
                        <div>
                            <span className="text-muted d-block text-uppercase fs-11 fw-bold tracking-wider">{label}</span>
                            <h4 className="mb-0 fw-bold">{value}</h4>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    const user = details.user || {};

    return (
        <div className="animate__animated animate__fadeIn">
            <div className="row g-4">
                {/* Quick Stats */}
                <div className="col-12">
                    <div className="row g-3">
                        <StatCard
                            label="Exams Taken"
                            value={details.examStats?.total || 0}
                            icon={FiBookOpen}
                            color="primary"
                        />
                        <StatCard
                            label="Successful"
                            value={details.examStats?.passed || 0}
                            icon={FiCheckCircle}
                            color="success"
                        />
                        <StatCard
                            label="Success Rate"
                            value={`${details.examStats?.total ? Math.round((details.examStats.passed / details.examStats.total) * 100) : 0}%`}
                            icon={FiTrendingUp}
                            color="info"
                        />
                    </div>
                </div>

                {/* Main Detailed Info */}
                <div className="col-12">
                    {/* Identification Section */}
                    <div className="mb-4">
                        <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                            <FiHash className="text-primary" /> Identification & Account
                        </h6>
                        <div className="row g-3">
                            <DetailItem label="Roll Number" value={user.rollNumber} icon={FiHash} color="danger" />
                            <DetailItem label="Full Name" value={user.name} icon={FiUser} />
                            <DetailItem label="User ID" value={user._id} icon={FiInfo} color="secondary" />
                            <DetailItem
                                label="Register Source"
                                icon={(user.registerSource === 'app' || user.fcmToken) ? FaAndroid : FiGlobe}
                                color={(user.registerSource === 'app' || user.fcmToken) ? "success" : "info"}
                                value={
                                    <span className="text-capitalize">
                                        {(user.registerSource === 'app' || user.fcmToken) ? '📱 Mobile App' : '🌐 Website'}
                                    </span>
                                }
                            />
                            <DetailItem
                                label="Auth Method"
                                icon={user.authProvider === 'google' ? FiShield : FiShield}
                                color={user.authProvider === 'google' ? "warning" : "primary"}
                                value={
                                    <div className="d-flex align-items-center gap-2">
                                        {user.authProvider === 'google' ? <FcGoogle size={16} /> : <FiShield size={16} className="text-primary" />}
                                        <span className="text-capitalize">{user.authProvider || 'Local Email'}</span>
                                    </div>
                                }
                            />
                            <DetailItem label="Status" value={<span className="badge bg-soft-success text-success">{user.status}</span>} icon={FiInfo} color="success" />
                        </div>
                    </div>

                    {/* Contact Section */}
                    <div className="mb-4">
                        <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                            <FiPhone className="text-primary" /> Contact Details
                        </h6>
                        <div className="row g-3">
                            <DetailItem
                                label="Email Address"
                                value={
                                    <span className="d-flex align-items-center gap-2">
                                        {user.email}
                                        {user.emailVerified && <FiCheckCircle size={14} className="text-success" title="Verified" />}
                                    </span>
                                }
                                icon={FiMail}
                                color="info"
                            />
                            <DetailItem label="Phone Number" value={user.phone} icon={FiPhone} color="success" />
                            <DetailItem label="Secondary Email" value={user.secondaryEmail} icon={FiMail} color="secondary" />
                        </div>
                    </div>

                    {/* Location Section */}
                    <div className="mb-4">
                        <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                            <FiMapPin className="text-primary" /> Address Information
                        </h6>
                        <div className="row g-3">
                            <DetailItem label="Main Address" value={user.address} icon={FiMapPin} color="danger" />
                            <DetailItem label="City" value={user.city} icon={FiMapPin} color="warning" />
                            <DetailItem label="State" value={user.state} icon={FiGlobe} color="info" />
                            <DetailItem label="Pincode" value={user.pincode} icon={FiHash} color="secondary" />
                        </div>
                    </div>

                    {/* Education Section */}
                    <div className="mb-4">
                        <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                            <FiBookOpen className="text-primary" /> Academic Information
                        </h6>
                        <div className="row g-3">
                            <DetailItem label="Profile Category" value={user.category?.name} icon={FiBookOpen} color="primary" />
                            <DetailItem label="Educational Qualification" value={user.education} icon={FiInfo} color="success" />
                            <DetailItem label="Gender" value={<span className="text-capitalize">{user.gender}</span>} icon={FiUser} color="info" />
                            <DetailItem label="DOB" value={user.dob ? formatDate(user.dob) : null} icon={FiCalendar} color="secondary" />
                        </div>
                    </div>

                    {/* Enrolled Courses Section */}
                    <div className="mb-4">
                        <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                            <FiBookOpen className="text-success" /> Enrolled Courses
                        </h6>
                        <div className="row g-3">
                            {user.enrolledCourses && user.enrolledCourses.length > 0 ? (
                                user.enrolledCourses.map((enrollment, idx) => (
                                    <div className="col-md-6" key={idx}>
                                        <div className="p-3 border rounded bg-white shadow-sm h-100 d-flex align-items-center gap-3">
                                            <div className="avatar avatar-md bg-soft-success text-success rounded">
                                                <FiBookOpen size={20} />
                                            </div>
                                            <div className="flex-grow-1 min-w-0">
                                                <div className="fw-bold text-dark text-truncate mb-1" title={enrollment.courseId?.title}>
                                                    {enrollment.courseId?.title || 'Unknown Course'}
                                                </div>
                                                <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '11px' }}>
                                                    <span title="Enrolled At"><FiCalendar size={10} /> {formatDate(enrollment.enrolledAt)}</span>
                                                    {enrollment.expiresAt && (
                                                        <span className="text-danger" title="Expires At"><FiClock size={10} /> {formatDate(enrollment.expiresAt)}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-12 text-center py-3 bg-white border rounded">
                                    <p className="text-muted mb-0">Not enrolled in any courses</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Activity Log */}
                    <div>
                        <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                            <FiClock className="text-primary" /> System Metrics
                        </h6>
                        <div className="row g-3">
                            <DetailItem label="Joined Date" value={formatDate(user.createdAt)} icon={FiCalendar} color="success" />
                            <DetailItem label="Last Activity" value={formatDate(user.lastActivity || user.updatedAt)} icon={FiClock} color="warning" />
                            <DetailItem label="Updated On" value={formatDate(user.updatedAt)} icon={FiClock} color="info" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StudentOverviewTab
