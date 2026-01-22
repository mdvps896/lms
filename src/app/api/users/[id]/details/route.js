import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import ExamAttempt from '@/models/ExamAttempt';
import Category from '@/models/Category';
import Course from '@/models/Course';
import Exam from '@/models/Exam';
import PDFViewSession from '@/models/PDFViewSession';
import StudentActivity from '@/models/StudentActivity';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    try {
        await connectDB();
        const { id } = params;

        const user = await User.findById(id)
            .select('-password -twoFactorSecret')
            .populate('category', 'name')
            .populate('enrolledCourses.courseId', 'title thumbnail')
            .lean();

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        // Fetch Exam Attempts
        const attempts = await ExamAttempt.find({ user: id })
            .populate('exam', 'name duration totalMarks passingPercentage')
            .sort({ startedAt: -1 })
            .lean();

        // Calculate stats
        const totalAttempts = attempts.length;
        const passedAttempts = attempts.filter(a => {
            if (!a.exam || !a.percentage) return false;
            return a.percentage >= (a.exam.passingPercentage || 40);
        }).length;

        // Last Activity (Login or Exam)
        // Since we don't have an explicit lastLogin field, we'll use the latest exam attempt or updatedAt
        const lastActivity = attempts.length > 0 ? attempts[0].startedAt : user.updatedAt;

        // Fetch Student Activities (Course)
        const activities = await StudentActivity.find({ user: id, activityType: 'course_view' })
            .sort({ startTime: -1 })
            .lean();
        if (activities.length > 0) {
        }

        // Fetch PDF View Sessions from the specialized model
        const pdfSessions = await PDFViewSession.find({ user: id })
            .sort({ startTime: -1 })
            .limit(100)
            .lean();

        const pdfViews = pdfSessions.map(session => ({
            id: session._id,
            title: session.pdfName || session.lectureName || 'Untitled PDF',
            startTime: session.startTime,
            duration: session.duration || 0, // seconds
            lastViewed: session.lastActiveTime || session.endTime || session.startTime,
            latitude: session.latitude,
            longitude: session.longitude,
            locationName: session.locationName
        }));

        const courseViews = activities.map(a => ({
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
                examTitle: attempt.exam?.name || 'Unknown Exam',
                startedAt: attempt.startedAt,
                submittedAt: attempt.submittedAt,
                status: attempt.status,
                score: attempt.score,
                totalMarks: attempt.totalMarks,
                percentage: attempt.percentage,
                result: attempt.percentage >= (attempt.exam?.passingPercentage ?? 40) ? 'Pass' : 'Fail'
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
