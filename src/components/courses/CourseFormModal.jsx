'use client';
import { useState, useEffect } from 'react';
import Select from 'react-select';

export default function CourseFormModal({ course, onClose, onSave }) {
    const [categories, setCategories] = useState([]);
    const [allSubjects, setAllSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // File states
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [demoVideoFile, setDemoVideoFile] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        category: '',
        subjects: [],
        durationValue: 1,
        durationUnit: 'months',
        thumbnail: '',     // Will store the final URL
        demoVideo: '',     // Will store the final URL
        price: 0,
        originalPrice: 0,
        isFree: false,
        gstEnabled: false,
        gstPercentage: 18,
        description: '',
        hasCertificate: false,
        language: 'English'
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catRes, subRes] = await Promise.all([
                    fetch('/api/categories'),
                    fetch('/api/subjects')
                ]);
                const catData = await catRes.json();
                const subData = await subRes.json();

                setCategories(catData.data || catData || []);
                setAllSubjects(subData.data || subData || []);

                if (course) {
                    setFormData({
                        title: course.title || '',
                        category: course.category?._id || course.category || '',
                        subjects: course.subjects ? course.subjects.map(s => (typeof s === 'object' ? s._id : s)) : [],
                        durationValue: course.duration?.value || 1,
                        durationUnit: course.duration?.unit || 'months',
                        thumbnail: course.thumbnail || '',
                        demoVideo: course.demoVideo || '',
                        price: course.price || 0,
                        originalPrice: course.originalPrice || 0,
                        isFree: course.isFree || false,
                        gstEnabled: course.gstEnabled || false,
                        gstPercentage: course.gstPercentage || 18,
                        description: course.description || '',
                        hasCertificate: course.hasCertificate || false,
                        language: course.language || 'English'
                    });
                }
            } catch (err) {
                // Silent error or toast
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [course]);

    const filteredSubjectOptions = formData.category
        ? allSubjects
            .filter(sub => {
                const subCatId = typeof sub.category === 'object' ? sub.category?._id : sub.category;
                return subCatId === formData.category;
            })
            .map(sub => ({ value: sub._id, label: sub.name }))
        : [];

    const selectedSubjectOptions = filteredSubjectOptions.filter(opt =>
        formData.subjects.includes(opt.value)
    );

    const uploadFile = async (file, folder) => {
        const data = new FormData();
        data.append('file', file);
        data.append('folder', folder);

        const res = await fetch('/api/storage/upload', {
            method: 'POST',
            body: data,
        });
        const result = await res.json();
        if (!result.success) throw new Error(result.message || 'Upload failed');
        return result.path; // The URL
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let thumbnailUrl = formData.thumbnail;
            let demoVideoUrl = formData.demoVideo;

            // 1. Upload Thumbnail if selected
            if (thumbnailFile) {
                thumbnailUrl = await uploadFile(thumbnailFile, 'courses/thumbnails');
            }

            // 2. Upload Video if selected
            if (demoVideoFile) {
                demoVideoUrl = await uploadFile(demoVideoFile, 'courses/videos');
            }

            // Validate requirements
            if (!thumbnailUrl) {
                alert('Thumbnail is required (via URL or Upload)');
                setSubmitting(false);
                return;
            }

            const payload = {
                ...formData,
                thumbnail: thumbnailUrl,
                demoVideo: demoVideoUrl,
                category: formData.category || null,
                subjects: formData.subjects,
                duration: {
                    value: Number(formData.durationValue),
                    unit: formData.durationUnit
                },
                price: formData.isFree ? 0 : Number(formData.price),
                originalPrice: formData.isFree ? 0 : Number(formData.originalPrice),
            };

            // Validate course ID for edit mode
            if (course && !course._id) {
                alert('Error: Course ID is missing. Cannot update course.');
                setSubmitting(false);
                return;
            }

            const url = course ? `/api/courses/${course._id}` : '/api/courses';
            const method = course ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                onSave();
            } else {
                alert(`Error: ${data.error || 'Something went wrong while saving the course.'}`);
            }
        } catch (err) {
            alert(`Error processing request: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    // Helper to get preview URL
    const getThumbnailPreview = () => {
        if (thumbnailFile) return URL.createObjectURL(thumbnailFile);
        if (formData.thumbnail) return formData.thumbnail;
        return null;
    };

    const getVideoPreview = () => {
        if (demoVideoFile) return URL.createObjectURL(demoVideoFile);
        if (formData.demoVideo) return formData.demoVideo;
        return null;
    };

    // Check if URL is a YouTube URL
    const isYouTubeUrl = (url) => {
        if (!url) return false;
        return url.includes('youtube.com') || url.includes('youtu.be');
    };

    // Convert YouTube URL to embed URL
    const getYouTubeEmbedUrl = (url) => {
        if (!url) return '';

        // Handle youtube.com/watch?v=VIDEO_ID
        if (url.includes('youtube.com/watch')) {
            const videoId = url.split('v=')[1]?.split('&')[0];
            return `https://www.youtube.com/embed/${videoId}`;
        }

        // Handle youtu.be/VIDEO_ID
        if (url.includes('youtu.be/')) {
            const videoId = url.split('youtu.be/')[1]?.split('?')[0];
            return `https://www.youtube.com/embed/${videoId}`;
        }

        // If already embed URL, return as is
        if (url.includes('youtube.com/embed/')) {
            return url;
        }

        return url;
    };

    if (loading) return null;

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', overflowY: 'auto' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{course ? 'Edit Course' : 'Create New Course'}</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label">Course Title <span className="text-danger">*</span></label>
                                <input
                                    className="form-control"
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Complete Web Development Bootcamp"
                                />
                            </div>

                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Category</label>
                                    <select
                                        className="form-select"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value, subjects: [] })}
                                    >
                                        <option value="">All Categories (Global Course)</option>
                                        {categories.map(cat => (
                                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {formData.category && (
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Subjects (Select Multiple)</label>
                                        <Select
                                            isMulti
                                            options={filteredSubjectOptions}
                                            value={selectedSubjectOptions}
                                            onChange={(selected) => setFormData({ ...formData, subjects: selected.map(s => s.value) })}
                                            placeholder="Select subjects..."
                                            className="basic-multi-select"
                                            classNamePrefix="select"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Duration Value <span className="text-danger">*</span></label>
                                    <input
                                        className="form-control"
                                        type="number"
                                        min="1"
                                        required
                                        value={formData.durationValue}
                                        onChange={e => setFormData({ ...formData, durationValue: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Duration Unit</label>
                                    <select
                                        className="form-select"
                                        value={formData.durationUnit}
                                        onChange={e => setFormData({ ...formData, durationUnit: e.target.value })}
                                    >
                                        <option value="days">Days</option>
                                        <option value="months">Months</option>
                                        <option value="years">Years</option>
                                    </select>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-12 mb-3">
                                    <label className="form-label">Course Language</label>
                                    <select
                                        className="form-select"
                                        value={formData.language}
                                        onChange={e => setFormData({ ...formData, language: e.target.value })}
                                    >
                                        <option value="English">English</option>
                                        <option value="Hindi">Hindi</option>
                                        <option value="Marathi">Marathi</option>
                                        <option value="Gujarati">Gujarati</option>
                                        <option value="Tamil">Tamil</option>
                                        <option value="Telugu">Telugu</option>
                                        <option value="Kannada">Kannada</option>
                                        <option value="Bengali">Bengali</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-3">
                                <div className="form-check form-switch">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="flexSwitchCheckDefault"
                                        checked={formData.isFree}
                                        onChange={() => setFormData({ ...formData, isFree: !formData.isFree })}
                                    />
                                    <label className="form-check-label" htmlFor="flexSwitchCheckDefault">
                                        {formData.isFree ? 'Yes, this course is free' : 'No, this is a paid course'}
                                    </label>
                                </div>
                            </div>

                            {!formData.isFree && (
                                <>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Selling Price (Real Price) <span className="text-danger">*</span></label>
                                            <input
                                                className="form-control"
                                                type="number"
                                                min="0"
                                                required
                                                value={formData.price}
                                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Original Price (Discount Base)</label>
                                            <input
                                                className="form-control"
                                                type="number"
                                                min="0"
                                                value={formData.originalPrice}
                                                onChange={e => setFormData({ ...formData, originalPrice: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* GST Section */}
                                    <div className="mb-3">
                                        <div className="form-check form-switch">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id="gstSwitch"
                                                checked={formData.gstEnabled}
                                                onChange={() => setFormData({ ...formData, gstEnabled: !formData.gstEnabled })}
                                            />
                                            <label className="form-check-label" htmlFor="gstSwitch">
                                                Enable GST
                                            </label>
                                        </div>
                                    </div>

                                    {formData.gstEnabled && (
                                        <div className="mb-3">
                                            <label className="form-label">GST Percentage (%)</label>
                                            <input
                                                className="form-control"
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={formData.gstPercentage}
                                                onChange={e => setFormData({ ...formData, gstPercentage: e.target.value })}
                                            />
                                            <small className="text-muted">Default is 18%</small>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Description Field */}
                            <div className="mb-3">
                                <label className="form-label">About This Course</label>
                                <textarea
                                    className="form-control"
                                    rows="4"
                                    placeholder="Describe what students will learn in this course..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            {/* Certificate Checkbox */}
                            <div className="mb-3">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="certificateCheck"
                                        checked={formData.hasCertificate}
                                        onChange={() => setFormData({ ...formData, hasCertificate: !formData.hasCertificate })}
                                    />
                                    <label className="form-check-label" htmlFor="certificateCheck">
                                        Give certificate in this course
                                    </label>
                                </div>
                            </div>

                            {/* Thumbnail Section */}
                            <div className="mb-3">
                                <label className="form-label">Thumbnail <span className="text-danger">*</span></label>
                                <div className="d-flex gap-2 mb-2">
                                    <input
                                        type="file"
                                        className="form-control"
                                        accept="image/*"
                                        onChange={e => setThumbnailFile(e.target.files[0])}
                                    />
                                </div>
                                <input
                                    className="form-control"
                                    type="url"
                                    placeholder="Or enter Image URL"
                                    value={formData.thumbnail}
                                    onChange={e => setFormData({ ...formData, thumbnail: e.target.value })}
                                    disabled={!!thumbnailFile} // Disable URL input if file is selected
                                />
                                {thumbnailFile && <small className="text-muted">File selected: {thumbnailFile.name}</small>}

                                {getThumbnailPreview() && (
                                    <div className="mt-3 p-2 border rounded text-center bg-light">
                                        <p className="small text-muted mb-1">Preview</p>
                                        <img
                                            src={getThumbnailPreview()}
                                            alt="Thumbnail Preview"
                                            className="img-fluid rounded"
                                            style={{ maxHeight: '200px', objectFit: 'contain' }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Demo Video Section */}
                            <div className="mb-3">
                                <label className="form-label">Demo Video (Optional)</label>
                                <div className="d-flex gap-2 mb-2">
                                    <input
                                        type="file"
                                        className="form-control"
                                        accept="video/*"
                                        onChange={e => setDemoVideoFile(e.target.files[0])}
                                    />
                                </div>
                                <input
                                    className="form-control"
                                    type="url"
                                    placeholder="Or enter Video URL (YouTube, Vimeo, or direct link)"
                                    value={formData.demoVideo}
                                    onChange={e => setFormData({ ...formData, demoVideo: e.target.value })}
                                    disabled={!!demoVideoFile}
                                />
                                {demoVideoFile && <small className="text-muted">File selected: {demoVideoFile.name}</small>}
                                <small className="form-text text-muted d-block mt-1">
                                    💡 Tip: Paste YouTube URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID)
                                </small>

                                {getVideoPreview() && (
                                    <div className="mt-3 p-2 border rounded text-center bg-light">
                                        <p className="small text-muted mb-1">Preview</p>
                                        {isYouTubeUrl(formData.demoVideo) ? (
                                            <iframe
                                                width="100%"
                                                height="250"
                                                src={getYouTubeEmbedUrl(formData.demoVideo)}
                                                title="YouTube video preview"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                className="rounded"
                                            />
                                        ) : (
                                            <video
                                                src={getVideoPreview()}
                                                controls
                                                className="img-fluid rounded"
                                                style={{ maxHeight: '250px', maxWidth: '100%' }}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                {submitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Saving...
                                    </>
                                ) : 'Save Course'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
