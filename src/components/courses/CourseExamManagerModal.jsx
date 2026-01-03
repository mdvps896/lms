'use client';
import { useState, useEffect } from 'react';
import { FiTrash2, FiPlus, FiSearch } from 'react-icons/fi';
import Swal from 'sweetalert2';

export default function CourseExamManagerModal({ course, onClose, onUpdate }) {
    const [attachedExams, setAttachedExams] = useState(course.exams || []);
    const [availableExams, setAvailableExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedExamId, setSelectedExamId] = useState('');

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/exams');
            const data = await res.json();
            if (data.success) {
                setAvailableExams(data.data);
            }
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Failed to load exams', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddExam = () => {
        if (!selectedExamId) return;

        // Check if already attached
        if (attachedExams.some(e => (e._id || e) === selectedExamId)) {
            Swal.fire('Warning', 'This exam is already added to the course', 'warning');
            return;
        }

        const examToAdd = availableExams.find(e => e._id === selectedExamId);
        if (examToAdd) {
            setAttachedExams([...attachedExams, examToAdd]);
            setSelectedExamId('');
        }
    };

    const handleRemoveExam = (index) => {
        const newExams = [...attachedExams];
        newExams.splice(index, 1);
        setAttachedExams(newExams);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Extract IDs
            const examIds = attachedExams.map(e => e._id || e);
            const res = await fetch(`/api/courses/${course._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ exams: examIds }) // Only send IDs
            });
            const data = await res.json();
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Saved!',
                    text: 'Course exams updated successfully',
                    timer: 1500,
                    showConfirmButton: false
                });
                onUpdate();
                onClose();
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            Swal.fire('Error', err.message || 'Failed to save changes', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Filter available exams based on search
    const filteredAvailableExams = availableExams.filter(exam =>
        exam.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !attachedExams.some(attached => (attached._id || attached) === exam._id)
    );

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Manage Exams for {course.title}</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        {/* Add Exam Section */}
                        <div className="card mb-4 border-light bg-light">
                            <div className="card-body p-3">
                                <h6 className="card-title mb-3">Add Exam to Course</h6>
                                <div className="row g-2">
                                    <div className="col-md-5">
                                        <div className="input-group">
                                            <span className="input-group-text bg-white"><FiSearch /></span>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Search exams..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-5">
                                        <select
                                            className="form-select"
                                            value={selectedExamId}
                                            onChange={(e) => setSelectedExamId(e.target.value)}
                                        >
                                            <option value="">Select an exam...</option>
                                            {filteredAvailableExams.map(exam => (
                                                <option key={exam._id} value={exam._id}>
                                                    {exam.name} ({exam.type})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-2">
                                        <button
                                            className="btn btn-primary w-100"
                                            onClick={handleAddExam}
                                            disabled={!selectedExamId}
                                        >
                                            <FiPlus /> Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* List Attached Exams */}
                        <h6 className="mb-3">Attached Exams ({attachedExams.length})</h6>

                        <div className="list-group">
                            {attachedExams.length === 0 ? (
                                <div className="text-center py-4 text-muted border border-dashed rounded">
                                    No exams attached to this course.
                                </div>
                            ) : (
                                attachedExams.map((exam, index) => (
                                    <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                                        <div>
                                            <div className="fw-semibold">{exam.name || 'Unknown Exam'}</div>
                                            <small className="text-muted">Type: {exam.type || 'N/A'}</small>
                                        </div>
                                        <button
                                            className="btn btn-outline-danger btn-sm"
                                            onClick={() => handleRemoveExam(index)}
                                            title="Remove Exam"
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
