import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request) {
    try {
        await connectDB();
        const { userId, courseId, lectureId } = await request.json();

        if (!userId || !courseId || !lectureId) {
            return NextResponse.json({
                success: false,
                message: 'Missing required fields'
            }, { status: 400 });
        }

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'User not found'
            }, { status: 404 });
        }

        // Initialize enrolledCourses if not existing
        if (!user.enrolledCourses) {
            user.enrolledCourses = [];
        }

        // Find the course enrollment
        let enrollmentIndex = user.enrolledCourses.findIndex(e => {
            const eCourseId = e.courseId?.toString() || e.course?.toString();
            return eCourseId === courseId;
        });

        if (enrollmentIndex === -1) {
            return NextResponse.json({
                success: false,
                message: 'User not enrolled in this course'
            }, { status: 403 });
        }

        const enrollment = user.enrolledCourses[enrollmentIndex];

        // Ensure completedLectures array exists
        if (!enrollment.completedLectures) {
            enrollment.completedLectures = [];
        }

        // Add lecture if not already completed
        if (!enrollment.completedLectures.includes(lectureId)) {
            enrollment.completedLectures.push(lectureId);

            // Mark the array as modified so Mongoose saves it
            user.markModified('enrolledCourses');
            await user.save();

            }

        return NextResponse.json({
            success: true,
            completedLectures: enrollment.completedLectures
        });

    } catch (error) {
        console.error('Update progress error:', error);
        return NextResponse.json({
            success: false,
            message: error.message
        }, { status: 500 });
    }
}
