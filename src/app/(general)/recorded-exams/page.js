'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import ExamsGrid from './_components/ExamsGrid';
import AttemptsByUserGrid from './_components/AttemptsByUserGrid';
import UserAttemptsModal from './_components/UserAttemptsModal';
import VideoModal from './_components/VideoModal';

export default function RecordedExamsPage() {
    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState(null);
    const [attempts, setAttempts] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userAttempts, setUserAttempts] = useState([]);
    const [selectedAttempt, setSelectedAttempt] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCompletedExams();
    }, []);

    const fetchCompletedExams = async () => {
        try {
            const response = await fetch('/api/exams/completed');
            const data = await response.json();

            if (response.ok) {
                setExams(data.exams || []);
                } else {
                console.error('API error:', data);
            }
        } catch (error) {
            console.error('Error fetching completed exams:', error);
            toast.error('Failed to load completed exams');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectExam = async (exam) => {
        setSelectedExam(exam);
        setLoading(true);

        try {
            const response = await fetch(`/api/exams/${exam._id}/attempts`);
            const data = await response.json();

            if (response.ok) {
                setAttempts(data.attempts || []);
            }
        } catch (error) {
            console.error('Error fetching attempts:', error);
            toast.error('Failed to load exam attempts');
        } finally {
            setLoading(false);
        }
    };

    const handleViewRecording = (attempt) => {
        setSelectedAttempt(attempt);
        setShowVideoModal(true);
    };

    const handleViewUserAttempts = (user, userAttemptsData) => {
        setSelectedUser(user);
        setUserAttempts(userAttemptsData);
        setShowUserModal(true);
    };

    if (loading && !selectedExam) {
        return (
            <div className="container-fluid p-4">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">
                    <i className="bi bi-camera-reels me-2"></i>
                    Recorded Exams
                </h2>
                {selectedExam && (
                    <button
                        className="btn btn-secondary"
                        onClick={() => {
                            setSelectedExam(null);
                            setAttempts([]);
                        }}
                    >
                        <i className="bi bi-arrow-left me-2"></i>
                        Back to Exams
                    </button>
                )}
            </div>

            {!selectedExam ? (
                <ExamsGrid exams={exams} onSelectExam={handleSelectExam} />
            ) : (
                <AttemptsByUserGrid
                    selectedExam={selectedExam}
                    loading={loading}
                    attempts={attempts}
                    onViewUserAttempts={handleViewUserAttempts}
                />
            )}

            {/* User Attempts Modal */}
            {showUserModal && selectedUser && (
                <UserAttemptsModal
                    selectedUser={selectedUser}
                    userAttempts={userAttempts}
                    onClose={() => setShowUserModal(false)}
                />
            )}

            {/* Video Modal */}
            {showVideoModal && selectedAttempt && (
                <VideoModal
                    selectedAttempt={selectedAttempt}
                    onClose={() => setShowVideoModal(false)}
                />
            )}

            <style jsx>{`
                .hover-shadow {
                    transition: box-shadow 0.3s ease;
                }
                .hover-shadow:hover {
                    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
                }
                .cursor-pointer {
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .cursor-pointer:hover {
                    background-color: #e9ecef !important;
                    transform: scale(1.02);
                }
            `}</style>
        </div>
    );
}
