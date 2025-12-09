'use client';
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import dynamic from 'next/dynamic';
import MCQ from './types/MCQ';
import MultipleChoice from './types/MultipleChoice';
import TrueFalse from './types/TrueFalse';
import ShortAnswer from './types/ShortAnswer';
import LongAnswer from './types/LongAnswer';
import useJoditConfig from '@/hooks/useJoditConfig';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

const EditQuestionModal = ({ show, onClose, onUpdate, question }) => {
    const config = useJoditConfig();
    const [formData, setFormData] = useState({
        category: '',
        subject: '',
        questionGroup: '',
        type: 'mcq',
        questionText: '',
        marks: 1,
        tips: '',
        wordLimit: 0,
        status: 'active'
    });
    
    const [options, setOptions] = useState([]);
    const [hasImageOptions, setHasImageOptions] = useState(false);

    const [categories, setCategories] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [questionGroups, setQuestionGroups] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (show && question) {
            // Initialize form data from question prop
            setFormData({
                category: question.category?._id || question.category,
                subject: question.subject?._id || question.subject,
                questionGroup: question.questionGroup?._id || question.questionGroup,
                type: question.type,
                questionText: question.questionText,
                marks: question.marks,
                tips: question.tips || '',
                wordLimit: question.wordLimit || 0,
                status: question.status
            });
            setOptions(question.options || []);
            setHasImageOptions(question.hasImageOptions || false);

            // Fetch initial data for dropdowns
            fetchCategories();
            if (question.category) fetchSubjects(question.category._id || question.category);
            if (question.subject) fetchQuestionGroups(question.subject._id || question.subject);
        }
    }, [show, question]);

    // Handle cascading dropdowns only when user changes them manually
    // We need to be careful not to reset data when initial load happens
    // So we might need separate handlers or checks

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories?status=active');
            const data = await res.json();
            if (data.success) setCategories(data.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchSubjects = async (categoryId) => {
        try {
            const res = await fetch(`/api/subjects?category=${categoryId}&status=active`);
            const data = await res.json();
            if (data.success) setSubjects(data.data);
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

    const handleCategoryChange = (e) => {
        const categoryId = e.target.value;
        setFormData(prev => ({ ...prev, category: categoryId, subject: '', questionGroup: '' }));
        setSubjects([]);
        setQuestionGroups([]);
        if (categoryId) fetchSubjects(categoryId);
    };

    const handleSubjectChange = (e) => {
        const subjectId = e.target.value;
        setFormData(prev => ({ ...prev, subject: subjectId, questionGroup: '' }));
        setQuestionGroups([]);
        if (subjectId) fetchQuestionGroups(subjectId);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Validation
        if (!formData.questionText) {
            Swal.fire('Error', 'Question text is required', 'error');
            setLoading(false);
            return;
        }

        if (['mcq', 'multiple_choice', 'true_false'].includes(formData.type)) {
            const correctOptions = options.filter(o => o.isCorrect);
            if (correctOptions.length === 0) {
                Swal.fire('Error', 'Please select at least one correct option', 'error');
                setLoading(false);
                return;
            }
            
            const invalidOptions = options.some(o => hasImageOptions ? !o.image : !o.text);
            if (invalidOptions && formData.type !== 'true_false') {
                 Swal.fire('Error', 'Please fill in all option fields', 'error');
                 setLoading(false);
                 return;
            }
        }

        try {
            const payload = {
                ...formData,
                options: options,
                hasImageOptions
            };

            const res = await fetch(`/api/questions/${question._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to update question');
            }

            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Question updated successfully!',
                timer: 1500,
                showConfirmButton: false
            });

            onUpdate(data.data);
            onClose();
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    const renderQuestionTypeComponent = () => {
        switch (formData.type) {
            case 'mcq':
                return <MCQ options={options} setOptions={setOptions} hasImageOptions={hasImageOptions} setHasImageOptions={setHasImageOptions} />;
            case 'multiple_choice':
                return <MultipleChoice options={options} setOptions={setOptions} hasImageOptions={hasImageOptions} setHasImageOptions={setHasImageOptions} />;
            case 'true_false':
                return <TrueFalse options={options} setOptions={setOptions} hasImageOptions={hasImageOptions} setHasImageOptions={setHasImageOptions} />;
            case 'short_answer':
                return <ShortAnswer wordLimit={formData.wordLimit} setWordLimit={(val) => setFormData({...formData, wordLimit: val})} />;
            case 'long_answer':
                return <LongAnswer wordLimit={formData.wordLimit} setWordLimit={(val) => setFormData({...formData, wordLimit: val})} />;
            default:
                return null;
        }
    };

    if (!show) return null;

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', overflowY: 'auto' }}>
            <div className="modal-dialog modal-dialog-centered modal-xl">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Edit Question</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                        <form>
                            <div className="row g-3">
                                {/* Selection Row */}
                                <div className="col-md-3">
                                    <label className="form-label">Category *</label>
                                    <select
                                        className="form-select"
                                        value={formData.category}
                                        onChange={handleCategoryChange}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">Subject *</label>
                                    <select
                                        className="form-select"
                                        value={formData.subject}
                                        onChange={handleSubjectChange}
                                        disabled={!formData.category}
                                    >
                                        <option value="">Select Subject</option>
                                        {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">Question Group *</label>
                                    <select
                                        className="form-select"
                                        value={formData.questionGroup}
                                        onChange={(e) => setFormData({ ...formData, questionGroup: e.target.value })}
                                        disabled={!formData.subject}
                                    >
                                        <option value="">Select Group</option>
                                        {questionGroups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">Question Type</label>
                                    <select
                                        className="form-select"
                                        value={formData.type}
                                        disabled={true} // Type cannot be changed
                                    >
                                        <option value="mcq">MCQ</option>
                                        <option value="multiple_choice">Multiple Choice</option>
                                        <option value="true_false">True / False</option>
                                        <option value="short_answer">Short Answer</option>
                                        <option value="long_answer">Long Answer</option>
                                    </select>
                                </div>

                                {/* Question Details */}
                                <div className="col-12">
                                    <label className="form-label">Question Text *</label>
                                    <JoditEditor
                                        value={formData.questionText}
                                        config={config}
                                        tabIndex={1}
                                        onBlur={(newContent) => setFormData({ ...formData, questionText: newContent })}
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label">Marks *</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        min="0"
                                        value={formData.marks}
                                        onChange={(e) => setFormData({ ...formData, marks: parseFloat(e.target.value) })}
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label">Status</label>
                                    <select
                                        className="form-select"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>

                                {/* Dynamic Component based on Type */}
                                <div className="col-12">
                                    {renderQuestionTypeComponent()}
                                </div>

                                <div className="col-12">
                                    <label className="form-label">Question Tips (Optional)</label>
                                    <textarea
                                        className="form-control"
                                        rows="2"
                                        value={formData.tips}
                                        onChange={(e) => setFormData({ ...formData, tips: e.target.value })}
                                        placeholder="Enter hints or explanation..."
                                    ></textarea>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Updating...' : 'Update Question'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditQuestionModal;
