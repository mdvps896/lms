'use client';
import { useState } from 'react';
import { FiX, FiVideo, FiFileText, FiImage, FiChevronDown, FiChevronUp, FiUsers, FiClock, FiTag, FiDollarSign } from 'react-icons/fi';

export default function CourseViewModal({ course, onClose }) {
    // Accordion State: Track which topic index is open
    const [openTopicIndex, setOpenTopicIndex] = useState(0);

    const toggleTopic = (index) => {
        setOpenTopicIndex(openTopicIndex === index ? null : index);
    };

    if (!course) return null;

    // Calculate basic stats
    const totalLectures = course.curriculum?.reduce((acc, topic) => acc + topic.lectures.length, 0) || 0;

    // Use real student count from API
    const enrolledStudents = course.studentCount || 0;

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', overflowY: 'auto' }}>
            <div className="modal-dialog modal-dialog-centered modal-xl">
                <div className="modal-content border-0 shadow-lg">

                    {/* Header */}
                    <div className="modal-header bg-primary text-white border-0">
                        <div className="d-flex flex-column">
                            <h5 className="modal-title fw-bold text-white mb-1">{course.title}</h5>
                            <div className="d-flex align-items-center gap-2">
                                <span className="badge bg-white text-primary">
                                    {course.category?.name || 'Global'}
                                </span>
                                {course.isActive ? (
                                    <span className="badge bg-success-subtle text-success border border-success-subtle">Active</span>
                                ) : (
                                    <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">Inactive</span>
                                )}
                            </div>
                        </div>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
                    </div>

                    <div className="modal-body p-0">
                        <div className="row g-0">

                            {/* Left Column: Overview & Stats */}
                            <div className="col-lg-4 bg-light border-end">
                                <div className="p-4">
                                    {/* Thumbnail */}
                                    <div className="mb-4 rounded-3 overflow-hidden shadow-sm position-relative" style={{ aspectRatio: '16/9' }}>
                                        <img
                                            src={course.thumbnail}
                                            alt={course.title}
                                            className="w-100 h-100 object-fit-cover"
                                            onError={(e) => e.target.src = 'https://via.placeholder.com/600x400?text=No+Thumbnail'}
                                        />
                                        {course.isFree && (
                                            <div className="position-absolute top-0 end-0 m-3 badge bg-success shadow">Free Course</div>
                                        )}
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="row g-3 mb-4">
                                        <div className="col-6">
                                            <div className="p-3 bg-white rounded shadow-sm text-center h-100">
                                                <FiUsers className="text-primary fs-4 mb-2" />
                                                <h6 className="mb-0 fw-bold">{enrolledStudents}</h6>
                                                <small className="text-muted">Students</small>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="p-3 bg-white rounded shadow-sm text-center h-100">
                                                <FiVideo className="text-info fs-4 mb-2" />
                                                <h6 className="mb-0 fw-bold">{totalLectures}</h6>
                                                <small className="text-muted">Lectures</small>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details List */}
                                    <ul className="list-group list-group-flush rounded shadow-sm">
                                        <li className="list-group-item d-flex justify-content-between align-items-center bg-white">
                                            <span><FiClock className="me-2 text-muted" /> Duration</span>
                                            <span className="fw-medium">{course.duration?.value} {course.duration?.unit}</span>
                                        </li>
                                        <li className="list-group-item d-flex justify-content-between align-items-center bg-white">
                                            <span><FiDollarSign className="me-2 text-muted" /> Price</span>
                                            <span className="fw-medium">
                                                {course.isFree ? <span className="text-success">Free</span> : (
                                                    <div>
                                                        <span className="text-decoration-line-through text-muted small me-2">₹{course.originalPrice}</span>
                                                        <span className="text-primary fw-bold">₹{course.price}</span>
                                                    </div>
                                                )}
                                            </span>
                                        </li>
                                        <li className="list-group-item bg-white">
                                            <div className="d-flex align-items-start">
                                                <FiTag className="me-2 mt-1 text-muted" />
                                                <div>
                                                    <div className="mb-1">Subjects</div>
                                                    <div className="d-flex flex-wrap gap-1">
                                                        {course.subjects && course.subjects.length > 0 ? (
                                                            course.subjects.map((sub, i) => (
                                                                <span key={i} className="badge bg-light text-dark border">
                                                                    {sub.name || 'Unnamed Subject'}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-muted small">All Subjects</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Right Column: Curriculum Accordion */}
                            <div className="col-lg-8">
                                <div className="p-4 h-100 overflow-auto" style={{ maxHeight: '80vh' }}>
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h5 className="mb-0 fw-bold text-dark">Course Curriculum</h5>
                                        <span className="text-muted small">{course.curriculum?.length || 0} Topics</span>
                                    </div>

                                    {(!course.curriculum || course.curriculum.length === 0) ? (
                                        <div className="text-center py-5 text-muted bg-light rounded-3 border border-dashed">
                                            <div className="mb-2">📭</div>
                                            No curriculum content added yet.
                                        </div>
                                    ) : (
                                        <div className="accordion" id="courseAccordion">
                                            {course.curriculum.map((topic, index) => (
                                                <div className="accordion-item border mb-3 rounded overflow-hidden shadow-sm" key={index}>
                                                    <h2 className="accordion-header">
                                                        <button
                                                            className={`accordion-button ${openTopicIndex !== index ? 'collapsed' : ''} bg-white fw-semibold`}
                                                            type="button"
                                                            onClick={() => toggleTopic(index)}
                                                            aria-expanded={openTopicIndex === index}
                                                        >
                                                            <span className="me-2 text-primary">{index + 1}.</span> {topic.title}
                                                            <span className="ms-auto badge bg-light text-secondary rounded-pill fw-normal">
                                                                {topic.lectures.length} lectures
                                                            </span>
                                                        </button>
                                                    </h2>
                                                    <div className={`accordion-collapse collapse ${openTopicIndex === index ? 'show' : ''}`}>
                                                        <div className="accordion-body p-0">
                                                            <ul className="list-group list-group-flush">
                                                                {topic.lectures.length === 0 ? (
                                                                    <li className="list-group-item text-muted small fst-italic p-3">No lectures in this topic.</li>
                                                                ) : (
                                                                    topic.lectures.map((lecture, lIndex) => (
                                                                        <li key={lIndex} className="list-group-item d-flex align-items-center py-3 px-4 border-bottom-0 hover-bg-light">
                                                                            <div className="me-3">
                                                                                {/* Type Icon */}
                                                                                <div className={`rounded-circle d-flex align-items-center justify-content-center ${lecture.type === 'video' ? 'bg-danger-subtle text-danger' :
                                                                                    lecture.type === 'pdf' ? 'bg-primary-subtle text-primary' :
                                                                                        'bg-warning-subtle text-warning'
                                                                                    }`} style={{ width: '36px', height: '36px' }}>
                                                                                    {lecture.type === 'video' && <FiVideo size={16} />}
                                                                                    {lecture.type === 'pdf' && <FiFileText size={16} />}
                                                                                    {lecture.type === 'image' && <FiImage size={16} />}
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex-grow-1">
                                                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                                                    <span className="fw-medium text-dark">{lecture.title}</span>
                                                                                    {lecture.isDemo && (
                                                                                        <span className="badge bg-info-subtle text-info border border-info-subtle" style={{ fontSize: '0.65rem' }}>Free Preview</span>
                                                                                    )}
                                                                                </div>

                                                                                {/* Content Link/Preview */}
                                                                                <div className="text-muted small text-truncate" style={{ maxWidth: '400px' }}>
                                                                                    {lecture.type}: <a href={lecture.content} target="_blank" rel="noopener noreferrer" className="text-decoration-none text-muted">{lecture.content}</a>
                                                                                </div>
                                                                            </div>
                                                                        </li>
                                                                    ))
                                                                )}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
