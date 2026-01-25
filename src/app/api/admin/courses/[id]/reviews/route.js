import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

// GET /api/admin/courses/[id]/reviews - List all reviews
export async function GET(request, { params }) {
    try {
        await connectDB();
        const { id } = params;

        const course = await Course.findById(id).populate('ratings.user', 'name profileImage');
        if (!course) {
            return NextResponse.json({ success: false, message: 'Course not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: course.ratings || []
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/admin/courses/[id]/reviews - Add review
export async function POST(request, { params }) {
    try {
        await connectDB();
        const { id } = params;
        const { rating, review, userName, userId } = await request.json();

        if (!rating) {
            return NextResponse.json({ success: false, message: 'Rating is required' }, { status: 400 });
        }

        const course = await Course.findById(id);
        if (!course) {
            return NextResponse.json({ success: false, message: 'Course not found' }, { status: 404 });
        }

        course.ratings.push({
            user: userId || null,
            userName: userName || '',
            rating: Number(rating),
            review: review || '',
            createdAt: new Date()
        });

        await course.save();

        return NextResponse.json({
            success: true,
            message: 'Review added successfully',
            data: course.ratings
        });
    } catch (error) {
        console.error('Error adding review:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
