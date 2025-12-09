import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Exam from '@/models/Exam';
import Question from '@/models/Question';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();

        // Get counts from database
        const [
            totalTeachers,
            totalStudents,
            totalExams,
            activeExams,
            completedExams,
            totalQuestions
        ] = await Promise.all([
            User.countDocuments({ role: 'teacher', status: 'active' }),
            User.countDocuments({ role: 'student', status: 'active' }),
            Exam.countDocuments(),
            Exam.countDocuments({ status: 'active' }),
            Exam.countDocuments({ 
                endDate: { $lt: new Date() },
                status: 'active'
            }),
            Question.countDocuments()
        ]);

        // Calculate completion rate
        const completionRate = totalExams > 0 
            ? Math.round((completedExams / totalExams) * 100) 
            : 0;

        const stats = [
            {
                id: 1,
                title: "Total Teachers",
                total_number: totalTeachers.toString(),
                completed_number: "",
                progress: "100%",
                progress_info: `${totalTeachers} Active`,
                icon: "feather-users"
            },
            {
                id: 2,
                title: "Total Students",
                total_number: totalStudents.toString(),
                completed_number: "",
                progress: "100%",
                progress_info: `${totalStudents} Active`,
                icon: "feather-user-check"
            },
            {
                id: 3,
                title: "Stored Exams",
                total_number: totalExams.toString(),
                completed_number: completedExams.toString(),
                progress: `${completionRate}%`,
                progress_info: `${completedExams} Completed`,
                icon: "feather-file-text"
            },
            {
                id: 4,
                title: "Total Questions",
                total_number: totalQuestions.toString(),
                completed_number: "",
                progress: "100%",
                progress_info: `${totalQuestions} Questions`,
                icon: "feather-help-circle"
            }
        ];

        return NextResponse.json({ success: true, data: stats });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch statistics' },
            { status: 500 }
        );
    }
}
