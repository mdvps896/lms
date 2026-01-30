'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Select from 'react-select';
import { toast } from 'react-toastify';
import { FiSave, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';

const ExamForm = ({ type, initialData }) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [questionGroups, setQuestionGroups] = useState([]);
    const [minDateTime, setMinDateTime] = useState('');

    useEffect(() => {
        const now = new Date();
        const pad = (n) => n < 10 ? '0' + n : n;
        const current = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
        setMinDateTime(current);
    }, []);

    const [formData, setFormData] = useState({
        name: '',
        category: null,
        subjects: [],
        questionGroups: [],
        type: type,
        startDate: '',
        duration: 60,
        endDate: '',
        description: '',
        instructions: '',
        totalMarks: 0,
        passingPercentage: 35,
        maxAttempts: -1,
        status: 'active',
        settings: {
            allowMic: false,
            allowCam: false,
            allowScreenShare: false,
            allowCaptureId: false,
            allowCaptureFace: false,
            allowTabSwitch: false,
            maxTabSwitches: 3,
            allowCopyPaste: false,
            watermark: {
                enabled: true,
                text: '',
                quantity: 20,
                fontSize: 24
            },
            faceVerification: {
                enabled: false,
                required: false,
                intervalCheck: 0
            },
            identityVerification: {
                enabled: false,
                required: false,
                useProfileImage: true
            }
        }
    });

    // Fetch dependencies
    useEffect(() => {
        const fetchData = async () => {
            try {
                const catsRes = await fetch('/api/categories').then(r => r.json());
                if (catsRes.success) setCategories(catsRes.data.map(c => ({ value: c._id, label: c.name })));
            } catch (error) {
                toast.error('Failed to load form data');
            }
        };
        fetchData();
    }, []);

    // Fetch subjects when category changes
    useEffect(() => {
        const fetchSubjects = async () => {
            if (!formData.category) {
                setSubjects([]);
                return;
            }

            try {
                const subsRes = await fetch(`/api/subjects?category=${formData.category.value}`).then(r => r.json());
                if (subsRes.success) {
                    setSubjects(subsRes.data.map(s => ({ value: s._id, label: s.name })));
                } else {
                    setSubjects([]);
                }
            } catch (error) {
                setSubjects([]);
            }
        };
        fetchSubjects();
    }, [formData.category]);

    // Fetch question groups when subjects change
    useEffect(() => {
        const fetchQuestionGroups = async () => {
            if (!formData.subjects || formData.subjects.length === 0) {
                setQuestionGroups([]);
                return;
            }

            try {
                const subjectIds = formData.subjects.map(s => s.value).join(',');
                const res = await fetch(`/api/question-groups?subjects=${subjectIds}`).then(r => r.json());
                if (res.success) {
                    setQuestionGroups(res.data.map(qg => ({
                        value: qg._id,
                        label: `${qg.name} (${qg.questionCount || 0} questions)`
                    })));
                } else {
                    setQuestionGroups([]);
                }
            } catch (error) {
                setQuestionGroups([]);
            }
        };
        fetchQuestionGroups();
    }, [formData.subjects]);

    // Initialize data if editing
    useEffect(() => {
        if (initialData) {
            const toLocalISOString = (dateString) => {
                if (!dateString) return '';
                // Create date and adjust for timezone offset to get local time
                const date = new Date(dateString);
                // Subtract the timezone offset to get local time
                const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
                const pad = (n) => n < 10 ? '0' + n : n;
                return `${localDate.getUTCFullYear()}-${pad(localDate.getUTCMonth() + 1)}-${pad(localDate.getUTCDate())}T${pad(localDate.getUTCHours())}:${pad(localDate.getUTCMinutes())}`;
            };

            const newFormData = {
                name: initialData.name || '',
                category: initialData.category ? { value: initialData.category._id, label: initialData.category.name } : null,
                subjects: initialData.subjects ? initialData.subjects.map(s => ({ value: s._id, label: s.name })) : [],
                questionGroups: initialData.questionGroups ? initialData.questionGroups.map(qg => ({
                    value: typeof qg === 'object' ? qg._id : qg,
                    label: typeof qg === 'object' ? qg.name : qg
                })) : [],
                type: initialData.type || type,
                startDate: toLocalISOString(initialData.startDate),
                duration: initialData.duration || 60,
                endDate: toLocalISOString(initialData.endDate),
                description: initialData.description || '',
                instructions: initialData.instructions || '',
                totalMarks: initialData.totalMarks || 0,
                passingPercentage: initialData.passingPercentage || 35,
                maxAttempts: initialData.maxAttempts ?? -1,
                status: initialData.status || 'active',
                settings: {
                    allowMic: initialData.settings?.allowMic || false,
                    allowCam: initialData.settings?.allowCam || false,
                    allowScreenShare: initialData.settings?.allowScreenShare || false,
                    allowCaptureId: initialData.settings?.allowCaptureId || false,
                    allowCaptureFace: initialData.settings?.allowCaptureFace || false,
                    allowTabSwitch: initialData.settings?.allowTabSwitch || false,
                    maxTabSwitches: initialData.settings?.maxTabSwitches ?? 3,
                    allowCopyPaste: initialData.settings?.allowCopyPaste || false,
                    watermark: {
                        enabled: initialData.settings?.watermark?.enabled ?? true,
                        text: initialData.settings?.watermark?.text || '',
                        quantity: initialData.settings?.watermark?.quantity || 20,
                        fontSize: initialData.settings?.watermark?.fontSize || 24
                    },
                    faceVerification: {
                        enabled: initialData.settings?.faceVerification?.enabled || false,
                        required: initialData.settings?.faceVerification?.required || false,
                        intervalCheck: initialData.settings?.faceVerification?.intervalCheck || 0
                    },
                    identityVerification: {
                        enabled: initialData.settings?.identityVerification?.enabled || false,
                        required: initialData.settings?.identityVerification?.required || false,
                        useProfileImage: initialData.settings?.identityVerification?.useProfileImage ?? true
                    }
                }
            };

            setFormData(newFormData);
        }
    }, [initialData, type]);

    // Auto-calculate End Date for Live Exams
    useEffect(() => {
        if (type === 'live' && formData.startDate && formData.duration) {
            const start = new Date(formData.startDate);
            const end = new Date(start.getTime() + formData.duration * 60000);

            // Format to datetime-local string: YYYY-MM-DDTHH:mm
            const pad = (n) => n < 10 ? '0' + n : n;
            const endString = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}T${pad(end.getHours())}:${pad(end.getMinutes())}`;

            setFormData(prev => ({ ...prev, endDate: endString }));
        }
    }, [formData.startDate, formData.duration, type]);

    const handleChange = (e) => {
        const { name, value, type: inputType, checked } = e.target;

        if (name.startsWith('settings.watermark.')) {
            // Handle watermark settings
            const watermarkField = name.split('.')[2];
            setFormData(prev => ({
                ...prev,
                settings: {
                    ...prev.settings,
                    watermark: {
                        ...prev.settings.watermark,
                        [watermarkField]: inputType === 'checkbox' ? checked : (inputType === 'number' ? Number(value) : value)
                    }
                }
            }));
        } else if (name.startsWith('settings.faceVerification.')) {
            // Handle face verification settings
            const field = name.split('.')[2];
            setFormData(prev => ({
                ...prev,
                settings: {
                    ...prev.settings,
                    faceVerification: {
                        ...prev.settings.faceVerification,
                        [field]: inputType === 'checkbox' ? checked : (inputType === 'number' ? Number(value) : value)
                    }
                }
            }));
        } else if (name.startsWith('settings.identityVerification.')) {
            // Handle identity verification settings
            const field = name.split('.')[2];
            setFormData(prev => ({
                ...prev,
                settings: {
                    ...prev.settings,
                    identityVerification: {
                        ...prev.settings.identityVerification,
                        [field]: inputType === 'checkbox' ? checked : value
                    }
                }
            }));
        } else if (name.startsWith('settings.')) {
            const settingName = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                settings: {
                    ...prev.settings,
                    [settingName]: inputType === 'checkbox' ? checked : (inputType === 'number' ? Number(value) : value)
                }
            }));
        } else {
            // Convert number inputs to actual numbers
            let processedValue = value;
            if (inputType === 'number') {
                processedValue = value === '' ? '' : Number(value);
            }

            setFormData(prev => ({
                ...prev,
                [name]: inputType === 'checkbox' ? checked : processedValue
            }));
        }
    };

    const handleSelectChange = (field, selectedOption) => {
        // If category is changed, clear the subjects
        if (field === 'category') {
            setFormData(prev => ({
                ...prev,
                category: selectedOption,
                subjects: [], // Clear subjects when category changes
                questionGroups: [] // Clear question groups when category changes
            }));
        } else if (field === 'subjects') {
            setFormData(prev => ({
                ...prev,
                subjects: selectedOption,
                questionGroups: [] // Clear question groups when subjects change
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: selectedOption
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Convert datetime-local strings to proper UTC dates for server
            const convertToUTC = (datetimeLocalString) => {
                if (!datetimeLocalString) return '';
                // The datetime-local input gives us a string like "2025-12-10T10:00"
                // We need to treat this as local time and convert to UTC
                const localDate = new Date(datetimeLocalString);
                return localDate.toISOString();
            };

            // Prepare payload and ensure number fields are numbers
            const payload = {
                ...formData,
                category: formData.category?.value,
                subjects: formData.subjects.map(s => s.value),
                questionGroups: formData.questionGroups.map(qg => qg.value),
                duration: Number(formData.duration),
                totalMarks: Number(formData.totalMarks),
                passingPercentage: Number(formData.passingPercentage),
                maxAttempts: Number(formData.maxAttempts),
                startDate: convertToUTC(formData.startDate),
                endDate: convertToUTC(formData.endDate)
            };

            const url = initialData ? `/api/exams/${initialData._id}` : '/api/exams';
            const method = initialData ? 'PUT' : 'POST';

            console.log('Debugging Payload:', JSON.stringify(payload, null, 2));

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                toast.success(`Exam ${initialData ? 'updated' : 'created'} successfully`);
                router.push('/exam');
            } else {
                toast.error(data.error || `Failed to ${initialData ? 'update' : 'create'} exam`);
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };



    return (
        <form onSubmit={handleSubmit} className="row g-4">
            {/* Left Column (80%) */}
            <div className="col-lg-9">
                <div className="card">
                    <div className="card-body">
                        <h5 className="card-title mb-4">Exam Details</h5>

                        <div className="mb-3">
                            <label className="form-label">Exam Name <span className="text-danger">*</span></label>
                            <input
                                type="text"
                                className="form-control"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="row mb-3">
                            <div className="col-md-6">
                                <label className="form-label">Category <span className="text-danger">*</span></label>
                                <Select
                                    options={categories}
                                    value={formData.category}
                                    onChange={(val) => handleSelectChange('category', val)}
                                    placeholder="Select Category"
                                    required
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Subjects <span className="text-danger">*</span></label>
                                <Select
                                    isMulti
                                    options={subjects}
                                    value={formData.subjects}
                                    onChange={(val) => handleSelectChange('subjects', val)}
                                    placeholder="Select Subjects"
                                />
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Question Groups <span className="text-danger">*</span></label>
                            <Select
                                isMulti
                                options={questionGroups}
                                value={formData.questionGroups}
                                onChange={(val) => handleSelectChange('questionGroups', val)}
                                placeholder="Select Question Groups"
                                isDisabled={!formData.subjects || formData.subjects.length === 0}
                            />
                            <small className="text-muted">
                                {!formData.subjects || formData.subjects.length === 0
                                    ? 'Please select subjects first to see available question groups'
                                    : `${questionGroups.length} question group(s) available for selected subjects`
                                }
                            </small>
                        </div>

                        <div className="row mb-3">
                            <div className="col-md-4">
                                <label className="form-label">Start Date & Time <span className="text-danger">*</span></label>
                                <input
                                    type="datetime-local"
                                    className="form-control"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    min={type === 'live' ? minDateTime : undefined}
                                    required
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">Duration (minutes) <span className="text-danger">*</span></label>
                                <input
                                    type="number"
                                    className="form-control"
                                    name="duration"
                                    value={formData.duration}
                                    onChange={handleChange}
                                    min="1"
                                    required
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">End Date & Time <span className="text-danger">*</span></label>
                                <input
                                    type="datetime-local"
                                    className="form-control"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    readOnly={type === 'live'}
                                    required
                                />
                                {type === 'live' && <small className="text-muted">Auto-calculated for Live Exam</small>}
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Description</label>
                            <textarea
                                className="form-control"
                                name="description"
                                rows="4"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Enter exam description..."
                            ></textarea>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Instructions</label>
                            <textarea
                                className="form-control"
                                name="instructions"
                                rows="4"
                                value={formData.instructions}
                                onChange={handleChange}
                                placeholder="Enter exam instructions..."
                            ></textarea>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column (20%) */}
            <div className="col-lg-3">
                <div className="card mb-3">
                    <div className="card-body">
                        <h5 className="card-title mb-3">Settings</h5>

                        <div className="mb-3">
                            <label className="form-label">Status</label>
                            <select
                                className="form-select"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Total Marks <span className="text-danger">*</span></label>
                            <input
                                type="number"
                                className="form-control"
                                name="totalMarks"
                                value={formData.totalMarks}
                                onChange={handleChange}
                                min="0"
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Passing % <span className="text-danger">*</span></label>
                            <input
                                type="number"
                                className="form-control"
                                name="passingPercentage"
                                value={formData.passingPercentage}
                                onChange={handleChange}
                                min="0"
                                max="100"
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Max Attempts <span className="text-danger">*</span></label>
                            <select
                                className="form-select mb-2"
                                name="maxAttempts"
                                value={formData.maxAttempts}
                                onChange={handleChange}
                                required
                            >
                                <option value="-1">Unlimited</option>
                                <option value="1">1 Attempt</option>
                                <option value="2">2 Attempts</option>
                                <option value="3">3 Attempts</option>
                                <option value="5">5 Attempts</option>
                                <option value="10">10 Attempts</option>
                                <option value="20">20 Attempts</option>
                                <option value="50">50 Attempts</option>
                                <option value="100">100 Attempts</option>
                            </select>
                            <small className="text-muted">
                                {formData.maxAttempts === -1 || formData.maxAttempts === '-1'
                                    ? 'Students can attempt this exam unlimited times'
                                    : `Students can attempt this exam ${formData.maxAttempts} time${formData.maxAttempts > 1 ? 's' : ''}`
                                }
                            </small>
                        </div>

                        {/* Settings removed as requested */}
                    </div>
                </div>

                <div className="d-grid gap-2 mt-3">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Saving...' : <><FiSave className="me-1" /> Save Exam</>}
                    </button>
                    <Link href="/exam" className="btn btn-outline-secondary">
                        <FiArrowLeft className="me-1" /> Cancel
                    </Link>
                </div>
            </div>
        </form>
    );
};

export default ExamForm;
