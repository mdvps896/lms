'use client';
import { useState } from 'react';
import { FaFilePdf, FaDownload, FaTimes, FaCheckSquare, FaSquare } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function StudentReportModal({ isOpen, onClose, studentId, studentName }) {
    const [loading, setLoading] = useState(false);
    const [selectedSections, setSelectedSections] = useState({
        exams: true,
        pdfViews: true,
        courses: true,
    });

    const toggleSection = (section) => {
        setSelectedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleDownload = async () => {
        if (!Object.values(selectedSections).some(v => v)) {
            toast.error('Please select at least one section');
            return;
        }

        setLoading(true);
        const toastId = toast.loading('Generating comprehensive report...');

        try {
            const queryParams = new URLSearchParams({
                studentId,
                includeExams: selectedSections.exams,
                includePdfViews: selectedSections.pdfViews,
                includeCourses: selectedSections.courses,
            });

            const response = await fetch(`/api/reports/student-comprehensive?${queryParams}`);

            if (!response.ok) {
                throw new Error('Failed to generate report');
            }

            // Handle binary PDF data
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${studentName}_Comprehensive_Report.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('Report downloaded successfully', { id: toastId });
            onClose();

        } catch (error) {
            console.error(error);
            toast.error('Error generating report', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered" role="document">
                <div className="modal-content shadow-lg border-0">
                    {/* Header */}
                    <div className="modal-header bg-white border-bottom">
                        <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                            <FaFilePdf className="text-danger" />
                            Download Report
                        </h5>
                        <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
                    </div>

                    {/* Content */}
                    <div className="modal-body p-4">
                        <p className="text-muted mb-4">
                            Select the sections to include in the report for <strong>{studentName}</strong>:
                        </p>

                        <div className="d-flex flex-column gap-3">
                            <div
                                className="d-flex align-items-center gap-3 p-3 border rounded bg-light cursor-pointer"
                                style={{ cursor: 'pointer' }}
                                onClick={() => toggleSection('exams')}
                            >
                                {selectedSections.exams ? <FaCheckSquare className="text-primary fs-5" /> : <FaSquare className="text-muted fs-5" />}
                                <div>
                                    <div className="fw-semibold text-dark">Exam History</div>
                                    <small className="text-muted">Includes attempts, scores, and status</small>
                                </div>
                            </div>

                            <div
                                className="d-flex align-items-center gap-3 p-3 border rounded bg-light cursor-pointer"
                                style={{ cursor: 'pointer' }}
                                onClick={() => toggleSection('pdfViews')}
                            >
                                {selectedSections.pdfViews ? <FaCheckSquare className="text-primary fs-5" /> : <FaSquare className="text-muted fs-5" />}
                                <div>
                                    <div className="fw-semibold text-dark">PDF Reading History</div>
                                    <small className="text-muted">Includes reading time, pages, and <span className="text-danger fw-bold">Selfie Proofs</span></small>
                                </div>
                            </div>

                            <div
                                className="d-flex align-items-center gap-3 p-3 border rounded bg-light cursor-pointer"
                                style={{ cursor: 'pointer' }}
                                onClick={() => toggleSection('courses')}
                            >
                                {selectedSections.courses ? <FaCheckSquare className="text-primary fs-5" /> : <FaSquare className="text-muted fs-5" />}
                                <div>
                                    <div className="fw-semibold text-dark">Course Progress</div>
                                    <small className="text-muted">Includes enrolled courses and completion status</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="modal-footer bg-light border-top-0">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary d-flex align-items-center gap-2"
                            onClick={handleDownload}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <FaDownload />
                                    Download PDF
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
