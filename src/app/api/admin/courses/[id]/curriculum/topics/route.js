import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';

export const dynamic = 'force-dynamic';

// POST /api/admin/courses/[id]/curriculum/topics - Add new topic to course
export async function POST(request, { params }) {
    try {
        await connectDB();
        const { id } = params;
        const { title } = await request.json();

        if (!title) {
            return NextResponse.json(
                { success: false, message: 'Topic title is required' },
                { status: 400 }
            );
        }

        const course = await Course.findById(id);

        if (!course) {
            return NextResponse.json(
                { success: false, message: 'Course not found' },
                { status: 404 }
            );
        }

        // Add new topic to curriculum
        course.curriculum.push({
            title,
            lectures: []
        });

        await course.save();

        return NextResponse.json({
            success: true,
            message: 'Topic added successfully',
            data: course
        });
    } catch (error) {
        console.error('Error adding topic:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to add topic' },
            { status: 500 }
        );
    }
}
