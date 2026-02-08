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
            .populate('enrolledCourses.courseId', 'title thumbnail duration')
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
        const pdfSessions = await PDFViewSession.find({
            user: id,
            duration: { $gte: 60 } // Filter sessions >= 1 min
        })
            .sort({ startTime: -1 })
            .limit(100)
            .lean();

        const pdfViews = pdfSessions.map(session => {
            const durationInSeconds = session.duration || 0;
            const startTime = new Date(session.startTime);

            // Calculate end time based on duration if available, otherwise fallback
            let endTime;
            if (durationInSeconds > 0) {
                endTime = new Date(startTime.getTime() + (durationInSeconds * 1000));
            } else {
                endTime = session.lastActiveTime || session.endTime || session.startTime;
            }

            return {
                id: session._id,
                title: session.pdfName || session.lectureName || 'Untitled PDF',
                startTime: session.startTime,
                duration: durationInSeconds, // seconds
                lastViewed: endTime,
                latitude: session.latitude,
                longitude: session.longitude,
                locationName: session.locationName,
                selfieCount: session.selfieCount || 0
            };
        });

        const courseViews = activities.map(a => ({
            id: a._id,
            title: a.contentTitle,
            startTime: a.startTime,
            duration: a.duration,
            lastViewed: a.endTime || a.startTime,
            latitude: a.latitude,
            longitude: a.longitude,
            locationName: a.locationName
        }));

        // Enrich Enrolled Courses with progress data
        const enrichedEnrolledCourses = await Promise.all((user.enrolledCourses || []).map(async (enrollment) => {
            if (!enrollment.courseId) return enrollment;

            const courseId = enrollment.courseId._id;
            const course = await Course.findById(courseId).select('readingDuration curriculum').lean();

            // Calculate total time spent on this course
            const stats = await PDFViewSession.getTotalCourseTime(id, courseId);

            // Calculate target time in seconds
            let targetSeconds = 0;
            if (course?.readingDuration) {
                const val = course.readingDuration.value || 0;
                const unit = course.readingDuration.unit || 'hours';

                switch (unit) {
                    case 'minutes': targetSeconds = val * 60; break;
                    case 'hours': targetSeconds = val * 3600; break;
                    case 'days': targetSeconds = val * 86400; break;
                    case 'months': targetSeconds = val * 2592000; break;
                    default: targetSeconds = val * 3600;
                }
            }

            return {
                ...enrollment,
                progress: {
                    spentSeconds: stats.totalSeconds || 0,
                    targetSeconds: targetSeconds,
                    percentage: targetSeconds > 0 ? parseFloat(Math.min(100, (stats.totalSeconds / targetSeconds) * 100).toFixed(1)) : 0,
                    formattedSpent: stats.formattedTime || '0s'
                }
            };
        }));

        const details = {
            user: {
                ...user,
                enrolledCourses: enrichedEnrolledCourses,
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
