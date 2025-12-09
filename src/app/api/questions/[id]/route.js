import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Question from '@/models/Question';

export async function GET(request, { params }) {
    try {
        await connectDB();
        const question = await Question.findById(params.id)
            .populate('category', 'name')
            .populate('subject', 'name')
            .populate('questionGroup', 'name');

        if (!question) {
            return NextResponse.json({ success: false, message: 'Question not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: question });
    } catch (error) {
        console.error('Error fetching question:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch question', error: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(request, { params }) {
    try {
        await connectDB();
        const body = await request.json();

        const question = await Question.findByIdAndUpdate(params.id, body, { new: true, runValidators: true })
            .populate('category', 'name')
            .populate('subject', 'name')
            .populate('questionGroup', 'name');

        if (!question) {
            return NextResponse.json({ success: false, message: 'Question not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Question updated successfully', data: question });
    } catch (error) {
        console.error('Error updating question:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update question', error: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        await connectDB();
        const question = await Question.findByIdAndDelete(params.id);

        if (!question) {
            return NextResponse.json({ success: false, message: 'Question not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Question deleted successfully' });
    } catch (error) {
        console.error('Error deleting question:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to delete question', error: error.message },
            { status: 500 }
        );
    }
}
