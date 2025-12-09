import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Exam from '@/models/Exam';
import User from '@/models/User';

export async function GET(request, { params }) {
    try {
        await connectDB();

        const { id } = params;

        // Find exam with its attempts
        const exam = await Exam.findById(id).lean();

        if (!exam) {
            return NextResponse.json(
                { message: 'Exam not found' },
                { status: 404 }
            );
        }

        console.log('Exam found:', exam.name);
        console.log('Total attempts:', exam.attempts?.length);

        // Get all attempts (not just submitted)
        const allAttempts = exam.attempts || [];

        console.log('All attempts:', allAttempts.length);

        // Get unique user IDs
        const userIds = [...new Set(allAttempts.map(a => a.userId?.toString()).filter(Boolean))];
        
        // Fetch user details
        const users = await User.find({ _id: { $in: userIds } }).lean();
        const userMap = {};
        users.forEach(user => {
            userMap[user._id.toString()] = user;
        });

        // Format the attempts
        const formattedAttempts = allAttempts.map(attempt => {
            const duration = attempt.submittedAt && attempt.startTime
                ? Math.floor((new Date(attempt.submittedAt) - new Date(attempt.startTime)) / 60000)
                : 0;

            // Get recording paths - handle both array and object format
            let cameraVideo = null;
            let screenVideo = null;

            console.log(`Attempt ${attempt._id} recordings:`, attempt.recordings);

            if (Array.isArray(attempt.recordings)) {
                // Array format (old)
                const cameraRecording = attempt.recordings.find(r => r.type === 'video' && r.filename?.includes('camera'));
                const screenRecording = attempt.recordings.find(r => r.type === 'screen' || r.filename?.includes('screen'));
                cameraVideo = cameraRecording ? `/recordings/${attempt._id}/${cameraRecording.filename}` : null;
                screenVideo = screenRecording ? `/recordings/${attempt._id}/${screenRecording.filename}` : null;
            } else if (attempt.recordings && typeof attempt.recordings === 'object') {
                // Object format (new)
                cameraVideo = attempt.recordings.cameraVideo || null;
                screenVideo = attempt.recordings.screenVideo || null;
            }

            console.log(`Attempt ${attempt._id}:`, { cameraVideo, screenVideo });

            const userId = attempt.userId?.toString();
            const user = userMap[userId] || { name: 'Unknown', email: 'N/A', photo: null };

            return {
                _id: attempt._id,
                user: {
                    _id: userId,
                    name: user.name,
                    email: user.email,
                    photo: user.photo || null
                },
                score: attempt.score || 0,
                duration: `${duration} minutes`,
                submittedAt: attempt.submittedAt || attempt.endTime || attempt.startTime,
                status: attempt.status || 'unknown',
                recordings: {
                    cameraVideo: cameraVideo,
                    screenVideo: screenVideo
                }
            };
        });

        return NextResponse.json({
            attempts: formattedAttempts
        });
    } catch (error) {
        console.error('Error fetching exam attempts:', error);
        return NextResponse.json(
            { message: 'Failed to fetch exam attempts', error: error.message },
            { status: 500 }
        );
    }
}
