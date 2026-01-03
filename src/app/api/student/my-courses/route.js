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

        enrolled.forEach(entry => {
            if (entry && typeof entry === 'object' && entry.courseId) {
                courseIds.push(entry.courseId);
                if (entry.expiresAt) expiryMap[entry.courseId.toString()] = entry.expiresAt;
            } else if (entry) {
                // Legacy ObjectId
                courseIds.push(entry);
            }
        });

        const courses = await Course.find({ _id: { $in: courseIds }, isActive: true })
            .select('title thumbnail description price duration totalLessons instructor rating')
            .lean();

        const myCourses = courses.map(course => {
            const expiresAt = expiryMap[course._id.toString()];
            const isExpired = expiresAt ? new Date() > new Date(expiresAt) : false;
            return {
                ...course,
                id: course._id.toString(), // Ensure ID is string
                expiresAt: expiresAt,
                isExpired: isExpired,
                isPurchased: true // Explicitly mark as purchased
            };
        });

        return NextResponse.json({ success: true, courses: myCourses });

    } catch (e) {
        console.error('My Courses API Error:', e);
        return NextResponse.json({ success: false, message: e.message }, { status: 500 });
    }
}
