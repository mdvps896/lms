'use client'
import { useState } from 'react';

export default function ExamFilterModal({ show, onHide, exams, onExamSelect, selectedExam }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredExams, setFilteredExams] = useState(exams);

    const handleSearch = (term) => {
        setSearchTerm(term);
        if (term) {
            setFilteredExams(exams.filter(exam => 
                exam.title.toLowerCase().includes(term.toLowerCase()) ||
                exam.subject.toLowerCase().includes(term.toLowerCase())
            ));
        } else {
            setFilteredExams(exams);
        }
    };

    const handleApply = (exam) => {
        onExamSelect(exam);
    };

    if (!show) return null;

    return (
        <div className="modal fade show" style={{ display: 'block', zIndex: 9999 }} tabIndex="-1">
            <div className="modal-backdrop fade show" style={{ zIndex: 9998 }} onClick={onHide}></div>
            <div className="modal-dialog modal-lg modal-dialog-centered" style={{ zIndex: 10000 }}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="fas fa-filter me-2"></i>
                            Filter Exams
                        </h5>
                        <button type="button" className="btn-close" onClick={onHide}></button>
                    </div>
                    
                    <div className="modal-body">
                        {/* Search */}
                        <div className="mb-4">
                            <label className="form-label">Search Exams</label>
                            <div className="position-relative">
                                <i className="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                                <input
                                    type="text"
                                    className="form-control ps-5"
                                    placeholder="Search by exam name or subject..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Exam List */}
                        <div className="mb-3">
                            <label className="form-label">Select Exam</label>
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {filteredExams.length > 0 ? (
                                    <div className="list-group">
                                        {filteredExams.map((exam) => (
                                            <div
                                                key={exam.id}
                                                className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                                                    selectedExam?.id === exam.id ? 'active' : ''
                                                }`}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => handleApply(exam)}
                                            >
                                                <div>
                                                    <h6 className="mb-1">{exam.title}</h6>
                                                    <p className="mb-1 text-muted small">
                                                        <i className="fas fa-book me-1"></i>
                                                        {exam.subject} • 
                                                        <i className="fas fa-question-circle ms-2 me-1"></i>
                                                        {exam.totalQuestions} Questions • 
                                                        <i className="fas fa-clock ms-2 me-1"></i>
                                                        {exam.duration} minutes
                                                    </p>
                                                </div>
                                                <div>
                                                    <button
                                                        className={`btn btn-sm ${
                                                            selectedExam?.id === exam.id 
                                                                ? 'btn-light' 
                                                                : 'btn-primary'
                                                        }`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleApply(exam);
                                                        }}
                                                    >
                                                        {selectedExam?.id === exam.id ? 'Selected' : 'Apply'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <i className="fas fa-search fa-3x text-muted mb-3"></i>
                                        <h6>No exams found</h6>
                                        <p className="text-muted">Try adjusting your search criteria</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onHide}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}