'use client';
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { FiCheck, FiCpu, FiDatabase, FiAlertCircle, FiDownload } from 'react-icons/fi';

const JSONImportModal = ({ show, onClose, onImportSuccess }) => {
    const [step, setStep] = useState(1); // 1: Input, 2: Preview
    const [jsonInput, setJsonInput] = useState('');
    const [parsedQuestions, setParsedQuestions] = useState([]);
    const [scanning, setScanning] = useState(false);

    // Selection State
    const [categories, setCategories] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [questionGroups, setQuestionGroups] = useState([]);

    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');

    const [importing, setImporting] = useState(false);

    useEffect(() => {
        if (show) {
            fetchCategories();
            setStep(1);
            setJsonInput('');
            setParsedQuestions([]);
            setSelectedCategory('');
            setSelectedSubject('');
            setSelectedGroup('');
        }
    }, [show]);

    useEffect(() => {
        if (selectedCategory) {
            fetchSubjects(selectedCategory);
            setSelectedSubject('');
            setSelectedGroup('');
            setSubjects([]);
            setQuestionGroups([]);
        }
    }, [selectedCategory]);

    useEffect(() => {
        if (selectedSubject) {
            fetchQuestionGroups(selectedSubject);
            setSelectedGroup('');
            setQuestionGroups([]);
        }
    }, [selectedSubject]);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories?status=active');
            const data = await res.json();
            if (data.success) setCategories(data.data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchSubjects = async (categoryId) => {
        try {
            const res = await fetch(`/api/subjects?category=${categoryId}&status=active`);
            const data = await res.json();
            if (data.success) setSubjects(data.data || []);
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const fetchQuestionGroups = async (subjectId) => {
        try {
            const res = await fetch(`/api/question-groups?subject=${subjectId}&status=active`);
            const data = await res.json();
            const groups = Array.isArray(data) ? data : (data.data || []);
            const filteredGroups = groups.filter(g => g.subject?._id === subjectId || g.subject === subjectId);
            setQuestionGroups(filteredGroups);
        } catch (error) {
            console.error('Error fetching question groups:', error);
        }
    };

    const handleScan = () => {
        if (!selectedCategory || !selectedSubject || !selectedGroup) {
            Swal.fire('Error', 'Please select Category, Subject, and Group first.', 'error');
            return;
        }

        if (!jsonInput.trim()) {
            Swal.fire('Error', 'Please paste JSON content.', 'error');
            return;
        }

        setScanning(true);

        // Simulate scanning delay for animation
        setTimeout(() => {
            try {
                let parsed = JSON.parse(jsonInput);

                // Ensure it's an array
                if (!Array.isArray(parsed)) {
                    // Try to handle if wrapped in an object like { data: [...] } or { questions: [...] }
                    if (parsed.data && Array.isArray(parsed.data)) parsed = parsed.data;
                    else if (parsed.questions && Array.isArray(parsed.questions)) parsed = parsed.questions;
                    else parsed = [parsed]; // Treat as single object
                }

                // Validate structure
                const validQuestions = parsed.filter(q => q.questionText && q.type).map(q => ({
                    ...q,
                    category: selectedCategory,
                    subject: selectedSubject,
                    questionGroup: selectedGroup,
                    status: 'active'
                }));

                if (validQuestions.length === 0) {
                    throw new Error('No valid questions found in JSON. Ensure keys like "questionText" and "type" exist.');
                }

                setParsedQuestions(validQuestions);
                setStep(2);
            } catch (error) {
                Swal.fire('Invalid JSON', error.message, 'error');
            } finally {
                setScanning(false);
            }
        }, 1500); // 1.5s scanning animation
    };

    const handleDownloadDemo = () => {
        const demoData = [
            {
                "questionText": "What is the capital of France?",
                "type": "mcq",
                "marks": 1,
                "options": [
                    { "text": "Paris", "isCorrect": true },
                    { "text": "to", "isCorrect": false },
                    { "text": "Berlin", "isCorrect": false }
                ],
                "tips": "City of Light"
            },
            {
                "questionText": "Earth is flat.",
                "type": "true_false",
                "marks": 1,
                "options": [
                    { "text": "True", "isCorrect": false },
                    { "text": "False", "isCorrect": true }
                ]
            }
        ];

        const blob = new Blob([JSON.stringify(demoData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'demo_questions.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImport = async () => {
        setImporting(true);
        try {
            // Bulk import API or loop? 
            // We likely need a bulk-create endpoint.
            // If not exists, allow loop.
            // Let's assume we use loop for now if bulk endpoint doesn't exist, OR create one.
            // Using /api/questions for single creation is slow.
            // Let's check api/questions/bulk-import? Currently likely CSV import used dedicated logic.

            // For now, I will use Promise.all with individual requests as a robust fallback.
            // Or better, create a temporary array and send.
            // Actually, let's try to send one by one to show progress or handle partial failures.

            let successCount = 0;
            let errors = [];

            // We can send raw parsedQuestions to a bulk endpoint if we make one.
            // But let's stick to existing single POST for safety unless we see a bulk route.
            // Wait, QuestionList has `bulk-delete`. Maybe `bulk-create`?
            // I'll create `POST /api/questions/bulk` later if needed. Use loop for now.

            for (const q of parsedQuestions) {
                try {
                    const res = await fetch('/api/questions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(q)
                    });
                    const data = await res.json();
                    if (data.success) {
                        successCount++;
                    } else {
                        errors.push(`Failed: ${q.questionText?.substring(0, 30)}... - ${data.message}`);
                    }
                } catch (err) {
                    errors.push(`Error: ${q.questionText?.substring(0, 30)}...`);
                }
            }

            if (successCount > 0) {
                Swal.fire({
                    title: 'Import Complete',
                    text: `Successfully imported ${successCount} questions. ${errors.length > 0 ? `${errors.length} failed.` : ''}`,
                    icon: errors.length > 0 ? 'warning' : 'success'
                });
                onImportSuccess();
                onClose();
            } else {
                Swal.fire('Import Failed', 'No questions were imported. ' + errors.join('\n'), 'error');
            }

        } catch (error) {
            Swal.fire('Error', 'Import process failed.', 'error');
        } finally {
            setImporting(false);
        }
    };

    if (!show) return null;

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', overflowY: 'auto' }}>
            <div className={`modal-dialog modal-dialog-centered ${step === 2 ? 'modal-xl' : 'modal-lg'}`}>
                <div className="modal-content border-0 shadow-lg">
                    <div className="modal-header bg-light">
                        <h5 className="modal-title">
                            <FiDatabase className="me-2 text-primary" />
                            Import Questions via JSON
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose} disabled={scanning || importing}></button>
                    </div>
                    <div className="modal-body p-4">
                        {step === 1 && (
                            <div className="row g-4">
                                <div className="col-12">
                                    <div className="alert alert-info d-flex align-items-center mb-0">
                                        <FiCpu className="me-3 fs-3" />
                                        <div>
                                            <strong>Smart JSON Import</strong><br />
                                            Select your target group and paste your JSON array. We'll scan and validate it for you.
                                        </div>
                                    </div>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-bold">Category</label>
                                    <select className="form-select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                                        <option value="">Select Category</option>
                                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label fw-bold">Subject</label>
                                    <select className="form-select" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} disabled={!selectedCategory}>
                                        <option value="">Select Subject</option>
                                        {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label fw-bold">Question Group</label>
                                    <select className="form-select" value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} disabled={!selectedSubject}>
                                        <option value="">Select Group</option>
                                        {questionGroups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                                    </select>
                                </div>

                                <div className="col-12">
                                    <label className="form-label fw-bold d-flex justify-content-between align-items-center">
                                        <span>Paste JSON Data</span>
                                        <div>
                                            <button
                                                className="btn btn-link btn-sm text-decoration-none p-0 me-3"
                                                onClick={handleDownloadDemo}
                                                title="Download sample JSON structure"
                                            >
                                                <FiDownload className="me-1" />
                                                Download Sample JSON
                                            </button>
                                            <small className="text-muted">Array of objects [...]</small>
                                        </div>
                                    </label>
                                    <div className="position-relative">
                                        <textarea
                                            className="form-control font-monospace"
                                            rows="12"
                                            value={jsonInput}
                                            onChange={(e) => setJsonInput(e.target.value)}
                                            placeholder='[
  {
    "questionText": "What is 2+2?",
    "type": "mcq",
    "marks": 1,
    "options": [
      {"text": "4", "isCorrect": true},
      {"text": "5", "isCorrect": false}
    ]
  },
  ...
]'
                                            style={{ fontSize: '0.85rem', backgroundColor: '#f8f9fa' }}
                                        ></textarea>

                                        {scanning && (
                                            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-white bg-opacity-75" style={{ backdropFilter: 'blur(2px)' }}>
                                                <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}></div>
                                                <h5 className="text-primary animate-pulse">Scanning JSON Structure...</h5>
                                                <p className="text-muted">Validating data types and fields</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="mb-0 text-success">
                                        <FiCheck className="me-2" />
                                        Valid Questions Found: {parsedQuestions.length}
                                    </h6>
                                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setStep(1)}>Go Back</button>
                                </div>

                                <div className="table-responsive border rounded" style={{ maxHeight: '500px' }}>
                                    <table className="table table-striped table-hover mb-0">
                                        <thead className="table-light sticky-top">
                                            <tr>
                                                <th style={{ width: '50px' }}>#</th>
                                                <th>Question</th>
                                                <th>Type</th>
                                                <th>Marks</th>
                                                <th>Options</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parsedQuestions.map((q, idx) => (
                                                <tr key={idx}>
                                                    <td>{idx + 1}</td>
                                                    <td>
                                                        <div className="text-truncate" style={{ maxWidth: '350px' }}>{q.questionText}</div>
                                                    </td>
                                                    <td><span className="badge bg-secondary">{q.type}</span></td>
                                                    <td>{q.marks || 1}</td>
                                                    <td>
                                                        <small>{(q.options || []).length} options</small>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        {step === 1 ? (
                            <>
                                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={scanning}>Cancel</button>
                                <button type="button" className="btn btn-primary px-4" onClick={handleScan} disabled={scanning}>
                                    {scanning ? 'Scanning...' : 'Scan & Verify JSON'}
                                </button>
                            </>
                        ) : (
                            <>
                                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={importing}>Cancel</button>
                                <button type="button" className="btn btn-success px-4" onClick={handleImport} disabled={importing}>
                                    {importing ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Importing...
                                        </>
                                    ) : 'Complete Import'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .animate-pulse {
                    animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .5; }
                }
            `}</style>
        </div>
    );
};

export default JSONImportModal;
