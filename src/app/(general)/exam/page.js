'use client'
import React from 'react';
import ExamList from '@/components/exams/ExamList';
import StudentExamPage from '@/components/students/StudentExamPage';
import { useAuth } from '@/contexts/AuthContext';

const ExamPage = () => {
    const { user } = useAuth();
    
    // Show student interface for students
    if (user?.role === 'student') {
        return <StudentExamPage />;
    }
    
    // Show admin interface for admin/teacher
    return <ExamList />;
};

export default ExamPage;
