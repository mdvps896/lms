import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';

export async function POST(request, { params }) {
    try {
        await dbConnect();
        const { id } = params;
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
        }

        const course = await Course.findById(id);
        if (!course) {
            return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
        }

        // Check if user already liked
        const isCurrentlyLiked = course.likes.some(uid => uid.toString() === userId);

        let updatedCourse;
        if (isCurrentlyLiked) {
            // Remove Like
            updatedCourse = await Course.findByIdAndUpdate(
                id,
                { $pull: { likes: userId } },
                { new: true }
            );
        } else {
            // Add Like
            updatedCourse = await Course.findByIdAndUpdate(
                id,
                { $addToSet: { likes: userId } },
                { new: true }
            );
        }

        const isLiked = updatedCourse.likes.some(uid => uid.toString() === userId);

        return NextResponse.json({
            success: true,
            isLiked,
            likesCount: updatedCourse.likes.length
        });

    } catch (error) {
        console.error('Like Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

