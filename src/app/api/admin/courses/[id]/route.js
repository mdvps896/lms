import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

// GET /api/admin/courses/[id] - Get course details
export async function GET(request, { params }) {
    try {
        await connectDB();
        const { id } = params;

        const course = await Course.findById(id)
            .populate('category', 'name description')
            .lean();

        if (!course) {
            return NextResponse.json(
                { success: false, message: 'Course not found' },
                { status: 404 }
            );
        }

        // Get enrolled students count
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

        return NextResponse.json({
            success: true,
            data: course
        });
    } catch (error) {
        console.error('Error fetching course:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch course' },
            { status: 500 }
        );
    }
}

// PUT /api/admin/courses/[id] - Update course
export async function PUT(request, { params }) {
    try {
        await connectDB();
        const { id } = params;
        const body = await request.json();

        const course = await Course.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true, runValidators: true }
        ).populate('category', 'name');

        if (!course) {
            return NextResponse.json(
                { success: false, message: 'Course not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Course updated successfully',
            data: course
        });
    } catch (error) {
        console.error('Error updating course:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update course' },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/courses/[id] - Delete course
export async function DELETE(request, { params }) {
    try {
        await connectDB();
        const { id } = params;

        const course = await Course.findByIdAndDelete(id);

        if (!course) {
            return NextResponse.json(
                { success: false, message: 'Course not found' },
                { status: 404 }
            );
        }

        // Remove course from all enrolled students
        await User.updateMany(
            { 'enrolledCourses.courseId': id },
            { $pull: { enrolledCourses: { courseId: id } } }
        );

        return NextResponse.json({
            success: true,
            message: 'Course deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting course:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to delete course' },
            { status: 500 }
        );
    }
}
