import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import connectDB from '@/lib/mongodb';
import Exam from '@/models/Exam';
import { uploadToCloudinary, getCloudinaryStatus } from '@/utils/cloudinary';

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

        // Check if Cloudinary is enabled
        const cloudinaryStatus = await getCloudinaryStatus();
        const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';

        let cameraPath = null;
        let screenPath = null;
        let storageMethod = null;

        if (cloudinaryStatus.enabled && cloudinaryStatus.configured) {
            // Use Cloudinary for storage with enhanced upload system
            storageMethod = 'cloudinary';
            const timestamp = Date.now();

            if (cameraVideo) {
                try {
                    const cameraBytes = await cameraVideo.arrayBuffer();
                    const cameraBuffer = Buffer.from(cameraBytes);
                    const cameraBase64 = `data:video/webm;base64,${cameraBuffer.toString('base64')}`;
                    const cameraFileName = cameraRecordingId ? `${cameraRecordingId}.webm` : `camera-${attemptId}-${timestamp}.webm`;
                    
                    const cameraResult = await uploadToCloudinary(
                        cameraBase64,
                        'exam-recordings',
                        'video',
                        cameraFileName
                    );
                    
                    if (cameraResult.success) {
                        cameraPath = cameraResult.url;
                        console.log('✅ Camera video uploaded to Cloudinary:', cameraPath);
                    } else {
                        console.error('❌ Camera video upload failed:', cameraResult.message);
                    }
                } catch (error) {
                    console.error('❌ Camera video upload error:', error);
                }
            }

            if (screenVideo) {
                try {
                    const screenBytes = await screenVideo.arrayBuffer();
                    const screenBuffer = Buffer.from(screenBytes);
                    const screenBase64 = `data:video/webm;base64,${screenBuffer.toString('base64')}`;
                    const screenFileName = screenRecordingId ? `${screenRecordingId}.webm` : `screen-${attemptId}-${timestamp}.webm`;
                    
                    const screenResult = await uploadToCloudinary(
                        screenBase64,
                        'exam-recordings',
                        'video',
                        screenFileName
                    );
                    
                    if (screenResult.success) {
                        screenPath = screenResult.url;
                        console.log('✅ Screen video uploaded to Cloudinary:', screenPath);
                    } else {
                        console.error('❌ Screen video upload failed:', screenResult.message);
                    }
                } catch (error) {
                    console.error('❌ Screen video upload error:', error);
                }
            }
        } else {
            // Cloudinary is disabled - Save locally
            storageMethod = 'local';
            const publicDir = path.join(process.cwd(), 'public');
            const examVideosDir = path.join(publicDir, 'exam-videos');
            const screenVideosDir = path.join(publicDir, 'exam-screen-videos');

            try {
                await mkdir(examVideosDir, { recursive: true });
                await mkdir(screenVideosDir, { recursive: true });

                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

                // Save camera video
                if (cameraVideo) {
                    try {
                        const cameraBytes = await cameraVideo.arrayBuffer();
                        const cameraBuffer = Buffer.from(cameraBytes);
                        const cameraFileName = cameraRecordingId ? `${cameraRecordingId}.webm` : `camera-${attemptId}-${timestamp}.webm`;
                        const cameraFilePath = path.join(examVideosDir, cameraFileName);
                        await writeFile(cameraFilePath, cameraBuffer);
                        cameraPath = `/exam-videos/${cameraFileName}`;
                        console.log('✅ Camera video saved locally:', cameraPath);
                    } catch (error) {
                        console.error('❌ Camera video save error:', error);
                    }
                }

                // Save screen video
                if (screenVideo) {
                    try {
                        const screenBytes = await screenVideo.arrayBuffer();
                        const screenBuffer = Buffer.from(screenBytes);
                        const screenFileName = screenRecordingId ? `${screenRecordingId}.webm` : `screen-${attemptId}-${timestamp}.webm`;
                        const screenFilePath = path.join(screenVideosDir, screenFileName);
                        await writeFile(screenFilePath, screenBuffer);
                        screenPath = `/exam-screen-videos/${screenFileName}`;
                        console.log('✅ Screen video saved locally:', screenPath);
                    } catch (error) {
                        console.error('❌ Screen video save error:', error);
                    }
                }
            } catch (error) {
                console.error('❌ Local storage setup error:', error);
                return NextResponse.json(
                    { 
                        message: 'Failed to create local storage directories',
                        error: error.message
                    },
                    { status: 500 }
                );
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
            message: `Exam recordings saved successfully ${storageMethod === 'cloudinary' ? 'to Cloudinary' : 'locally'}`,
            cameraPath,
            screenPath,
            cameraRecordingId,
            screenRecordingId,
            storageMethod,
            cloudinary: cloudinaryStatus.enabled && cloudinaryStatus.configured,
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