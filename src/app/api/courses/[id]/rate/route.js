import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function POST(request, { params }) {
    try {
        await dbConnect();
        const { id } = params;
        const body = await request.json();
        const { userId, rating, review } = body;

        console.log(`📝 [Rate API] Course: ${id}, User: ${userId}, Rating: ${rating}`);

        if (!userId || !rating) {
            return NextResponse.json({ success: false, error: 'User ID and Rating are required' }, { status: 400 });
        }

        const user = await User.findById(userId);
        if (!user) {
            console.error(`❌ User ${userId} not found`);
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        const course = await Course.findById(id);
        if (!course) {
            console.error(`❌ Course ${id} not found`);
            return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
        }

        // Check enrollment - EXTREMELY ROBUST CHECK
        const enrolledCourses = user.enrolledCourses || [];
        console.log(`🔍 Checking enrollment for user ${user.email}. Course count: ${enrolledCourses.length}`);

        let isEnrolled = false;
        for (const e of enrolledCourses) {
            if (!e) continue;
            let cId = '';

            if (typeof e === 'string' || e instanceof mongoose.Types.ObjectId) {
                cId = e.toString();
            } else if (typeof e === 'object') {
                // Check multiple possible fields
                const rawId = e.courseId || e.course || e._id;
                if (rawId?._id) cId = rawId._id.toString();
                else if (rawId) cId = rawId.toString();
            }

            if (cId === id.toString()) {
                isEnrolled = true;
                break;
            }
        }

        if (!isEnrolled) {
            console.log(`🚫 User ${userId} blocked. Enrollments found:`, enrolledCourses.map(e => {
                if (!e) return 'null';
                if (typeof e === 'string') return e;
                return (e.courseId || e.course || e).toString();
            }));
            return NextResponse.json({ success: false, error: 'You must purchase the course to rate it.' }, { status: 403 });
        }

        // Add or Update Rating
        const existingRatingIndex = course.ratings.findIndex(r => r.user && r.user.toString() === userId.toString());

        if (existingRatingIndex > -1) {
            console.log(`♻️ Updating rating at index ${existingRatingIndex}`);
            course.ratings[existingRatingIndex].rating = Number(rating);
            course.ratings[existingRatingIndex].review = review || '';
            course.ratings[existingRatingIndex].createdAt = new Date();
        } else {
            console.log(`✨ Adding new rating`);
            course.ratings.push({
                user: new mongoose.Types.ObjectId(userId),
                rating: Number(rating),
                review: review || '',
                createdAt: new Date()
            });
        }

        // Mark modified and save
        course.markModified('ratings');
        await course.save();
        console.log(`✅ Rating saved for ${course.title}`);

        return NextResponse.json({
            success: true,
            message: 'Rating submitted successfully'
        });

    } catch (error) {
        console.error('❌ Rating API Exception:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
