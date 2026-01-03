import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

// GET - List all students
export async function GET(request) {
    try {
        await dbConnect();

        // Find all users with role 'student'
        const students = await User.find({ role: 'student' })
            .select('name email phone createdAt')
            .sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            data: students
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        return NextResponse.json(
            { success: false, message: 'Error fetching students' },
            { status: 500 }
        );
    }
}
