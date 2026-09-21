'use client'
import React from 'react'

const ExamRecordingBanner = ({ filters, files }) => {
    const shouldShow =
        (filters.type === 'all' || filters.type === 'exam-recording') &&
        files.some(file => file.category?.includes('exam'))

    if (!shouldShow) return null

    return (
        <div className="alert alert-info border-0 mb-4">
            <div className="d-flex align-items-start">
                <div className="me-3">
                    <i className="fas fa-info-circle fa-lg text-primary"></i>
                </div>
                <div>
                    <h6 className="alert-heading mb-2">📹 Exam Recording Information</h6>
                    <p className="mb-2">
                        Each exam creates <strong>2 separate recordings</strong> for comprehensive proctoring:
                    </p>
                    <ul className="mb-2 ps-3">
                        <li><strong>📹 Camera Recording</strong> - Records your face and voice for identity verification</li>
                        <li><strong>🖥️ Screen Recording</strong> - Records your screen activity during the exam</li>
                    </ul>
                    <small className="text-muted">
                        This dual recording system ensures exam integrity and security. Both recordings are automatically saved to local storage.
                    </small>
                </div>
            </div>
        </div>
    )
}

export default ExamRecordingBanner
