'use client'
import React from 'react';
import ExamForm from '@/components/exams/ExamForm';
import ProtectedRoute from '@/components/shared/ProtectedRoute';

const AddRegularExamPage = () => {
    return (
        <ProtectedRoute allowedRoles={['admin', 'teacher']}>
            <div className="container-fluid p-4">
                <h2 className="fw-bold mb-4">Add Regular Exam</h2>
                <ExamForm type="regular" />
            </div>
        </ProtectedRoute>
    );
};

export default AddRegularExamPage;
