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

        console.log(`🔍 Checking ${enrolled.length} enrollments for user ${userId}`);
        enrolled.forEach((entry, idx) => {
            console.log(`  [${idx}] Keys: ${Object.keys(entry || {})}`);
            if (entry && typeof entry === 'object') {
                const cId = entry.courseId || entry.course;
                const entryCompleted = entry.completedLectures || [];
                console.log(`  [${idx}] CourseID resolved: ${cId}, Completed: ${entryCompleted.length}`);

                if (cId) {
                    courseIds.push(cId);
                    if (entry.expiresAt) expiryMap[cId.toString()] = entry.expiresAt;

                    // Only update/merge if we have completions (prevents empty duplicates from overwriting)
                    if (entryCompleted.length > 0) {
                        const existing = completedLecturesMap[cId.toString()] || [];
                        // Merge and deduplicate
                        const merged = [...new Set([...existing, ...entryCompleted])];
                        completedLecturesMap[cId.toString()] = merged;
                    }
                }
            } else if (entry) {
                // Legacy ObjectId strings
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
