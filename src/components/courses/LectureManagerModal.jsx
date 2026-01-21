'use client';
import { useState } from 'react';
import { FiTrash2, FiVideo, FiImage, FiFileText, FiPlus, FiChevronDown, FiChevronUp } from 'react-icons/fi';

export default function LectureManagerModal({ course, onClose, onUpdate }) {
    const [curriculum, setCurriculum] = useState(course.curriculum || []);
    const [saving, setSaving] = useState(false);
    const [activeTopicIndex, setActiveTopicIndex] = useState(null); // Used for adding lecture
    const [openTopicIndex, setOpenTopicIndex] = useState(null); // Accordion state
    const [isLectureFormOpen, setIsLectureFormOpen] = useState(false);
    const [uploading, setUploading] = useState(false);

    // New Lecture Form State
    const [lectureForm, setLectureForm] = useState({
        title: '',
        type: 'video',
        content: '',
        isDemo: false
    });
    // Store file temporarily
    const [lectureFile, setLectureFile] = useState(null);

    const handleAddTopic = () => {
        const topicName = prompt('Enter Topic Name:');
        if (topicName) {
            const newCurriculum = [...curriculum, { title: topicName, lectures: [] }];
            setCurriculum(newCurriculum);
            setOpenTopicIndex(newCurriculum.length - 1); // Auto-open new topic
        }
    };

    const handleDeleteTopic = (index, e) => {
        e.stopPropagation(); // Prevent accordion toggle
        if (confirm('Delete this topic and all its lectures?')) {
            const newCurriculum = [...curriculum];
            newCurriculum.splice(index, 1);
            setCurriculum(newCurriculum);
            if (openTopicIndex === index) setOpenTopicIndex(null);
        }
    };

    const handleOpenLectureForm = (topicIndex, e) => {
        e.stopPropagation(); // Prevent accordion toggle
        setActiveTopicIndex(topicIndex);
        setLectureForm({ title: '', type: 'video', content: '', isDemo: false });
        setLectureFile(null); // Reset file
        setIsLectureFormOpen(true);
    };

    const toggleTopic = (index) => {
        setOpenTopicIndex(openTopicIndex === index ? null : index);
    };

    const uploadFile = async (file, folder) => {
        const data = new FormData();
        data.append('file', file);
        data.append('folder', folder);
        data.append('field', 'lectureContent');

        try {
            const res = await fetch('/api/storage/upload', {
                method: 'POST',
                body: data,
            });

            // Check if response is JSON
            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await res.text();
                throw new Error(`Server returned non-JSON response. Status: ${res.status}. Response: ${text.substring(0, 200)}`);
            }

            const result = await res.json();

            if (!result.success) {
                throw new Error(result.message || 'Upload failed');
            }

            return result.path || result.url;
        } catch (error) {
            throw error;
        }
    };

    const handleSaveLecture = async (e) => {
        e.preventDefault();

        if (!lectureForm.content && !lectureFile) {
            alert('Please provide a Content URL or Upload a File.');
            return;
        }

        setUploading(true);
        try {
            let finalContentUrl = lectureForm.content;

            if (lectureFile) {
                let folder = 'courses/lectures/others';
                if (lectureForm.type === 'video') folder = 'courses/lectures/videos';
                if (lectureForm.type === 'image') folder = 'courses/lectures/images';
                if (lectureForm.type === 'pdf') folder = 'courses/lectures/pdfs';

                finalContentUrl = await uploadFile(lectureFile, folder);
            }

            const newLecture = {
                ...lectureForm,
                content: finalContentUrl
            };

            const newCurriculum = [...curriculum];
            newCurriculum[activeTopicIndex].lectures.push(newLecture);
            setCurriculum(newCurriculum);
            setOpenTopicIndex(activeTopicIndex); // Ensure topic is open
            setIsLectureFormOpen(false);
        } catch (error) {
            console.error(error);
            alert(`Failed to add lecture: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteLecture = (topicIndex, lectureIndex) => {
        if (confirm('Delete this lecture?')) {
            const newCurriculum = [...curriculum];
            newCurriculum[topicIndex].lectures.splice(lectureIndex, 1);
            setCurriculum(newCurriculum);
        }
    };

    const handleSaveAll = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/courses/${course._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ curriculum })
            });
            const data = await res.json();
            if (data.success) {
                onUpdate();
                onClose();
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className={`modal-dialog modal-dialog-centered ${isLectureFormOpen ? '' : 'modal-xl'}`} style={{ transition: 'all 0.3s' }}>
                {!isLectureFormOpen && (
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Manage Curriculum: {course.title}</h5>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>

                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            <div className="d-flex justify-content-end mb-3">
                                <button type="button" onClick={handleAddTopic} className="btn btn-primary btn-sm">
                                    <FiPlus className="me-1" /> Add New Topic
                                </button>
                            </div>

                            <div className="accordion" id="curriculumAccordion">
                                {curriculum.length === 0 && <div className="text-center text-muted py-5 border border-dashed rounded">No topics yet. Click "Add New Topic" to start.</div>}

                                {curriculum.map((topic, tIndex) => (
                                    <div key={tIndex} className="accordion-item border mb-2 rounded overflow-hidden">
                                        <h2 className="accordion-header position-relative">
                                            <button
                                                className={`accordion-button ${openTopicIndex !== tIndex ? 'collapsed' : ''} bg-light py-2`}
                                                type="button"
                                                onClick={() => toggleTopic(tIndex)}
                                                style={{ paddingRight: '120px' }} // Make space for buttons
                                            >
                                                <span className="fw-semibold text-dark">{topic.title}</span>
                                                <span className="badge bg-secondary ms-2 rounded-pill small fw-normal">{topic.lectures.length} Lectures</span>
                                            </button>

                                            {/* Action Buttons in Header */}
                                            <div className="position-absolute end-0 top-50 translate-middle-y me-2" style={{ zIndex: 5 }}>
                                                <button
                                                    onClick={(e) => handleOpenLectureForm(tIndex, e)}
                                                    className="btn btn-sm btn-outline-primary py-0 me-2"
                                                    title="Add Lecture"
                                                >
                                                    <FiPlus />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteTopic(tIndex, e)}
                                                    className="btn btn-sm text-danger py-0"
                                                    title="Delete Topic"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </h2>

                                        <div className={`accordion-collapse collapse ${openTopicIndex === tIndex ? 'show' : ''}`}>
                                            <div className="accordion-body p-0">
                                                {topic.lectures.length === 0 ? (
                                                    <div className="text-center text-muted py-3 fst-italic small">
                                                        No lectures added yet.
                                                    </div>
                                                ) : (
                                                    <ul className="list-group list-group-flush">
                                                        {topic.lectures.map((lecture, lIndex) => (
                                                            <li key={lIndex} className="list-group-item d-flex align-items-center p-2 border-bottom-0 hover-bg-light">
                                                                <div className="me-3 d-flex align-items-center justify-content-center bg-soft-primary rounded text-primary" style={{ width: '32px', height: '32px' }}>
                                                                    {lecture.type === 'video' && <FiVideo />}
                                                                    {lecture.type === 'pdf' && <FiFileText />}
                                                                    {lecture.type === 'image' && <FiImage />}
                                                                </div>
                                                                <div className="flex-grow-1">
                                                                    <div className="fw-semibold small">{lecture.title}</div>
                                                                    <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                                                                        {lecture.type.toUpperCase()} • {lecture.isDemo ? <span className="text-success">Demo</span> : 'Locked'}
                                                                    </div>
                                                                    <div className="text-truncate text-muted small" style={{ maxWidth: '300px', fontSize: '0.75rem' }}>
                                                                        {lecture.content}
                                                                    </div>
                                                                </div>
                                                                <button onClick={() => handleDeleteLecture(tIndex, lIndex)} className="btn btn-sm text-danger">
                                                                    <FiTrash2 />
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSaveAll} disabled={saving}>
                                {saving ? 'Saving...' : 'Save All Changes'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Sub-modal/Form for Adding Lecture */}
                {isLectureFormOpen && (
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Add Lecture</h5>
                            <button className="btn-close" onClick={() => setIsLectureFormOpen(false)}></button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSaveLecture}>
                                <div className="mb-3">
                                    <label className="form-label">Lecture Title <span className="text-danger">*</span></label>
                                    <input className="form-control" required value={lectureForm.title} onChange={e => setLectureForm({ ...lectureForm, title: e.target.value })} />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Type</label>
                                    <select className="form-select" value={lectureForm.type} onChange={e => setLectureForm({ ...lectureForm, type: e.target.value })}>
                                        <option value="video">Video</option>
                                        <option value="image">Image</option>
                                        <option value="pdf">PDF</option>
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Content (Upload or URL) <span className="text-danger">*</span></label>

                                    <div className="d-flex flex-column gap-2">
                                        {/* File Upload Input */}
                                        <input
                                            type="file"
                                            className="form-control"
                                            accept={lectureForm.type === 'image' ? 'image/*' : lectureForm.type === 'video' ? 'video/*' : '.pdf'}
                                            onChange={(e) => setLectureFile(e.target.files[0])}
                                        />

                                        <div className="text-center text-muted small">- OR -</div>

                                        {/* URL Input */}
                                        <input
                                            className="form-control"
                                            type="url"
                                            value={lectureForm.content}
                                            onChange={e => setLectureForm({ ...lectureForm, content: e.target.value })}
                                            placeholder="Enter URL directly (e.g. YouTube link)"
                                            disabled={!!lectureFile} // Disable if file selected
                                        />
                                    </div>
                                    {lectureFile && <small className="text-success mt-1 d-block">Selected: {lectureFile.name}</small>}
                                </div>
                                <div className="mb-3">
                                    <div className="form-check form-switch">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={lectureForm.isDemo}
                                            onChange={() => setLectureForm({ ...lectureForm, isDemo: !lectureForm.isDemo })}
                                        />
                                        <label className="form-check-label">Make as Free Preview (Demo)</label>
                                    </div>
                                </div>
                                <div className="text-end">
                                    <button type="button" className="btn btn-light me-2" onClick={() => setIsLectureFormOpen(false)}>Back</button>
                                    <button type="submit" className="btn btn-primary" disabled={uploading}>
                                        {uploading ? 'Uploading...' : 'Add Lecture'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
