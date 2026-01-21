import React, { useState } from 'react';
import { toast } from 'react-toastify';

const CSVImportModal = ({ show, onHide, onImportSuccess }) => {
    const [file, setFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [previewData, setPreviewData] = useState([]);
    const [showPreview, setShowPreview] = useState(false);

    const downloadSampleCSV = () => {
        const sampleData = [
            ['Question Text', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Question Type', 'Question Group', 'Difficulty'],
            ['What is 2+2?', '3', '4', '5', '6', 'B', 'mcq', 'Mathematics', 'Easy'],
            ['Which are programming languages?', 'Python', 'HTML', 'JavaScript', 'CSS', 'A,C', 'multiple_choice', 'Programming', 'Medium'],
            ['What is the capital of India?', 'Mumbai', 'Delhi', 'Kolkata', 'Chennai', 'B', 'mcq', 'Geography', 'Medium'],
            ['Water boils at 100°C', 'True', 'False', '', '', 'A', 'true_false', 'Science', 'Easy'],
            ['Select all prime numbers', '2', '4', '3', '6', 'A,C', 'multiple_choice', 'Mathematics', 'Hard'],
            ['Explain photosynthesis process', '', '', '', '', 'Plants convert sunlight into energy using chlorophyll', 'short_answer', 'Biology', 'Hard']
        ];

        const csvContent = sampleData.map(row => 
            row.map(cell => `"${cell}"`).join(',')
        ).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'sample_questions.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Sample CSV downloaded successfully!');
    };

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
                toast.error('Please select a CSV file');
                return;
            }
            setFile(selectedFile);
            previewCSV(selectedFile);
        }
    };

    const previewCSV = (csvFile) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const rows = text.split('\n').filter(row => row.trim());
            const data = rows.slice(0, 6).map(row => {
                // Simple CSV parsing (for preview only)
                const cols = row.split(',').map(col => col.replace(/"/g, '').trim());
                return cols;
            });
            setPreviewData(data);
            setShowPreview(true);
        };
        reader.readAsText(csvFile);
    };

    const validateCSVFormat = (data) => {
        if (data.length < 2) {
            return 'CSV file must have at least a header row and one data row';
        }

        const headers = data[0];
        const expectedHeaders = ['Question Text', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Question Type', 'Question Group', 'Difficulty'];
        
        for (let header of expectedHeaders) {
            if (!headers.includes(header)) {
                return `Missing required column: ${header}`;
            }
        }

        // Check each row has correct number of columns
        for (let i = 1; i < data.length; i++) {
            if (data[i].length !== headers.length) {
                return `Row ${i + 1} has incorrect number of columns`;
            }
        }

        return null;
    };

    const handleImport = async () => {
        if (!file) {
            toast.error('Please select a file first');
            return;
        }

        setImporting(true);

        try {
            // Read file content as promise
            const csvText = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsText(file);
            });

            const rows = csvText.split('\n').filter(row => row.trim());
            const data = rows.map(row => {
                // Proper CSV parsing
                const cols = [];
                let current = '';
                let inQuotes = false;
                
                for (let i = 0; i < row.length; i++) {
                    const char = row[i];
                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        cols.push(current.trim());
                        current = '';
                    } else {
                        current += char;
                    }
                }
                cols.push(current.trim());
                return cols;
            });

            // Validate format
            const validationError = validateCSVFormat(data);
            if (validationError) {
                toast.error(validationError);
                return;
            }

            // Prepare questions data
            const headers = data[0];
            const questions = data.slice(1).map((row, index) => {
                const questionData = {};
                headers.forEach((header, i) => {
                    questionData[header] = row[i] || '';
                });

                return {
                    questionText: questionData['Question Text'],
                    'Question Text': questionData['Question Text'],
                    'Option A': questionData['Option A'],
                    'Option B': questionData['Option B'], 
                    'Option C': questionData['Option C'],
                    'Option D': questionData['Option D'],
                    correctAnswer: questionData['Correct Answer'],
                    'Correct Answer': questionData['Correct Answer'],
                    type: questionData['Question Type'] || 'mcq',
                    'Question Type': questionData['Question Type'] || 'mcq',
                    questionGroup: questionData['Question Group'],
                    'Question Group': questionData['Question Group'],
                    difficulty: questionData['Difficulty'] || 'Medium'
                };
            });

            // Send to API
            const response = await fetch('/api/questions/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ questions })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const responseText = await response.text();
            if (!responseText) {
                throw new Error('Empty response from server');
            }
            
            const result = JSON.parse(responseText);

            if (result.success) {
                if (result.errors && result.errors.length > 0) {
                    toast.success(`Successfully imported ${result.imported} questions! ${result.errors.length} had errors - check console for details.`);
                } else {
                    toast.success(`Successfully imported ${result.imported} questions!`);
                }
                onImportSuccess();
                onHide();
                resetModal();
            } else {
                throw new Error(result.error || 'Failed to import questions');
            }
        } catch (error) {
            console.error('Import error:', error);
            if (error.message.includes('JSON')) {
                toast.error('Invalid response from server. Please try again.');
            } else {
                toast.error(error.message || 'Failed to import questions');
            }
        } finally {
            setImporting(false);
        }
    };

    const resetModal = () => {
        setFile(null);
        setPreviewData([]);
        setShowPreview(false);
        setImporting(false);
    };

    const handleClose = () => {
        resetModal();
        onHide();
    };

    if (!show) return null;

    return (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="fas fa-upload me-2"></i>
                            Import Questions from CSV
                        </h5>
                        <button type="button" className="btn-close" onClick={handleClose}></button>
                    </div>
                    <div className="modal-body">
                        {/* Download Sample */}
                        <div className="alert alert-info mb-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <i className="fas fa-info-circle me-2"></i>
                                    <strong>Need a sample format?</strong>
                                    <p className="mb-0 mt-1">Download our sample CSV file to see the required format.</p>
                                </div>
                                <button 
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={downloadSampleCSV}
                                >
                                    <i className="fas fa-download me-1"></i>
                                    Download Sample
                                </button>
                            </div>
                        </div>

                        {/* File Upload */}
                        <div className="mb-4">
                            <label className="form-label">Select CSV File</label>
                            <input 
                                type="file" 
                                className="form-control" 
                                accept=".csv"
                                onChange={handleFileSelect}
                            />
                            <div className="form-text">
                                File must be in CSV format with required columns: Question Text, Option A-D, Correct Answer, Question Type, Question Group, Difficulty
                            </div>
                        </div>

                        {/* Preview */}
                        {showPreview && (
                            <div className="mb-4">
                                <h6>Preview (First 5 rows):</h6>
                                <div className="table-responsive">
                                    <table className="table table-sm table-bordered">
                                        <thead className="table-light">
                                            <tr>
                                                {previewData[0]?.map((header, i) => (
                                                    <th key={i} style={{fontSize: '12px'}}>{header}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewData.slice(1).map((row, i) => (
                                                <tr key={i}>
                                                    {row.map((cell, j) => (
                                                        <td key={j} style={{fontSize: '11px'}}>
                                                            {cell.length > 20 ? cell.substring(0, 20) + '...' : cell}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={handleClose}>
                            Cancel
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-primary" 
                            onClick={handleImport}
                            disabled={!file || importing}
                        >
                            {importing ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-upload me-1"></i>
                                    Import Questions
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CSVImportModal;