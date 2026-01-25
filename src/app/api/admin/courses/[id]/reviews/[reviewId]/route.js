import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';

export const dynamic = 'force-dynamic';

// PUT /api/admin/courses/[id]/reviews/[reviewId] - Update review
export async function PUT(request, { params }) {
    try {
        await connectDB();
        const { id, reviewId } = params;
        const { rating, review, userName, userId } = await request.json();

        const course = await Course.findById(id);
        if (!course) {
            return NextResponse.json({ success: false, message: 'Course not found' }, { status: 404 });
        }

        const ratingDoc = course.ratings.id(reviewId);
        if (!ratingDoc) {
            return NextResponse.json({ success: false, message: 'Review not found' }, { status: 404 });
        }

        if (rating !== undefined) ratingDoc.rating = Number(rating);
        if (review !== undefined) ratingDoc.review = review;
        if (userName !== undefined) ratingDoc.userName = userName;
        if (userId !== undefined) ratingDoc.user = userId || null;

        await course.save();

        return NextResponse.json({
            success: true,
            message: 'Review updated successfully',
            data: course.ratings
        });
    } catch (error) {
        console.error('Error updating review:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/admin/courses/[id]/reviews/[reviewId] - Delete review
export async function DELETE(request, { params }) {
    try {
        await connectDB();
        const { id, reviewId } = params;

        const course = await Course.findById(id);
        if (!course) {
            return NextResponse.json({ success: false, message: 'Course not found' }, { status: 404 });
        }

        course.ratings.pull(reviewId);
        await course.save();

        return NextResponse.json({
            success: true,
            message: 'Review deleted successfully',
            data: course.ratings
        });
    } catch (error) {
        console.error('Error deleting review:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
