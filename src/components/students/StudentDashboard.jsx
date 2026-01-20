'use client'

import React from 'react'
import { FiSmartphone, FiDownload } from 'react-icons/fi'
import Image from 'next/image'

const StudentDashboard = () => {
    return (
        <div className="container-fluid">
            <div className="row justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
                <div className="col-lg-8 col-xl-6">
                    <div className="card border-0 shadow-lg">
                        <div className="card-body text-center p-5">
                            {/* Icon */}
                            <div className="mb-4">
                                <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10" style={{ width: '120px', height: '120px' }}>
                                    <FiSmartphone size={60} className="text-primary" />
                                </div>
                            </div>

                            {/* Title */}
                            <h2 className="fw-bold mb-3">Access LMS on Mobile</h2>

                            {/* Message */}
                            <p className="text-muted fs-5 mb-4">
                                Please use our mobile application to access the Learning Management System
                            </p>

                            {/* Additional Info */}
                            <div className="alert alert-info d-inline-flex align-items-center mb-4" role="alert">
                                <FiDownload className="me-2" size={20} />
                                <span>Download our mobile app for the best learning experience</span>
                            </div>

                            {/* Features */}
                            <div className="row g-3 mt-4">
                                <div className="col-md-4">
                                    <div className="p-3 bg-light rounded">
                                        <h6 className="mb-2">📚 Access Courses</h6>
                                        <small className="text-muted">View all your enrolled courses</small>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="p-3 bg-light rounded">
                                        <h6 className="mb-2">📝 Take Exams</h6>
                                        <small className="text-muted">Attempt exams on the go</small>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="p-3 bg-light rounded">
                                        <h6 className="mb-2">📊 Track Progress</h6>
                                        <small className="text-muted">Monitor your learning journey</small>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Support */}
                            <div className="mt-5 pt-4 border-top">
                                <p className="text-muted mb-0">
                                    <small>Need help? Contact your administrator for mobile app access</small>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StudentDashboard