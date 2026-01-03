import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import ExamAttempt from '@/models/ExamAttempt';
import Category from '@/models/Category';
import Exam from '@/models/Exam'; // Ensure Exam is registered
import StudentActivity from '@/models/StudentActivity';

export async function GET(request, { params }) {
    try {
        await connectDB();
        const { id } = params;

        const user = await User.findById(id)
            .select('-password -twoFactorSecret')
            .populate('category', 'name')
            .lean();

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        // Fetch Exam Attempts
        const attempts = await ExamAttempt.find({ user: id })
            .populate('exam', 'title duration totalMarks passPercentage')
            .sort({ startedAt: -1 })
            .lean();

        // Calculate stats
        const totalAttempts = attempts.length;
        const passedAttempts = attempts.filter(a => {
            if (!a.exam || !a.percentage) return false;
            return a.percentage >= (a.exam.passPercentage || 0);
        }).length;

        // Last Activity (Login or Exam)
        // Since we don't have an explicit lastLogin field, we'll use the latest exam attempt or updatedAt
        const lastActivity = attempts.length > 0 ? attempts[0].startedAt : user.updatedAt;

        // Fetch Student Activities (PDF & Course)
        const activities = await StudentActivity.find({ user: id })
            .sort({ startTime: -1 })
            .lean();

        const pdfViews = activities.filter(a => a.activityType === 'pdf_view').map(a => ({
            id: a._id,
            title: a.contentTitle,
            startTime: a.startTime,
            duration: a.duration, // seconds
            lastViewed: a.endTime || a.startTime
        }));

        const courseViews = activities.filter(a => a.activityType === 'course_view').map(a => ({
            id: a._id,
            title: a.contentTitle,
            startTime: a.startTime,
            duration: a.duration,
            lastViewed: a.endTime || a.startTime
        }));

        const details = {
            user: {
                ...user,
                lastActivity // enriching user object
            },
            examStats: {
                total: totalAttempts,
                passed: passedAttempts,
            },
            attempts: attempts.map(attempt => ({
                id: attempt._id,
                examTitle: attempt.exam?.title || 'Unknown Exam',
                startedAt: attempt.startedAt,
                submittedAt: attempt.submittedAt,
                status: attempt.status,
                score: attempt.score,
                totalMarks: attempt.totalMarks,
                percentage: attempt.percentage,
                result: attempt.percentage >= (attempt.exam?.passPercentage || 0) ? 'Pass' : 'Fail'
            })),
            pdfViews: pdfViews,
            courseViews: courseViews
        };

        return NextResponse.json({ success: true, data: details });
    } catch (error) {
        console.error('Error fetching student details:', error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
