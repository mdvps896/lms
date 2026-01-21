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
            return NextResponse.json({ success: false, error: 'You must purchase the course to rate it.' }, { status: 403 });
        }

        // Use findOneAndUpdate to bypass schema validation for unrelated fields (like invalid instructor string data)
        const ratingUpdateResult = await Course.findOneAndUpdate(
            { _id: id, 'ratings.user': new mongoose.Types.ObjectId(userId) },
            {
                $set: {
                    'ratings.$.rating': Number(rating),
                    'ratings.$.review': review || '',
                    'ratings.$.createdAt': new Date()
                }
            },
            { new: true, runValidators: false }
        );

        if (!ratingUpdateResult) {
            // If not updated, it means user hasn't rated yet, so push new rating
            await Course.findByIdAndUpdate(
                id,
                {
                    $push: {
                        ratings: {
                            user: new mongoose.Types.ObjectId(userId),
                            rating: Number(rating),
                            review: review || '',
                            createdAt: new Date()
                        }
                    }
                },
                { runValidators: false }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Rating submitted successfully'
        });

    } catch (error) {
        console.error('❌ Rating API Exception:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
