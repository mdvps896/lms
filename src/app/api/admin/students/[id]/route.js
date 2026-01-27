import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course'; // Import Course FIRST to register schema
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    console.log('🔥🔥🔥 GET STUDENT DETAILS ROUTE CALLED 🔥🔥🔥');
    try {
        console.log('========== FETCHING STUDENT DETAILS ==========');
        await connectDB();
        const { id } = params;
        console.log('Student ID:', id);

        // Use lean() to get a plain object, easier to manipulate
        let student = await User.findOne({
            _id: id,
            role: 'student',
            $or: [
                { isDeleted: { $exists: false } },
                { isDeleted: false }
            ]
        }).select('-password').lean();

        if (!student) {
            return NextResponse.json(
                { success: false, message: 'Student not found' },
                { status: 404 }
            );
        }

        console.log('Student found:', student.name);
        console.log('Number of enrolled courses:', student.enrolledCourses?.length || 0);

        // Use Mongoose populate instead of manual population
        if (student.enrolledCourses && student.enrolledCourses.length > 0) {
            try {
                console.log('Populating course details...');
                console.log('========== BEFORE POPULATE ==========');
                console.log('First courseId BEFORE:', student.enrolledCourses[0]?.courseId);
                console.log('courseId type:', typeof student.enrolledCourses[0]?.courseId);
                console.log('====================================');

                // Re-fetch with populate to get course details AND category
                student = await User.findOne({
                    _id: id,
                    role: 'student',
                    $or: [
                        { isDeleted: { $exists: false } },
                        { isDeleted: false }
                    ]
                })
                    .select('-password')
                    .populate({
                        path: 'enrolledCourses.courseId',
                        select: 'title thumbnail lectures duration readingDuration'
                    })
                    .populate({
                        path: 'category',
                        select: 'name description'
                    })
                    .lean();

                console.log('========== AFTER POPULATE ==========');
                console.log('First courseId AFTER:', student.enrolledCourses[0]?.courseId);
                console.log('courseId type:', typeof student.enrolledCourses[0]?.courseId);
                if (student.enrolledCourses[0]?.courseId) {
                    console.log('Is it an object?', typeof student.enrolledCourses[0]?.courseId === 'object');
                    console.log('Has title?', student.enrolledCourses[0]?.courseId?.title);
                }
                console.log('Category:', student.category);
                console.log('====================================');
            } catch (err) {
                console.error('Populate error:', err);
            }
        }

        console.log('========== FINAL STUDENT DATA ==========');
        console.log('Enrolled Courses Count:', student.enrolledCourses?.length || 0);
        if (student.enrolledCourses && student.enrolledCourses.length > 0) {
            console.log('First course structure:', JSON.stringify(student.enrolledCourses[0], null, 2));
        }
        console.log('========================================');

        return NextResponse.json({ success: true, data: student });
    } catch (error) {
        console.error('Error fetching student:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch student' },
            { status: 500 }
        );
    }
}

export async function PUT(request, { params }) {
    try {
        await connectDB();
        const { id } = params;
        const body = await request.json();

        // Check if this is a restore operation
        if (body.action === 'restore') {
            const student = await User.findByIdAndUpdate(
                id,
                { isDeleted: false },
                { new: true }
            ).select('-password');

            if (!student) {
                return NextResponse.json(
                    { success: false, message: 'Student not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'Student restored successfully',
                data: student
            });
        }

        // Regular update operation
        const updateData = { ...body };

        // Prevent password update through this route directly without hashing
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }

        // 🔄 AUTO-VERIFY: If admin sets account to 'active', automatically verify email
        if (updateData.status === 'active') {
            updateData.emailVerified = true;
        }

        const student = await User.findOneAndUpdate(
            { _id: id, role: 'student' },
            { $set: updateData },
            { new: true } // Return updated doc
        ).select('-password');

        if (!student) {
            return NextResponse.json(
                { success: false, message: 'Student not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Student updated successfully',
            data: student
        });
    } catch (error) {
        console.error('Error updating student:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update student' },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        await connectDB();
        const { id } = params;

        // Soft delete
        const student = await User.findOneAndUpdate(
            { _id: id, role: 'student' },
            { $set: { isDeleted: true, status: 'inactive' } },
            { new: true }
        );

        if (!student) {
            return NextResponse.json(
                { success: false, message: 'Student not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Student deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting student:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to delete student' },
            { status: 500 }
        );
    }
}

export async function PATCH(request, { params }) {
    try {
        await connectDB();
        const { id } = params;
        const body = await request.json();

        // Check if this is a restore operation
        if (body.action === 'restore') {
            const student = await User.findByIdAndUpdate(
                id,
                { isDeleted: false },
                { new: true }
            ).select('-password');

            if (!student) {
                return NextResponse.json(
                    { success: false, message: 'Student not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'Student restored successfully',
                data: student
            });
        }

        return NextResponse.json(
            { success: false, message: 'Invalid action' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Error restoring student:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to restore student' },
            { status: 500 }
        );
    }
}
