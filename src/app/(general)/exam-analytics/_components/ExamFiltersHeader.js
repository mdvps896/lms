'use client'

// Header with title, search box, status/subject filters and result count.
export default function ExamFiltersHeader({
    selectedExam,
    exams,
    filteredExams,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    subjectFilter,
    setSubjectFilter
}) {
    return (
        <div className="row mb-4">
            <div className="col-12">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <h2 className="mb-1">Exam Analytics Dashboard</h2>
                        <p className="text-muted mb-0">
                            {selectedExam ? `Analytics for ${selectedExam.title}` : 'Comprehensive exam performance analysis and insights'}
                        </p>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="d-flex flex-wrap gap-3 align-items-center">
                    {/* Search */}
                    <div className="position-relative">
                        <i className="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                        <input
                            type="text"
                            className="form-control ps-5"
                            placeholder="Search exams..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '250px' }}
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        className="form-select"
                        style={{ width: 'auto' }}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                    </select>

                    {/* Subject Filter */}
                    <select
                        className="form-select"
                        style={{ width: 'auto' }}
                        value={subjectFilter}
                        onChange={(e) => setSubjectFilter(e.target.value)}
                    >
                        <option value="all">All Subjects</option>
                        {[...new Set(exams.map(exam => exam.subject))].map(subject => (
                            <option key={subject} value={subject}>{subject}</option>
                        ))}
                    </select>

                    {/* Results Count */}
                    <span className="text-muted ms-auto">
                        Showing {filteredExams.length} of {exams.length} exams
                    </span>
                </div>
            </div>
        </div>
    );
}
