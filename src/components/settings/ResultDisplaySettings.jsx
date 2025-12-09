'use client';
import React, { useState, useEffect } from 'react';
import { FiSave, FiRefreshCw, FiMonitor, FiCheckCircle, FiXCircle, FiDownload, FiClock, FiBarChart } from 'react-icons/fi';

const ResultDisplaySettings = ({ settings, onUpdate, saving }) => {
    const [formData, setFormData] = useState({
        showCorrectAnswers: true,
        showQuestionwiseScores: true,
        resultDisplayFormat: 'Detailed',
        showTimeTaken: true,
        showDifficultyLevel: false,
        allowResultDownload: true
    });

    useEffect(() => {
        if (settings && settings.resultDisplay) {
            setFormData(settings.resultDisplay);
        }
    }, [settings]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onUpdate(formData);
    };

    const handleReset = () => {
        if (settings && settings.resultDisplay) {
            setFormData(settings.resultDisplay);
        }
    };

    const resultFormats = [
        { value: 'Default', label: 'Default (Results Only)', description: 'Show only exam name, marks, and pass/fail status - No questions' },
        { value: 'Minimal', label: 'Minimal', description: 'Show only incorrect answers' },
        { value: 'Summary', label: 'Summary', description: 'Show question text and result (correct/incorrect)' },
        { value: 'Detailed', label: 'Detailed', description: 'Show all questions, answers, and correct answers highlighted' }
    ];

    return (
        <form onSubmit={handleSubmit}>
            <div className="row g-4">
                {/* Answer Display */}
                <div className="col-12">
                    <h6 className="fw-bold text-primary mb-3 d-flex align-items-center">
                        <FiCheckCircle className="me-2" /> Answer Display Options
                    </h6>
                </div>

                <div className="col-md-6">
                    <div className="card border-0 bg-light h-100">
                        <div className="card-body">
                            <div className="form-check mb-3">
                                <input
                                    type="checkbox"
                                    name="showCorrectAnswers"
                                    className="form-check-input"
                                    id="showCorrectAnswers"
                                    checked={formData.showCorrectAnswers}
                                    onChange={handleInputChange}
                                />
                                <label className="form-check-label fw-medium" htmlFor="showCorrectAnswers">
                                    Show Correct Answers
                                </label>
                            </div>
                            <p className="text-muted small mb-0">
                                Display correct answers after exam completion. Students can see what they got wrong.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="col-md-6">
                    <div className="card border-0 bg-light h-100">
                        <div className="card-body">
                            <div className="form-check mb-3">
                                <input
                                    type="checkbox"
                                    name="showQuestionwiseScores"
                                    className="form-check-input"
                                    id="showQuestionwiseScores"
                                    checked={formData.showQuestionwiseScores}
                                    onChange={handleInputChange}
                                />
                                <label className="form-check-label fw-medium" htmlFor="showQuestionwiseScores">
                                    Show Question-wise Scores
                                </label>
                            </div>
                            <p className="text-muted small mb-0">
                                Show individual scores for each question with marks obtained vs total marks.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Result Format */}
                <div className="col-12 mt-4">
                    <h6 className="fw-bold text-primary mb-3 d-flex align-items-center">
                        <FiMonitor className="me-2" /> Result Display Format
                    </h6>
                </div>

                <div className="col-12">
                    <label className="form-label">Choose Result Display Format</label>
                    <select
                        name="resultDisplayFormat"
                        className="form-select"
                        value={formData.resultDisplayFormat}
                        onChange={handleInputChange}
                    >
                        {resultFormats.map(format => (
                            <option key={format.value} value={format.value}>
                                {format.label}
                            </option>
                        ))}
                    </select>
                    <div className="mt-3">
                        {resultFormats.map(format => (
                            <div
                                key={format.value}
                                className={`card border-0 mb-2 ${formData.resultDisplayFormat === format.value ? 'bg-primary text-white' : 'bg-light'}`}
                            >
                                <div className="card-body py-2">
                                    <div className="d-flex align-items-center">
                                        <strong className="me-2">{format.label}:</strong>
                                        <span className="small">{format.description}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Additional Display Options */}
                <div className="col-12 mt-4">
                    <h6 className="fw-bold text-primary mb-3 d-flex align-items-center">
                        <FiBarChart className="me-2" /> Additional Display Options
                    </h6>
                </div>

                <div className="col-md-6">
                    <div className="card border-0 bg-light h-100">
                        <div className="card-body">
                            <div className="form-check mb-3">
                                <input
                                    type="checkbox"
                                    name="showTimeTaken"
                                    className="form-check-input"
                                    id="showTimeTaken"
                                    checked={formData.showTimeTaken}
                                    onChange={handleInputChange}
                                />
                                <label className="form-check-label fw-medium" htmlFor="showTimeTaken">
                                    <FiClock className="me-1" /> Show Time Taken
                                </label>
                            </div>
                            <p className="text-muted small mb-0">
                                Display total time taken to complete the exam and time spent per question.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="col-md-6">
                    <div className="card border-0 bg-light h-100">
                        <div className="card-body">
                            <div className="form-check mb-3">
                                <input
                                    type="checkbox"
                                    name="showDifficultyLevel"
                                    className="form-check-input"
                                    id="showDifficultyLevel"
                                    checked={formData.showDifficultyLevel}
                                    onChange={handleInputChange}
                                />
                                <label className="form-check-label fw-medium" htmlFor="showDifficultyLevel">
                                    Show Difficulty Level
                                </label>
                            </div>
                            <p className="text-muted small mb-0">
                                Show difficulty level (Easy, Medium, Hard) for each question in results.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Download Options */}
                <div className="col-12 mt-4">
                    <h6 className="fw-bold text-primary mb-3 d-flex align-items-center">
                        <FiDownload className="me-2" /> Download Options
                    </h6>
                </div>

                <div className="col-12">
                    <div className="card border-0 bg-light">
                        <div className="card-body">
                            <div className="form-check mb-3">
                                <input
                                    type="checkbox"
                                    name="allowResultDownload"
                                    className="form-check-input"
                                    id="allowResultDownload"
                                    checked={formData.allowResultDownload}
                                    onChange={handleInputChange}
                                />
                                <label className="form-check-label fw-medium" htmlFor="allowResultDownload">
                                    <FiDownload className="me-1" /> Allow Result Download
                                </label>
                            </div>
                            <p className="text-muted small mb-0">
                                Allow students to download their exam results as PDF. Includes certificate generation for passed exams.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Preview Section */}
                <div className="col-12 mt-4">
                    <h6 className="fw-bold text-secondary mb-3">Result Preview</h6>
                    <div className="card border">
                        <div className="card-header bg-light">
                            <h6 className="mb-0">Sample Result Display</h6>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-8">
                                    <h5 className="text-success">Exam Completed Successfully!</h5>
                                    <p>Score: <strong>85/100 (85%)</strong></p>
                                    {formData.showTimeTaken && <p>Time Taken: <strong>45 minutes</strong></p>}
                                    <p>Status: <span className="badge bg-success">PASSED</span></p>

                                    {formData.resultDisplayFormat === 'Detailed' && (
                                        <div className="mt-3">
                                            <h6>Question Summary:</h6>
                                            <div className="small">
                                                {formData.showQuestionwiseScores && <p>• Question 1: 5/5 marks</p>}
                                                {formData.showCorrectAnswers && <p>• Correct answers displayed</p>}
                                                {formData.showDifficultyLevel && <p>• Difficulty levels shown</p>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="col-md-4 text-end">
                                    {formData.allowResultDownload && (
                                        <button className="btn btn-outline-primary btn-sm">
                                            <FiDownload className="me-1" /> Download PDF
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="col-12 mt-4">
                    <div className="d-flex gap-2">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <FiRefreshCw className="spin me-2" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FiSave className="me-2" />
                                    Save Changes
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={handleReset}
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default ResultDisplaySettings;