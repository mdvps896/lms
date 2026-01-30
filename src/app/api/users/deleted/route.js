import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

// GET - List all deleted students
export async function GET(request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const countOnly = searchParams.get('count') === 'true';

        if (countOnly) {
            const count = await User.countDocuments({
                role: 'student',
                isDeleted: true
            });
            return NextResponse.json({
                success: true,
                count
            });
        }

        // Find all users with role 'student' and isDeleted: true
        const deletedStudents = await User.find({
            role: 'student',
            isDeleted: true
        })
            .select('name email phone deletedAt createdAt')
            .sort({ deletedAt: -1 });

        return NextResponse.json({
            success: true,
            data: deletedStudents
        });
    } catch (error) {
        console.error('Error fetching deleted students:', error);
        return NextResponse.json(
            { success: false, message: 'Error fetching deleted students' },
            { status: 500 }
        );
    }
}
