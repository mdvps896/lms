import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import connectDB from '@/lib/mongodb';
import Exam from '@/models/Exam';
// import { saveToCloudinary } from '@/utils/cloudinary';
import { saveToLocalStorage } from '@/utils/localStorage';

// Configure route to allow large file uploads
export const runtime = 'nodejs';
export const maxDuration = 900; // 15 minutes timeout
export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        await connectDB();

        const formData = await request.formData();
        const attemptId = formData.get('attemptId');
        const examId = formData.get('examId');
        const cameraVideo = formData.get('cameraVideo');
        const screenVideo = formData.get('screenVideo');
        const cameraRecordingId = formData.get('cameraRecordingId');
        const screenRecordingId = formData.get('screenRecordingId');

        let cameraPath = null;
        let screenPath = null;



        if (!attemptId || !examId) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }


        // Removed Cloudinary config check
        const timestamp = Date.now();


        if (cameraVideo) {
            try {
                const cameraBytes = await cameraVideo.arrayBuffer();
                const cameraBuffer = Buffer.from(cameraBytes);
                const cameraMimeType = cameraVideo.type || 'video/webm';
                const cameraBase64 = `data:${cameraMimeType};base64,${cameraBuffer.toString('base64')}`;

                // Determing extension from mimetype
                const ext = cameraMimeType === 'video/mp4' ? '.mp4' : '.webm';

                // Keep original filename structure but use as public_id base
                let cameraFileName = cameraRecordingId ?
                    `${cameraRecordingId}` :
                    `camera-${attemptId}-${timestamp}`;

                // Ensure filename has correct extension
                if (!cameraFileName.endsWith(ext)) {
                    cameraFileName += ext;
                }

                console.log('Saving camera video locally...');
                const cameraResult = await saveToLocalStorage(
                    cameraBase64,
                    'exam-recordings',
                    cameraFileName
                );

                cameraPath = cameraResult.url;
                console.log('✅ Camera video saved locally:', cameraPath);

            } catch (error) {
                console.error('❌ Camera video upload error:', error);
                throw error; // Propagate error to fail the request
            }
        }

        // Process screen video if provided
        if (screenVideo) {
            try {
                const screenBytes = await screenVideo.arrayBuffer();
                const screenBuffer = Buffer.from(screenBytes);
                const screenMimeType = screenVideo.type || 'video/webm';
                const screenBase64 = `data:${screenMimeType};base64,${screenBuffer.toString('base64')}`;

                const ext = screenMimeType === 'video/mp4' ? '.mp4' : '.webm';

                let screenFileName = screenRecordingId ?
                    `${screenRecordingId}` :
                    `screen-${attemptId}-${timestamp}`;

                // Ensure filename has correct extension
                if (!screenFileName.endsWith(ext)) {
                    screenFileName += ext;
                }

                console.log('Saving screen video locally...');
                const screenResult = await saveToLocalStorage(
                    screenBase64,
                    'exam-recordings',
                    screenFileName
                );

                screenPath = screenResult.url;
                console.log('✅ Screen video saved locally:', screenPath);

            } catch (error) {
                console.error('❌ Screen video upload error:', error);
                throw error; // Propagate error to fail the request
            }
        }

        // Update exam attempt with recording paths in both Exam and ExamAttempt models
        const exam = await Exam.findById(examId);
        if (exam) {
            const attempt = exam.attempts.id(attemptId);
            if (attempt) {
                // Initialize recordings as object if it doesn't exist
                if (!attempt.recordings) {
                    attempt.recordings = {};
                }

                // Set the recording paths
                if (cameraPath) {
                    attempt.recordings.cameraVideo = cameraPath;
                    attempt.recordings.cameraRecordingId = cameraRecordingId;
                }
                if (screenPath) {
                    attempt.recordings.screenVideo = screenPath;
                    attempt.recordings.screenRecordingId = screenRecordingId;
                }
                attempt.recordings.recordedAt = new Date();

                // Mark the field as modified to ensure Mongoose saves it
                exam.markModified('attempts');

                await exam.save();
                console.log('✅ Recordings saved to Exam attempt:', {
                    attemptId,
                    cameraPath,
                    screenPath,
                    recordings: attempt.recordings
                });
            } else {
                console.error('❌ Attempt not found in exam');
            }
        } else {
            console.error('❌ Exam not found');
        }

        // Also update ExamAttempt model if it exists separately
        try {
            const ExamAttempt = (await import('@/models/ExamAttempt')).default;
            const examAttempt = await ExamAttempt.findById(attemptId);
            if (examAttempt) {
                if (!examAttempt.recordings) {
                    examAttempt.recordings = {};
                }

                if (cameraPath) {
                    examAttempt.recordings.cameraVideo = cameraPath;
                    examAttempt.recordings.cameraRecordingId = cameraRecordingId;
                }
                if (screenPath) {
                    examAttempt.recordings.screenVideo = screenPath;
                    examAttempt.recordings.screenRecordingId = screenRecordingId;
                }
                examAttempt.recordings.recordedAt = new Date();

                await examAttempt.save();

            }
        } catch (error) {

        }

        return NextResponse.json({
            success: true,
            message: 'Exam recordings saved successfully to Local Storage',
            cameraPath,
            screenPath,
            cameraRecordingId,
            screenRecordingId,
            storageMethod: 'local',
            recordingStats: {
                cameraUploaded: !!cameraPath,
                screenUploaded: !!screenPath,
                totalRecordings: [cameraPath, screenPath].filter(Boolean).length,
                uniqueIds: {
                    camera: cameraRecordingId,
                    screen: screenRecordingId
                }
            }
        });
    } catch (error) {
        console.error('Error saving recordings:', error);
        return NextResponse.json(
            { message: 'Failed to save recordings', error: error.message },
            { status: 500 }
        );
    }
}