import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Course from '@/models/Course';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ success: false, message: 'UserId required' }, { status: 400 });
        }

        const user = await User.findById(userId).lean();
        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        const enrolled = user.enrolledCourses || [];
        const courseIds = [];
        const expiryMap = {};
        const completedLecturesMap = {}; // Track completed lectures per course

        enrolled.forEach(entry => {
            if (entry && typeof entry === 'object' && entry.courseId) {
                courseIds.push(entry.courseId);
                if (entry.expiresAt) expiryMap[entry.courseId.toString()] = entry.expiresAt;
                if (entry.completedLectures) completedLecturesMap[entry.courseId.toString()] = entry.completedLectures;
            } else if (entry) {
                // Legacy ObjectId
                courseIds.push(entry);
            }
        });

        const courses = await Course.find({ _id: { $in: courseIds }, isActive: true })
            .select('title thumbnail description price duration totalLectures totalLessons instructor rating')
            .lean();

        const myCourses = courses.map(course => {
            const courseIdStr = course._id.toString();
            const expiresAt = expiryMap[courseIdStr];
            const isExpired = expiresAt ? new Date() > new Date(expiresAt) : false;
            const completedLectures = completedLecturesMap[courseIdStr] || [];

            return {
                ...course,
                id: course._id.toString(), // Ensure ID is string
                expiresAt: expiresAt,
                isExpired: isExpired,
                isPurchased: true, // Explicitly mark as purchased
                completedLectures: completedLectures, // Add completed lectures array
                totalLectures: course.totalLectures || course.totalLessons || 0 // Ensure totalLectures is present
            };
        });

        return NextResponse.json({ success: true, courses: myCourses });

    } catch (e) {
        console.error('My Courses API Error:', e);
        return NextResponse.json({ success: false, message: e.message }, { status: 500 });
    }
}
