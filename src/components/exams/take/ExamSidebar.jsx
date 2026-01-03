'use client';
import React, { useState, useEffect } from 'react';
import { FiChevronDown, FiChevronUp, FiInfo } from 'react-icons/fi';

export default function ExamSidebar({
    questions,
    answers,
    markedForReview,
    currentQuestionIndex,
    onQuestionSelect,
    subjects,
    activeSection,
    onSectionChange,
    activeGroup,
    onGroupChange,
    user,
    onShowInstructions
}) {
    const [expandedGroups, setExpandedGroups] = useState({});

    const toggleGroup = (groupId) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    // Auto-expand current question's group
    useEffect(() => {
        const currentQuestion = questions[currentQuestionIndex];
        if (currentQuestion && currentQuestion.questionGroup) {
            const groupId = currentQuestion.questionGroup._id || currentQuestion.questionGroup;
            setExpandedGroups(prev => ({
                ...prev,
                [groupId]: true
            }));
        }
    }, [currentQuestionIndex, questions]);
    const getQuestionStatus = (question) => {
        const questionId = question._id;
        const hasAnswer = answers[questionId] !== undefined && answers[questionId] !== null && answers[questionId] !== '';
        const isMarked = markedForReview[questionId];

        if (hasAnswer && isMarked) return 'answered-marked';
        if (hasAnswer) return 'answered';
        if (isMarked) return 'marked';
        return 'not-answered';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'answered': return '#28a745';
            case 'not-answered': return '#dc3545';
            case 'marked': return '#6f42c1';
            case 'answered-marked': return '#17a2b8';
            default: return '#6c757d';
        }
    };

    const getStatusCount = (status, filteredQuestions = questions) => {
        return filteredQuestions.filter(q => getQuestionStatus(q) === status).length;
    };

    // Get unique groups from questions
    const getGroupsBySubject = (subjectId) => {
        const subjectQuestions = questions.filter(q => q.subject?._id === subjectId);
        const groups = {};
        subjectQuestions.forEach(q => {
            if (q.questionGroup) {
                const groupId = q.questionGroup._id || q.questionGroup;
                const groupName = q.questionGroup.name || q.questionGroup.title || `Group ${groupId}`;
                if (!groups[groupId]) {
                    groups[groupId] = {
                        _id: groupId,
                        name: groupName,
                        questions: []
                    };
                }
                groups[groupId].questions.push(q);
            }
        });
        return Object.values(groups);
    };

    // Filter questions based on selected subject and group
    let filteredQuestions = questions;
    if (activeSection) {
        filteredQuestions = questions.filter(q => q.subject?._id === activeSection);
        if (activeGroup) {
            filteredQuestions = filteredQuestions.filter(q =>
                (q.questionGroup?._id || q.questionGroup) === activeGroup
            );
        }
    }

    const groups = activeSection ? getGroupsBySubject(activeSection) : [];
    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="exam-sidebar" style={{
            width: '100%',
            height: '100%',
            background: 'white',
            borderLeft: '1px solid #dee2e6',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* User Profile - Mobile Only */}
            {user && (
                <div className="d-flex align-items-center p-3 border-bottom d-md-none bg-light">
                    <div className="bg-white rounded-circle d-flex align-items-center justify-content-center text-primary fw-bold me-3 border" style={{ width: '40px', height: '40px', fontSize: '16px', overflow: 'hidden' }}>
                        {user.profileImage ? (
                            <img src={user.profileImage} alt={user.name} className="w-100 h-100" style={{ objectFit: 'cover' }} />
                        ) : (
                            (user.name?.charAt(0) || 'U').toUpperCase()
                        )}
                    </div>
                    <div>
                        <div className="fw-bold text-dark" style={{ fontSize: '14px' }}>{user.name}</div>
                        <div className="text-muted" style={{ fontSize: '12px' }}>Student</div>
                    </div>
                </div>
            )}

            {/* Instructions Button */}
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #dee2e6' }}>
                <button
                    className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center"
                    onClick={onShowInstructions}
                    style={{ fontSize: '13px', fontWeight: '500' }}
                >
                    <FiInfo className="me-2" /> View Instructions
                </button>
            </div>

            {/* Question Type Info - Show current question info */}
            {currentQuestion && (
                <div style={{ padding: '12px', borderBottom: '1px solid #dee2e6', background: '#f8f9fa' }}>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                        Qus. Type : <strong style={{ textTransform: 'uppercase' }}>{currentQuestion.type?.replace(/_/g, ' ')}</strong>
                    </div>
                    <div style={{ fontSize: '11px', color: '#666' }}>
                        Marks : <strong>{currentQuestion.marks || 1}</strong>
                        {currentQuestion.negativeMarks && (
                            <> | Neg Marks : <strong>{currentQuestion.negativeMarks}</strong></>
                        )}
                    </div>
                </div>
            )}

            {/* Question Grid */}
            <div className="question-grid" style={{
                flex: 1,
                overflow: 'auto',
                padding: '15px'
            }}>
                {/* Show groups in accordion style if a subject is selected */}
                {activeSection && groups.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {groups.map((group) => {
                            const isExpanded = expandedGroups[group._id];
                            const groupQuestions = group.questions;

                            return (
                                <div key={group._id} style={{
                                    border: '1px solid #dee2e6',
                                    borderRadius: '6px',
                                    overflow: 'hidden'
                                }}>
                                    {/* Group Header */}
                                    <div
                                        onClick={() => toggleGroup(group._id)}
                                        style={{
                                            padding: '10px 12px',
                                            background: '#f8f9fa',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            borderBottom: isExpanded ? '1px solid #dee2e6' : 'none'
                                        }}
                                    >
                                        <div>
                                            <div style={{
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: '#333'
                                            }}>
                                                {group.name}
                                            </div>
                                            <div style={{
                                                fontSize: '11px',
                                                color: '#666',
                                                marginTop: '2px'
                                            }}>
                                                {groupQuestions.length} Question{groupQuestions.length !== 1 ? 's' : ''}
                                            </div>
                                        </div>
                                        {isExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                                    </div>

                                    {/* Group Questions Grid */}
                                    {isExpanded && (
                                        <div style={{
                                            padding: '12px',
                                            background: 'white'
                                        }}>
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(5, 1fr)',
                                                gap: '8px'
                                            }}>
                                                {groupQuestions.map((question, index) => {
                                                    const globalIndex = questions.findIndex(q => q._id === question._id);
                                                    const status = getQuestionStatus(question);
                                                    const isActive = globalIndex === currentQuestionIndex;

                                                    return (
                                                        <button
                                                            key={question._id}
                                                            onClick={() => onQuestionSelect(globalIndex)}
                                                            style={{
                                                                width: '40px',
                                                                height: '40px',
                                                                border: isActive ? '2px solid #0891b2' : '1px solid #dee2e6',
                                                                borderRadius: '4px',
                                                                background: getStatusColor(status),
                                                                color: 'white',
                                                                fontWeight: '600',
                                                                fontSize: '14px',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            {globalIndex + 1}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    // Default grid view when no subject selected or no groups
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: '8px'
                    }}>
                        {filteredQuestions.map((question, index) => {
                            const globalIndex = questions.findIndex(q => q._id === question._id);
                            const status = getQuestionStatus(question);
                            const isActive = globalIndex === currentQuestionIndex;

                            return (
                                <button
                                    key={question._id}
                                    onClick={() => onQuestionSelect(globalIndex)}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        border: isActive ? '2px solid #0891b2' : '1px solid #dee2e6',
                                        borderRadius: '4px',
                                        background: getStatusColor(status),
                                        color: 'white',
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {index + 1}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="legend" style={{
                padding: '15px',
                borderTop: '1px solid #dee2e6',
                background: '#f8f9fa'
            }}>
                <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '10px' }}>
                    INSTRUCTIONS
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                        <div style={{
                            width: '20px',
                            height: '20px',
                            background: '#28a745',
                            borderRadius: '2px'
                        }}></div>
                        <span>Answered ({getStatusCount('answered', filteredQuestions)})</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                        <div style={{
                            width: '20px',
                            height: '20px',
                            background: '#dc3545',
                            borderRadius: '2px'
                        }}></div>
                        <span>Not Answered ({getStatusCount('not-answered', filteredQuestions)})</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                        <div style={{
                            width: '20px',
                            height: '20px',
                            background: '#6f42c1',
                            borderRadius: '2px'
                        }}></div>
                        <span>Marked ({getStatusCount('marked', filteredQuestions)})</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                        <div style={{
                            width: '20px',
                            height: '20px',
                            background: '#17a2b8',
                            borderRadius: '2px'
                        }}></div>
                        <span>Answered & Marked ({getStatusCount('answered-marked', filteredQuestions)})</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
