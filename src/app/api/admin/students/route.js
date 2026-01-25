import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);

        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';
        const isDeleted = searchParams.get('isDeleted');

        const query = {
            role: 'student'
        };

        // Handle isDeleted parameter
        if (isDeleted === 'true') {
            // Fetch only deleted students
            query.isDeleted = true;
        } else if (isDeleted === 'false' || !isDeleted) {
            // Fetch only non-deleted students (default behavior)
            query.$or = [
                { isDeleted: { $exists: false } },
                { isDeleted: false }
            ];
        }

        if (search) {
            const searchConditions = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { rollNumber: { $regex: search, $options: 'i' } }
            ];

            if (query.$or) {
                // Combine isDeleted check with search conditions
                query.$and = [
                    { $or: query.$or },
                    { $or: searchConditions }
                ];
                delete query.$or;
            } else {
                query.$or = searchConditions;
            }
        }

        if (status && status !== 'All') {
            query.status = status.toLowerCase();
        }

        const skip = (page - 1) * limit;
        const total = await User.countDocuments(query);

        const students = await User.find(query)
            .select('-password') // Exclude password
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return NextResponse.json({
            success: true,
            data: students,
            pagination: {
                page,
                limit,
                total,
                hasMore: skip + students.length < total
            }
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch students' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        await connectDB();
        const data = await request.json();

        // Basic validation
        if (!data.name || !data.email || !data.password) {
            return NextResponse.json(
                { success: false, message: 'Name, email and password are required' },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email: data.email });
        if (existingUser) {
            return NextResponse.json(
                { success: false, message: 'Email already exists' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);

        const newUser = await User.create({
            ...data,
            password: hashedPassword,
            role: 'student',
            registrationSource: 'admin',
            isDeleted: false
        });

        // Remove password from response
        const userResponse = newUser.toObject();
        delete userResponse.password;

        return NextResponse.json({
            success: true,
            message: 'Student created successfully',
            data: userResponse
        });
    } catch (error) {
        console.error('Error creating student:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to create student: ' + error.message },
            { status: 500 }
        );
    }
}
