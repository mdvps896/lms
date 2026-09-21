'use client';
import Link from 'next/link';
import { FiArrowLeft, FiEdit2 } from 'react-icons/fi';
import CertificateGenerator from '@/components/certificates/CertificateGenerator';

// Top banner: back link, exam title, admin/teacher edit-marks controls and
// the certificate download button. Extracted verbatim from page.js.
const ResultHeader = ({
    exam,
    examId,
    user,
    attempt,
    settings,
    editMode,
    saving,
    isResultDraft,
    handleEditToggle,
    handleUpdateMarks
}) => {
    return (
        <div className="row mb-4">
            <div className="col-12">
                <div className="d-flex align-items-center justify-content-between bg-primary text-white p-4 rounded">
                    <div className="d-flex align-items-center">
                        <Link href={`/my-results/${examId}`} className="btn btn-light btn-sm me-3">
                            <FiArrowLeft className="me-2" />
                            Back to Results
                        </Link>
                        <div>
                            <h4 className="mb-1">{exam.title}</h4>
                            <p className="mb-0 opacity-75">Exam Result Details</p>
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        {(user?.role === 'admin' || user?.role === 'teacher') && (
                            <>
                                {attempt.resultStatus === 'draft' && (
                                    <span className="badge bg-warning text-dark px-3 py-2">
                                        <i className="feather-clock me-1"></i>
                                        Draft - Needs Evaluation
                                    </span>
                                )}
                                {attempt.resultStatus === 'published' && (
                                    <span className="badge bg-success px-3 py-2">
                                        <i className="feather-check-circle me-1"></i>
                                        Published
                                    </span>
                                )}
                                {!editMode ? (
                                    <button
                                        onClick={handleEditToggle}
                                        className="btn btn-light btn-sm"
                                    >
                                        <FiEdit2 className="me-2" />
                                        {attempt.resultStatus === 'draft' ? 'Evaluate & Publish' : 'Edit Marks'}
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleUpdateMarks}
                                            className="btn btn-success btn-sm"
                                            disabled={saving}
                                        >
                                            {saving ? 'Publishing...' : 'Update & Publish'}
                                        </button>
                                        <button
                                            onClick={handleEditToggle}
                                            className="btn btn-secondary btn-sm"
                                            disabled={saving}
                                        >
                                            Cancel
                                        </button>
                                    </>
                                )}
                            </>
                        )}
                        {/* Hide certificate download for students with draft results */}
                        {!isResultDraft && (
                            <CertificateGenerator
                                attempt={attempt}
                                exam={exam}
                                user={user}
                                settings={settings}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResultHeader;
