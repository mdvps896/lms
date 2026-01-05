
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import StudentActivity from '@/models/StudentActivity';

export async function POST(request) {
    try {
        await connectDB();
        const body = await request.json();
        const { userId, type, contentId, title, action, activityId, duration } = body;

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
        }

        if (action === 'start') {
            // Create new activity log
            const activity = await StudentActivity.create({
                user: userId,
                activityType: type, // 'pdf_view' or 'course_view'
                contentId: contentId,
                contentTitle: title,
                startTime: new Date(),
                duration: 0
            });
            console.log('✅ Created new activity:', activity);
            return NextResponse.json({ success: true, activityId: activity._id });
        }
        else if (action === 'end' && activityId) {
            // Update duration and end time
            const activity = await StudentActivity.findById(activityId);
            if (activity) {
                activity.endTime = new Date();
                // If duration provided explicitly, usage it, else calc diff
                if (duration) {
                    activity.duration = duration;
                } else {
                    const diff = (activity.endTime - activity.startTime) / 1000;
                    activity.duration = Math.round(diff);
                }
                await activity.save();
                return NextResponse.json({ success: true, duration: activity.duration });
            }
            return NextResponse.json({ success: false, message: 'Activity not found' }, { status: 404 });
        }

        return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Track error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
