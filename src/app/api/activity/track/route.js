import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import StudentActivity from '@/models/StudentActivity';
import { getAuthenticatedUser } from '@/utils/apiAuth';

export async function POST(request) {
    try {
        await connectDB();
        const body = await request.json();
        const { userId, type, contentId, title, action, activityId, duration } = body;
        const currentUser = await getAuthenticatedUser(request);

        if (!currentUser) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
        }

        // Security: Students can only track for themselves, unless admin
        if (currentUser.role !== 'admin' && currentUser.id !== userId && currentUser._id?.toString() !== userId) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        if (action === 'start') {
            const activity = await StudentActivity.create({
                user: userId,
                activityType: type,
                contentId: contentId,
                contentTitle: title,
                startTime: new Date(),
                duration: 0
            });
            return NextResponse.json({ success: true, activityId: activity._id });
        }
        else if (action === 'end' && activityId) {
            const activity = await StudentActivity.findById(activityId);
            if (activity) {
                // Verify ownership
                if (activity.user.toString() !== userId) {
                    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
                }

                activity.endTime = new Date();
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
