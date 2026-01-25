import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';

export const dynamic = 'force-dynamic';

// PUT /api/admin/courses/[id]/curriculum/topics/[topicId]/lectures/[lectureId] - Update lecture
export async function PUT(request, { params }) {
    try {
        await connectDB();
        const { id, topicId, lectureId } = params;
        const updateData = await request.json();

        const course = await Course.findById(id);
        if (!course) {
            return NextResponse.json({ success: false, message: 'Course not found' }, { status: 404 });
        }

        const topic = course.curriculum.id(topicId);
        if (!topic) {
            return NextResponse.json({ success: false, message: 'Topic not found' }, { status: 404 });
        }

        const lecture = topic.lectures.id(lectureId);
        if (!lecture) {
            return NextResponse.json({ success: false, message: 'Lecture not found' }, { status: 404 });
        }

        // Update fields
        if (updateData.title) lecture.title = updateData.title;
        if (updateData.type) lecture.type = updateData.type;
        if (updateData.content) lecture.content = updateData.content;
        if (updateData.isDemo !== undefined) lecture.isDemo = updateData.isDemo;
        if (updateData.duration !== undefined) lecture.duration = updateData.duration;

        await course.save();

        return NextResponse.json({
            success: true,
            message: 'Lecture updated successfully',
            data: course
        });
    } catch (error) {
        console.error('Error updating lecture:', error);
        return NextResponse.json({ success: false, message: 'Failed to update lecture' }, { status: 500 });
    }
}

// DELETE /api/admin/courses/[id]/curriculum/topics/[topicId]/lectures/[lectureId] - Delete lecture
export async function DELETE(request, { params }) {
    try {
        await connectDB();
        const { id, topicId, lectureId } = params;

        const course = await Course.findById(id);
        if (!course) {
            return NextResponse.json({ success: false, message: 'Course not found' }, { status: 404 });
        }

        const topic = course.curriculum.id(topicId);
        if (!topic) {
            return NextResponse.json({ success: false, message: 'Topic not found' }, { status: 404 });
        }

        // Remove the lecture
        topic.lectures.pull(lectureId);
        await course.save();

        return NextResponse.json({
            success: true,
            message: 'Lecture deleted successfully',
            data: course
        });
    } catch (error) {
        console.error('Error deleting lecture:', error);
        return NextResponse.json({ success: false, message: 'Failed to delete lecture' }, { status: 500 });
    }
}
