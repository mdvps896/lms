import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import connectDB from '@/lib/mongodb';
import Exam from '@/models/Exam';
import { saveToLocalStorage } from '@/utils/localStorage';

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



        if (!attemptId || !examId) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Use local storage for all recordings
        let cameraPath = null;
        let screenPath = null;
        let storageMethod = 'local';

        const timestamp = Date.now();

        if (cameraVideo) {
            try {
                const cameraBytes = await cameraVideo.arrayBuffer();
                const cameraBuffer = Buffer.from(cameraBytes);
                const cameraBase64 = `data:video/webm;base64,${cameraBuffer.toString('base64')}`;
                const cameraFileName = cameraRecordingId ? `${cameraRecordingId}.mp4` : `camera-${attemptId}-${timestamp}.mp4`;
                
                const cameraResult = await saveToLocalStorage(
                    cameraBase64,
                    'exam-recordings',
                    cameraFileName
                );
                
                cameraPath = cameraResult.url;
                console.log('✅ Camera video uploaded to local storage:', cameraPath);
            } catch (error) {
                console.error('❌ Camera video upload error:', error);
            }
        }

        // Process screen video if provided
        if (screenVideo) {
            try {
                const screenBytes = await screenVideo.arrayBuffer();
                const screenBuffer = Buffer.from(screenBytes);
                const screenBase64 = `data:video/webm;base64,${screenBuffer.toString('base64')}`;
                const screenFileName = screenRecordingId ? `${screenRecordingId}.mp4` : `screen-${attemptId}-${timestamp}.mp4`;
                
                const screenResult = await saveToLocalStorage(
                    screenBase64,
                    'exam-recordings', 
                    screenFileName
                );
                
                screenPath = screenResult.url;
                console.log('✅ Screen video uploaded to local storage:', screenPath);
            } catch (error) {
                console.error('❌ Screen video upload error:', error);
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
            message: 'Exam recordings saved successfully to local storage',
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