'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ExamForm from '@/components/exams/ExamForm';
import { toast } from 'react-toastify';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import ProtectedRoute from '@/components/shared/ProtectedRoute';

const EditExamPage = () => {
    const params = useParams();
    const router = useRouter();
    const { id } = params;
    const [examData, setExamData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExam = async () => {
            try {
                const res = await fetch(`/api/exams/${id}`);
                const data = await res.json();
                if (data.success) {
                    setExamData(data.data);
                } else {
                    toast.error(data.error || 'Failed to fetch exam details');
                    router.push('/exam');
                }
            } catch (error) {
                console.error('Error fetching exam:', error);
                toast.error('An error occurred');
                router.push('/exam');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchExam();
        }
    }, [id, router]);

    if (loading) {
        return <div className="p-4 text-center">Loading...</div>;
    }

    if (!examData) {
        return (
            <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                <div className="p-4 text-center">Exam not found</div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute allowedRoles={['admin', 'teacher']}>
            <PageHeader title="Edit Exam" />
            <div className="main-content">
                <div className="row">
                    <div className="col-12">
                        <ExamForm type={examData.type} initialData={examData} />
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default EditExamPage;
