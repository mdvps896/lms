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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <FaFilePdf className="text-red-600" />
                        Download Report
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <FaTimes />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <p className="text-gray-600 mb-4">
                        Select the sections to include in the report for <strong>{studentName}</strong>:
                    </p>

                    <div className="space-y-3">
                        <div
                            className="flex items-center gap-3 p-3 rounded border hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => toggleSection('exams')}
                        >
                            {selectedSections.exams ? <FaCheckSquare className="text-blue-600 text-xl" /> : <FaSquare className="text-gray-300 text-xl" />}
                            <div className="flex-1">
                                <p className="font-semibold text-gray-800">Exam History</p>
                                <p className="text-xs text-gray-500">Includes attempts, scores, and status</p>
                            </div>
                        </div>

                        <div
                            className="flex items-center gap-3 p-3 rounded border hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => toggleSection('pdfViews')}
                        >
                            {selectedSections.pdfViews ? <FaCheckSquare className="text-blue-600 text-xl" /> : <FaSquare className="text-gray-300 text-xl" />}
                            <div className="flex-1">
                                <p className="font-semibold text-gray-800">PDF Reading History</p>
                                <p className="text-xs text-gray-500">Includes reading time, pages, and <span className="text-red-500 font-bold">Selfie Proofs</span></p>
                            </div>
                        </div>

                        <div
                            className="flex items-center gap-3 p-3 rounded border hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => toggleSection('courses')}
                        >
                            {selectedSections.courses ? <FaCheckSquare className="text-blue-600 text-xl" /> : <FaSquare className="text-gray-300 text-xl" />}
                            <div className="flex-1">
                                <p className="font-semibold text-gray-800">Course Progress</p>
                                <p className="text-xs text-gray-500">Includes enrolled courses and completion status</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-gray-50 rounded-b-lg flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={loading}
                        className={`px-4 py-2 bg-blue-600 text-white font-medium rounded flex items-center gap-2 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
    );
}
