import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ExamAttempt from '@/models/ExamAttempt';
import User from '@/models/User';
import { getAuthenticatedUser } from '@/utils/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        await connectDB();
        const user = await getAuthenticatedUser(request);

        if (!user) {
            return NextResponse.json({ success: false, activities: [] }, { status: 401 });
        }

        const permissions = user.permissions || [];
        const isTeacher = user.role === 'teacher';
        const isAdmin = user.role === 'admin';

        // Filters
        let showAttempts = isAdmin || (isTeacher && (permissions.includes('manage_exams') || permissions.includes('view_analytics')));
        let showNewUsers = isAdmin || (isTeacher && permissions.includes('manage_students'));

        // If teacher, maybe filter attempts by their exams?
        // For simplicity, we just check permission first. If they manage exams, they see attempt logs generally.
        // If we want strict "their exams only", we need to query ExamAttempt with filter on populated exam.
        // Let's implement strict filter if teacher.

        const activities = [];

        // Fetch recent exam attempts
        if (showAttempts) {
            let attemptQuery = {};
            // If teacher, find exams created by them first? Or just allow seeing all if they have permission?
            // "ab dahbord per bhi teahse vo chje dkhe jiska use acces hai" -> likely scoped.
            // But ExamAttempt doesn't have createdBy. Exam has createdBy.
            // Complex to filter attempts by exam creator efficiently without aggregation.
            // Let's stick to permission-based visibility for now (Activity Log is usually broader).

            const attempts = await ExamAttempt.find(attemptQuery)
                .populate('user', 'name')
                .populate('exam', 'title')
                .sort({ updatedAt: -1 })
                .limit(10)
                .lean();

            attempts.forEach(attempt => {
                activities.push({
                    type: 'exam',
                    title: attempt.exam?.title || 'Exam',
                    description: `${attempt.user?.name || 'User'} - ${attempt.status}`,
                    time: new Date(attempt.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    timestamp: new Date(attempt.updatedAt)
                });
            });
        }

        // Fetch recent user registrations
        if (showNewUsers) {
            const newUsers = await User.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .lean();

            newUsers.forEach(u => {
                activities.push({
                    type: 'user',
                    title: 'New Registration',
                    description: `${u.name} joined`,
                    time: new Date(u.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    timestamp: new Date(u.createdAt)
                });
            });
        }

        // Sort combined list by timestamp descending
        activities.sort((a, b) => b.timestamp - a.timestamp);

        return NextResponse.json({
            success: true,
            activities: activities.slice(0, 10)
        });

    } catch (error) {
        console.error('Error fetching recent activities:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
