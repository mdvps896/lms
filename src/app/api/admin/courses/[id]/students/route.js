import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

// GET /api/admin/courses/[id]/students - Get enrolled students for a course
export async function GET(request, { params }) {
    try {
        await connectDB();
        const { id } = params;
        const { searchParams } = new URL(request.url);

        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 20;
        const search = searchParams.get('search') || '';

        const query = {
            role: 'student',
            'enrolledCourses.courseId': id
        };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;
        const total = await User.countDocuments(query);

        const students = await User.find(query)
            .select('name email profileImage enrolledCourses')
            .skip(skip)
            .limit(limit)
            .lean();

        // Extract course-specific enrollment data
        const studentsWithProgress = students.map(student => {
            const enrollment = student.enrolledCourses.find(
                ec => ec.courseId.toString() === id
            );

            return {
                _id: student._id,
                name: student.name,
                email: student.email,
                profileImage: student.profileImage,
                enrolledAt: enrollment?.enrolledAt,
                expiresAt: enrollment?.expiresAt,
                completedLectures: enrollment?.completedLectures || [],
                progress: 0 // Calculate based on total lectures
            };
        });

        return NextResponse.json({
            success: true,
            data: studentsWithProgress,
            pagination: {
                page,
                limit,
                total,
                hasMore: skip + students.length < total
            }
        });
    } catch (error) {
        console.error('Error fetching course students:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch students' },
            { status: 500 }
        );
    }
}
