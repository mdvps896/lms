import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Exam from '@/models/Exam';
import Question from '@/models/Question';
import Course from '@/models/Course';
import Meeting from '@/models/Meeting';

export const dynamic = 'force-dynamic';

import { getAuthenticatedUser } from '@/utils/apiAuth';

export async function GET(request) {
    try {
        await connectDB();
        const user = await getAuthenticatedUser(request);

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        let contentFilter = {};
        if (user.role === 'teacher') {
            contentFilter = { createdBy: user.id };
        }

        // Get counts from database
        const [
            totalTeachers,
            totalStudents,
            totalExams,
            activeExams,
            completedExams,
            totalQuestions,
            totalCourses,
            totalMeetings
        ] = await Promise.all([
            user.role === 'admin' ? User.countDocuments({ role: 'teacher', status: 'active' }) : Promise.resolve(0),
            User.countDocuments({ role: 'student', status: 'active' }), // Teachers see all active students for now
            Exam.countDocuments(contentFilter),
            Exam.countDocuments({ ...contentFilter, status: 'active' }),
            Exam.countDocuments({
                ...contentFilter,
                endDate: { $lt: new Date() },
                status: 'active'
            }),
            Question.countDocuments(contentFilter),
            Course.countDocuments(contentFilter),
            Meeting.countDocuments(contentFilter)
        ]);

        // Calculate completion rate
        const completionRate = totalExams > 0
            ? Math.round((completedExams / totalExams) * 100)
            : 0;



        const allStats = [
            {
                id: 1,
                title: "Total Teachers",
                total_number: totalTeachers.toString(),
                completed_number: "",
                progress: "100%",
                progress_info: `${totalTeachers} Active`,
                icon: "feather-users",
                role: 'admin' // Only admin sees teacher analytics
            },
            {
                id: 2,
                title: "Total Students",
                total_number: totalStudents.toString(),
                completed_number: "",
                progress: "100%",
                progress_info: `${totalStudents} Active`,
                icon: "feather-user-check",
                permission: 'manage_students'
            },
            {
                id: 3,
                title: "Stored Exams",
                total_number: totalExams.toString(),
                completed_number: completedExams.toString(),
                progress: `${completionRate}%`,
                progress_info: `${completedExams} Completed`,
                icon: "feather-file-text",
                permission: 'manage_exams'
            },
            {
                id: 4,
                title: "Total Questions",
                total_number: totalQuestions.toString(),
                completed_number: "",
                progress: "100%",
                progress_info: `${totalQuestions} Questions`,
                icon: "feather-help-circle",
                permission: 'manage_questions'
            },
            {
                id: 5,
                title: "Total Courses",
                total_number: totalCourses.toString(),
                completed_number: "",
                progress: "100%",
                progress_info: `${totalCourses} Courses`,
                icon: "feather-book",
                permission: 'manage_courses'
            },
            {
                id: 6,
                title: "Total Meetings",
                total_number: totalMeetings.toString(),
                completed_number: "",
                progress: "100%",
                progress_info: `${totalMeetings} Meetings`,
                icon: "feather-video",
                permission: 'manage_live_exams'
            }
        ];

        let filteredStats = allStats;

        if (user.role === 'teacher') {
            const permissions = user.permissions || [];
            filteredStats = allStats.filter(stat => {
                // Teachers never see "Total Teachers" regardless of permissions, unless explicit 'manage_teachers' exists (which it doesn't)
                if (stat.role === 'admin') return false;

                // If specific permission is required, check it
                if (stat.permission) {
                    return permissions.includes(stat.permission);
                }

                return true;
            });
        }

        return NextResponse.json({ success: true, data: filteredStats });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch statistics' },
            { status: 500 }
        );
    }
}
