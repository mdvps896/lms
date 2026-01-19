import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';
import User from '@/models/User';

export async function GET(request) {
    try {
        await dbConnect();

        // Check if request is from admin panel or mobile app
        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format'); // 'admin' or 'mobile'

        // Fetch courses with populated data
        const courses = await Course.find({})
            .populate('category', 'name')
            .populate('subjects', 'name')
            .populate('exams', 'name type')
            .populate('ratings.user', 'name')
            .sort({ createdAt: -1 });

        // If admin format explicitly requested, return raw data
        if (format === 'admin') {
            // Calculate student counts for each course
            const coursesWithStats = await Promise.all(courses.map(async (course) => {
                const courseObj = course.toObject();
                // Calculate real student counts for this specific course
                const studentCount = await User.countDocuments({
                    role: 'student',
                    $or: [
                        { 'enrolledCourses.courseId': course._id },
                        { enrolledCourses: course._id } // Support for legacy simple ID format
                    ]
                });

                return { ...courseObj, studentCount };
            }));

            return NextResponse.json({ success: true, data: coursesWithStats });
        }

        // Mobile app format - formatted data
        const formattedEntities = await Promise.all(courses.map(async course => {
            // ... (rest of formatting)
            const studentCount = await User.countDocuments({
                role: 'student',
                $or: [
                    { 'enrolledCourses.courseId': course._id },
                    { enrolledCourses: course._id }
                ]
            });

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

            // Format reading duration
            let readingDurationText = '0 hours';
            if (course.readingDuration) {
                const { value, unit } = course.readingDuration;
                readingDurationText = `${value} ${unit}`;
            }

            // Extract category name as string
            const categoryName = course.category?.name || 'General';

            // Count total lectures from curriculum
            let totalLectures = 0;
            if (course.curriculum && Array.isArray(course.curriculum)) {
                course.curriculum.forEach(topic => {
                    if (topic.lectures && Array.isArray(topic.lectures)) {
                        totalLectures += topic.lectures.length;
                    }
                });
            }

            // Calculate price with GST
            const basePrice = course.price || 0;
            let gstAmount = 0;
            let totalPrice = basePrice;

            if (course.gstEnabled && course.gstPercentage) {
                gstAmount = (basePrice * course.gstPercentage) / 100;
                totalPrice = basePrice + gstAmount;
            }

            const formatted = {
                id: course._id.toString(),
                title: course.title || 'Untitled Course',
                description: course.description || '',
                category: categoryName,
                price: basePrice.toString(),
                isFree: course.isFree || false,
                gstEnabled: course.gstEnabled || false,
                gstPercentage: course.gstPercentage || 0,
                gstAmount: Math.round(gstAmount).toString(),
                totalPrice: Math.round(totalPrice).toString(),
                thumbnail: course.thumbnail || '',
                demoVideo: course.demoVideo
                    ? (course.demoVideo.includes('/api/storage/secure-file')
                        ? course.demoVideo.replace('/api/storage/secure-file', '/api/storage/demo-video')
                        : course.demoVideo)
                    : '',
                instructor: 'Admin',
                duration: durationText,
                totalTopics: course.curriculum?.length || 0,
                totalLectures: totalLectures,
                totalQuizzes: course.exams?.length || 0,
                hasCertificate: course.hasCertificate || false,
                students: studentCount.toString(),
                rating: course.ratings && course.ratings.length > 0
                    ? (course.ratings.reduce((acc, curr) => acc + curr.rating, 0) / course.ratings.length).toFixed(1)
                    : '4.5',
                language: course.language || 'English',
                readingDurationText: readingDurationText,
                readingDuration: course.readingDuration || { value: 0, unit: 'hours' },
                // Add curriculum for content tab
                curriculum: course.curriculum || [],
                reviews: course.ratings ? course.ratings.map(r => ({
                    userName: r.user?.name || 'Student',
                    rating: r.rating,
                    review: r.review,
                    date: new Date(r.createdAt).toLocaleDateString()
                })) : []
            };
            return formatted;
        }));

        return NextResponse.json({
            success: true,
            data: formattedEntities,
        });
    } catch (error) {
        console.error('Error fetching courses:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch courses', error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        await dbConnect();
        const body = await request.json();
        const course = await Course.create(body);
        return NextResponse.json({ success: true, data: course }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
