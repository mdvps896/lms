import connectDB from '@/lib/mongodb';
import { requirePermission, getAuthenticatedUser } from '@/utils/apiAuth';
import Meeting from '@/models/Meeting';
import Category from '@/models/Category';
import Subject from '@/models/Subject';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const authError = await requirePermission(request, 'manage_live_exams');
    if (authError) return authError;
    try {
        await connectDB();

        // Fetch meetings with populated fields
        const meetings = await Meeting.find({})
            .populate('category', 'name')
            .populate('subjects', 'name')
            .populate('assignedUsers', 'name email')
            .sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            data: meetings
        });
    } catch (error) {
        console.error('Error fetching meetings:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch meetings' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    const authError = await requirePermission(request, 'manage_live_exams');
    if (authError) return authError;
    try {
        await connectDB();
        const data = await request.json();
        if (!data.title || !data.category || !data.startTime || !data.endTime || !data.links || data.links.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            );
        }

        const meeting = await Meeting.create(data);

        return NextResponse.json({
            success: true,
            message: 'Meeting created successfully',
            data: meeting
        });
    } catch (error) {
        console.error('Error creating meeting:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to create meeting' },
            { status: 500 }
        );
    }
}
