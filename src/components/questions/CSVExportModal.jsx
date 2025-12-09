import React, { useState } from 'react';
import { toast } from 'react-toastify';

const CSVExportModal = ({ show, onHide, selectedQuestions = [] }) => {
    const [exporting, setExporting] = useState(false);
    const [exportType, setExportType] = useState('selected'); // 'selected' or 'all'

    const exportToCSV = async () => {
        setExporting(true);
        
        try {
            const endpoint = exportType === 'all' ? '/api/questions/export' : '/api/questions/export';
            const body = exportType === 'selected' ? 
                { questionIds: selectedQuestions } : 
                { exportAll: true };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();
            if (!text) {
                throw new Error('Empty response from server');
            }

            const result = JSON.parse(text);
            
            if (result.success) {
                // Create CSV content
                const headers = ['Question Text', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Question Type', 'Question Group', 'Difficulty'];
                const csvData = [headers];

                result.questions.forEach(question => {
                    const row = [
                        question.questionText,
                        question.options?.[0]?.text || '',
                        question.options?.[1]?.text || '',
                        question.options?.[2]?.text || '',
                        question.options?.[3]?.text || '',
                        question.correctAnswer,
                        question.type,
                        question.questionGroup,
                        question.difficulty
                    ];
                    csvData.push(row);
                });

                // Convert to CSV string
                const csvContent = csvData.map(row => 
                    row.map(cell => `"${cell}"`).join(',')
                ).join('\n');

                // Download file
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                
                const fileName = exportType === 'all' ? 
                    `all_questions_${new Date().toISOString().split('T')[0]}.csv` :
                    `selected_questions_${new Date().toISOString().split('T')[0]}.csv`;
                    
                link.setAttribute('download', fileName);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                toast.success(`Successfully exported ${result.questions.length} questions!`);
                onHide();
            } else {
                throw new Error(result.error || 'Export failed');
            }
        } catch (error) {
            console.error('Export error:', error);
            if (error.message.includes('JSON')) {
                toast.error('Invalid response from server. Please try again.');
            } else {
                toast.error(error.message || 'Failed to export questions');
            }
        } finally {
            setExporting(false);
        }
    };

    const exportSampleQuestions = () => {
        const sampleData = [
            ['Question Text', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Question Type', 'Question Group', 'Difficulty'],
            ['What is 2+2?', '3', '4', '5', '6', 'B', 'mcq', 'Mathematics', 'Easy'],
            ['Which are programming languages?', 'Python', 'HTML', 'JavaScript', 'CSS', 'A,C', 'multiple_choice', 'Programming', 'Medium'],
            ['What is the capital of India?', 'Mumbai', 'Delhi', 'Kolkata', 'Chennai', 'B', 'mcq', 'Geography', 'Medium'],
            ['Water boils at 100°C', 'True', 'False', '', '', 'A', 'true_false', 'Science', 'Easy'],
            ['Select all prime numbers', '2', '4', '3', '6', 'A,C', 'multiple_choice', 'Mathematics', 'Hard'],
            ['What is the chemical symbol for water?', 'H2O', 'CO2', 'NaCl', 'O2', 'A', 'mcq', 'Chemistry', 'Easy']
        ];

        const csvContent = sampleData.map(row => 
            row.map(cell => `"${cell}"`).join(',')
        ).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'sample_questions_export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Sample questions exported successfully!');
    };

    if (!show) return null;

    return (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="fas fa-download me-2"></i>
                            Export Questions to CSV
                        </h5>
                        <button type="button" className="btn-close" onClick={onHide}></button>
                    </div>
                    <div className="modal-body">
                        <div className="mb-4">
                            <label className="form-label">Export Options</label>
                            <div className="form-check mb-2">
                                <input 
                                    className="form-check-input" 
                                    type="radio" 
                                    name="exportType" 
                                    id="exportSelected"
                                    value="selected"
                                    checked={exportType === 'selected'}
                                    onChange={(e) => setExportType(e.target.value)}
                                    disabled={selectedQuestions.length === 0}
                                />
                                <label className="form-check-label" htmlFor="exportSelected">
                                    Export Selected Questions 
                                    <span className="badge bg-primary ms-2">{selectedQuestions.length}</span>
                                </label>
                            </div>
                            <div className="form-check">
                                <input 
                                    className="form-check-input" 
                                    type="radio" 
                                    name="exportType" 
                                    id="exportAll"
                                    value="all"
                                    checked={exportType === 'all'}
                                    onChange={(e) => setExportType(e.target.value)}
                                />
                                <label className="form-check-label" htmlFor="exportAll">
                                    Export All Questions
                                </label>
                            </div>
                        </div>

                        {selectedQuestions.length === 0 && (
                            <div className="alert alert-warning">
                                <i className="fas fa-exclamation-triangle me-2"></i>
                                No questions selected. You can only export all questions.
                            </div>
                        )}

                        <div className="alert alert-info">
                            <i className="fas fa-info-circle me-2"></i>
                            <strong>CSV Format:</strong> The exported file will include Question Text, Options A-D, Correct Answer, Question Group, and Difficulty columns.
                        </div>

                        {/* Sample Export */}
                        <div className="border-top pt-3">
                            <h6>Need a sample?</h6>
                            <p className="text-muted mb-2">Download sample questions to see the export format.</p>
                            <button 
                                className="btn btn-outline-secondary btn-sm"
                                onClick={exportSampleQuestions}
                            >
                                <i className="fas fa-file-csv me-1"></i>
                                Download Sample CSV
                            </button>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onHide}>
                            Cancel
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-success" 
                            onClick={exportToCSV}
                            disabled={exporting || (exportType === 'selected' && selectedQuestions.length === 0)}
                        >
                            {exporting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-download me-1"></i>
                                    Export CSV
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CSVExportModal;