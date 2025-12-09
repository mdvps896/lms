import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import QuestionGroup from '@/models/QuestionGroup';

export async function GET(request, { params }) {
    try {
        await connectDB();
        const questionGroup = await QuestionGroup.findById(params.id)
            .populate('category', 'name')
            .populate('subject', 'name');
        
        if (!questionGroup) {
            return NextResponse.json(
                { error: 'Question group not found' },
                { status: 404 }
            );
        }
        
        return NextResponse.json(questionGroup);
    } catch (error) {
        console.error('Error fetching question group:', error);
        return NextResponse.json(
            { error: 'Failed to fetch question group' },
            { status: 500 }
        );
    }
}

export async function PUT(request, { params }) {
    try {
        await connectDB();
        const body = await request.json();
        
        // Check if name already exists in the same subject (excluding current record)
        if (body.name || body.subject) {
            const currentGroup = await QuestionGroup.findById(params.id);
            if (!currentGroup) {
                return NextResponse.json(
                    { error: 'Question group not found' },
                    { status: 404 }
                );
            }

            const nameToCheck = body.name || currentGroup.name;
            const subjectToCheck = body.subject || currentGroup.subject;

            const existingGroup = await QuestionGroup.findOne({ 
                name: { $regex: new RegExp(`^${nameToCheck}$`, 'i') },
                subject: subjectToCheck,
                _id: { $ne: params.id }
            });
            
            if (existingGroup) {
                return NextResponse.json(
                    { error: 'Question group name already exists in this subject' },
                    { status: 400 }
                );
            }
        }
        
        const questionGroup = await QuestionGroup.findByIdAndUpdate(
            params.id,
            body,
            { new: true, runValidators: true }
        )
        .populate('category', 'name')
        .populate('subject', 'name');
        
        if (!questionGroup) {
            return NextResponse.json(
                { error: 'Question group not found' },
                { status: 404 }
            );
        }
        
        return NextResponse.json(questionGroup);
    } catch (error) {
        console.error('Error updating question group:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update question group' },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        await connectDB();
        const questionGroup = await QuestionGroup.findByIdAndDelete(params.id);
        
        if (!questionGroup) {
            return NextResponse.json(
                { error: 'Question group not found' },
                { status: 404 }
            );
        }
        
        return NextResponse.json({ message: 'Question group deleted successfully' });
    } catch (error) {
        console.error('Error deleting question group:', error);
        return NextResponse.json(
            { error: 'Failed to delete question group' },
            { status: 500 }
        );
    }
}
