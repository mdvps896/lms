import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Course from '@/models/Course';
import PDFViewSession from '@/models/PDFViewSession';
import { getAuthenticatedUser } from '@/utils/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const currentUser = await getAuthenticatedUser(request);

        if (!currentUser) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        if (!userId) {
            return NextResponse.json({ success: false, message: 'UserId required' }, { status: 400 });
        }

        // Security: Students can only access their own courses, unless admin
        if (currentUser.role !== 'admin' && currentUser.id !== userId && currentUser._id?.toString() !== userId) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        const user = await User.findById(userId).lean();
        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        const enrolled = user.enrolledCourses || [];
        const courseIds = [];
        const expiryMap = {};
        const completedLecturesMap = {}; // Track completed lectures per course

        enrolled.forEach((entry, idx) => {
            if (entry && typeof entry === 'object') {
                const cId = entry.courseId || entry.course;
                const entryCompleted = entry.completedLectures || [];
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
            .select('title thumbnail description price duration totalLectures totalLessons instructor rating readingDuration')
            .lean();

        // URL Fixer
        const fixUrl = (url) => {
            if (typeof url === 'string' && url.startsWith('/uploads/')) {
                return `/api/storage/file${url}`;
            }
            return url;
        };

        const myCourses = await Promise.all(courses.map(async course => {
            const courseIdStr = course._id.toString();
            const expiresAt = expiryMap[courseIdStr];
            const isExpired = expiresAt ? new Date() > new Date(expiresAt) : false;
            const completedLectures = completedLecturesMap[courseIdStr] || [];

            // Get total time spent from PDF sessions
            const timeStats = await PDFViewSession.getTotalCourseTime(userId, course._id);

            return {
                ...course,
                id: course._id.toString(), // Ensure ID is string
                thumbnail: fixUrl(course.thumbnail), // Fix thumbnail URL
                expiresAt: expiresAt,
                isExpired: isExpired,
                isPurchased: true, // Explicitly mark as purchased
                completedLectures: completedLectures, // Add completed lectures array
                totalLectures: course.totalLectures || course.totalLessons || 0, // Ensure totalLectures is present
                totalTimeSpent: timeStats.totalSeconds,
                readingDuration: course.readingDuration || { value: 0, unit: 'hours' }
            };
        }));

        return NextResponse.json({ success: true, courses: myCourses });

    } catch (e) {
        console.error('My Courses API Error:', e);
        return NextResponse.json({ success: false, message: e.message }, { status: 500 });
    }
}
