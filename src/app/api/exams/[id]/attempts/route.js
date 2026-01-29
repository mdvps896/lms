import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Exam from '@/models/Exam';
import ExamAttempt from '@/models/ExamAttempt';
import User from '@/models/User';

export async function GET(request, { params }) {
    try {
        await connectDB();

        const { id } = params;

        // Find exam to verify it exists
        const exam = await Exam.findById(id).lean();

        if (!exam) {
            return NextResponse.json(
                { message: 'Exam not found' },
                { status: 404 }
            );
        }

        // Get all attempts from ExamAttempt collection
        const allAttempts = await ExamAttempt.find({ exam: id }).populate('user', 'name email photo profileImage').lean();

        // Format the attempts
        const formattedAttempts = allAttempts.map(attempt => {
            let duration = 0;
            if (attempt.timeTaken) {
                duration = Math.floor(attempt.timeTaken / 60);
            } else if (attempt.submittedAt && attempt.startedAt) {
                duration = Math.floor((new Date(attempt.submittedAt) - new Date(attempt.startedAt)) / 60000);
            }

            // Get recording paths - handle both array and object format
            let cameraVideo = null;
            let screenVideo = null;



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



            const user = attempt.user || { name: 'Unknown', email: 'N/A', photo: null };

            return {
                _id: attempt._id,
                user: {
                    _id: user._id?.toString(),
                    name: user.name,
                    email: user.email,
                    photo: user.photo || user.profileImage || null
                },
                score: attempt.score || 0,
                duration: `${duration} minutes`,
                submittedAt: attempt.submittedAt || attempt.endedAt || attempt.startedAt,
                status: attempt.status || 'unknown',
                recordings: {
                    cameraVideo: cameraVideo,
                    screenVideo: screenVideo,
                    cameraRecordingId: attempt.cameraRecordingId || null,
                    screenRecordingId: attempt.screenRecordingId || null
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
