import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';

export async function GET() {
    try {
        await dbConnect();

        // Fetch all active courses
        const courses = await Course.find({ isActive: true })
            .populate('category', 'name')
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        console.log('Fetched courses count:', courses.length);

        // Format courses for mobile app
        const formattedCourses = courses.map(course => {
            // Format duration
            let durationText = '0h 0m';
            if (course.duration) {
                const { value, unit } = course.duration;
                if (unit === 'months') {
                    durationText = `${value} months`;
                } else if (unit === 'days') {
                    durationText = `${value} days`;
                } else if (unit === 'years') {
                    durationText = `${value} years`;
                }
            }

            // Extract category name as string (not object)
            const categoryName = course.category?.name || 'General';

            return {
                id: course._id.toString(),
                title: course.title || 'Untitled Course',
                description: '',
                category: categoryName,  // Return as string, not object
                price: course.price?.toString() || '0',
                thumbnail: course.thumbnail || '',
                instructor: 'Admin',
                duration: durationText,
                students: course.studentCount?.toString() || '0',
                rating: '4.5',
            };
        });

        console.log('Returning formatted courses:', formattedCourses.length);

        return NextResponse.json({
            success: true,
            data: formattedCourses,
        });
    } catch (error) {
        console.error('Error fetching courses:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch courses', error: error.message },
            { status: 500 }
        );
    }
}
