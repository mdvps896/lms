import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ExamAttempt from '@/models/ExamAttempt';
import { getAuthenticatedUser, requirePermission } from '@/utils/apiAuth';

// Store active streams in memory
const activeStreams = new Map();

export async function POST(request) {
    try {
        const formData = await request.formData();
        const attemptId = formData.get('attemptId');
        const streamType = formData.get('streamType'); // 'camera' or 'screen'
        const chunk = formData.get('chunk');

        if (!attemptId || !streamType || !chunk) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // 🔒 SECURITY: you may only push a live feed for your own attempt.
        const currentUser = await getAuthenticatedUser(request);
        if (!currentUser) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        if (currentUser.role !== 'admin' && currentUser.role !== 'teacher') {
            await connectDB();
            const callerId = currentUser.id || currentUser._id?.toString();
            const ownAttempt = await ExamAttempt.findById(attemptId).select('user').lean();
            if (!ownAttempt || ownAttempt.user?.toString() !== callerId) {
                return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
            }
        }

        // Store the latest chunk for this attempt
        const key = `${attemptId}-${streamType}`;

        if (!activeStreams.has(attemptId)) {
            activeStreams.set(attemptId, {
                camera: null,
                screen: null,
                lastUpdate: Date.now()
            });
        }

        const streamData = activeStreams.get(attemptId);
        streamData[streamType] = chunk;
        streamData.lastUpdate = Date.now();

        return NextResponse.json({
            message: 'Chunk received',
            success: true
        });
    } catch (error) {
        console.error('Error receiving stream chunk:', error);
        return NextResponse.json(
            { message: 'Failed to receive chunk', error: error.message },
            { status: 500 }
        );
    }
}

export async function GET(request) {
    // 🔒 SECURITY: watching a candidate's live feed is a proctor action.
    const authError = await requirePermission(request, 'manage_live_exams');
    if (authError) return authError;

    try {
        const { searchParams } = new URL(request.url);
        const attemptId = searchParams.get('attemptId');
        const streamType = searchParams.get('streamType');

        if (!attemptId || !streamType) {
            return NextResponse.json(
                { message: 'Missing attemptId or streamType' },
                { status: 400 }
            );
        }

        const streamData = activeStreams.get(attemptId);

        if (!streamData || !streamData[streamType]) {
            return NextResponse.json(
                { message: 'No stream data available' },
                { status: 404 }
            );
        }

        // Return the latest chunk as blob
        return new NextResponse(streamData[streamType], {
            headers: {
                'Content-Type': 'image/jpeg',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
        });
    } catch (error) {
        console.error('Error getting stream chunk:', error);
        return NextResponse.json(
            { message: 'Failed to get chunk', error: error.message },
            { status: 500 }
        );
    }
}

// Cleanup old streams every 30 seconds
setInterval(() => {
    const now = Date.now();
    for (const [attemptId, data] of activeStreams.entries()) {
        if (now - data.lastUpdate > 30000) { // 30 seconds
            activeStreams.delete(attemptId);
            }
    }
}, 30000);
