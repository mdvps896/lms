'use client';
// Subject tab bar shown above the current question, extracted verbatim from page.js.
export default function SubjectTabs({ subjects, activeSection, onSectionChange }) {
    if (!(subjects?.length > 0)) return null;

    return (
        <div className="mb-3">
            <div className="subject-tabs mb-2" style={{ overflowX: 'auto', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch', paddingBottom: '5px' }}>
                <div className="btn-group" role="group">
                    {subjects.map(subject => (
                        <button
                            key={subject._id}
                            type="button"
                            className={`btn ${activeSection === subject._id ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => onSectionChange(subject._id)}
                        >
                            {subject.name}
                            <span className="badge bg-white text-primary ms-2 rounded-pill">
                                {subject.questionCount}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
