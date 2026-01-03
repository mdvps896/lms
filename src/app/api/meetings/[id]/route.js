
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Meeting from '@/models/Meeting';

export async function GET(request, { params }) {
    try {
        await connectDB();
        const { id } = params;

        const meeting = await Meeting.findById(id)
            .populate('category', 'name')
            .populate('subjects', 'name')
            .populate('assignedUsers', 'name email');

        if (!meeting) {
            return NextResponse.json(
                { success: false, message: 'Meeting not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: meeting
        });
    } catch (error) {
        console.error('Error fetching meeting:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch meeting' },
            { status: 500 }
        );
    }
}

export async function PUT(request, { params }) {
    try {
        await connectDB();
        const { id } = params;
        const data = await request.json();

        const meeting = await Meeting.findByIdAndUpdate(
            id,
            { ...data },
            { new: true, runValidators: true }
        ).populate('category', 'name')
            .populate('subjects', 'name')
            .populate('assignedUsers', 'name email');

        if (!meeting) {
            return NextResponse.json(
                { success: false, message: 'Meeting not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Meeting updated successfully',
            data: meeting
        });
    } catch (error) {
        console.error('Error updating meeting:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to update meeting' },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        await connectDB();
        const { id } = params;

        const meeting = await Meeting.findByIdAndDelete(id);

        if (!meeting) {
            return NextResponse.json(
                { success: false, message: 'Meeting not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Meeting deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting meeting:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to delete meeting' },
            { status: 500 }
        );
    }
}
