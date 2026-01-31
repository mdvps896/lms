import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import User from '@/models/User';
import { requirePermission } from '@/utils/apiAuth';

export const dynamic = 'force-dynamic';

// GET /api/admin/courses - List all courses with filters
export async function GET(request) {
    const authError = await requirePermission(request, 'manage_courses');
    if (authError) return authError;

    try {

        await connectDB();
        const { searchParams } = new URL(request.url);

        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 20;
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';

        const query = {};

        // Search by title or category
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
            ];
        }

        // Filter by status
        if (status && status !== 'All') {
            query.status = status.toLowerCase();
        }

        const skip = (page - 1) * limit;
        const total = await Course.countDocuments(query);

        const courses = await Course.find(query)
            .populate('category', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Get enrolled students count and calculate ratings for each course
        for (const course of courses) {
            const enrolledCount = await User.countDocuments({
                'enrolledCourses.courseId': course._id
            });
            course.enrolledStudents = enrolledCount;

            // Calculate average rating and total ratings
            if (course.ratings && course.ratings.length > 0) {
                const totalRating = course.ratings.reduce((sum, r) => sum + r.rating, 0);
                course.averageRating = totalRating / course.ratings.length;
                course.totalRatings = course.ratings.length;
            } else {
                course.averageRating = 0;
                course.totalRatings = 0;
            }
        }

        return NextResponse.json({
            success: true,
            data: courses,
            pagination: {
                page,
                limit,
                total,
                hasMore: skip + courses.length < total
            }
        });
    } catch (error) {
        console.error('Error fetching courses:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch courses' },
            { status: 500 }
        );
    }
}

// POST /api/admin/courses - Create new course
export async function POST(request) {
    const authError = await requirePermission(request, 'manage_courses');
    if (authError) return authError;

    try {

        await connectDB();
        const body = await request.json();

        const course = await Course.create(body);

        return NextResponse.json({
            success: true,
            message: 'Course created successfully',
            data: course
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating course:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to create course' },
            { status: 500 }
        );
    }
}
