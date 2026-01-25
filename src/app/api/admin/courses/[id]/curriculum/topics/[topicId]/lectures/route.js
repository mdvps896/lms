import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';

export const dynamic = 'force-dynamic';

// POST /api/admin/courses/[id]/curriculum/topics/[topicId]/lectures - Add lecture to topic
export async function POST(request, { params }) {
    try {
        await connectDB();
        const { id, topicId } = params;
        const { title, type, content, isDemo } = await request.json();

        if (!title || !type || !content) {
            return NextResponse.json(
                { success: false, message: 'Title, type, and content are required' },
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

        // Find the topic
        const topic = course.curriculum.id(topicId);

        if (!topic) {
            return NextResponse.json(
                { success: false, message: 'Topic not found' },
                { status: 404 }
            );
        }

        // Add lecture to topic
        topic.lectures.push({
            title,
            type,
            content,
            isDemo: isDemo || false
        });

        await course.save();

        return NextResponse.json({
            success: true,
            message: 'Lecture added successfully',
            data: course
        });
    } catch (error) {
        console.error('Error adding lecture:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to add lecture' },
            { status: 500 }
        );
    }
}
