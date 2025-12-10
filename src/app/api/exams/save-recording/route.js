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

        console.log('=== Saving recordings ===');
        console.log('Attempt ID:', attemptId);
        console.log('Exam ID:', examId);

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

        if (cloudinaryStatus.enabled && cloudinaryStatus.configured) {
            // Use Cloudinary for storage
            console.log('Uploading to Cloudinary...');
            const timestamp = Date.now();

            // Upload camera video
            if (cameraVideo) {
                const cameraBytes = await cameraVideo.arrayBuffer();
                const cameraBuffer = Buffer.from(cameraBytes);
                const cameraBase64 = `data:video/webm;base64,${cameraBuffer.toString('base64')}`;
                
                const cameraResult = await uploadToCloudinary(
                    cameraBase64,
                    'exam-recordings',
                    'video'
                );
                
                if (cameraResult.success) {
                    cameraPath = cameraResult.url;
                    console.log('Camera video uploaded to Cloudinary:', cameraPath);
                }
            }

            // Upload screen video
            if (screenVideo) {
                const screenBytes = await screenVideo.arrayBuffer();
                const screenBuffer = Buffer.from(screenBytes);
                const screenBase64 = `data:video/webm;base64,${screenBuffer.toString('base64')}`;
                
                const screenResult = await uploadToCloudinary(
                    screenBase64,
                    'exam-recordings',
                    'video'
                );
                
                if (screenResult.success) {
                    screenPath = screenResult.url;
                    console.log('Screen video uploaded to Cloudinary:', screenPath);
                }
            }
        } else if (!isProduction) {
            // Development: Save locally
            const publicDir = path.join(process.cwd(), 'public');
            const examVideosDir = path.join(publicDir, 'exam-videos');
            const screenVideosDir = path.join(publicDir, 'exam-screen-videos');

            await mkdir(examVideosDir, { recursive: true });
            await mkdir(screenVideosDir, { recursive: true });

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

            // Save camera video
            if (cameraVideo) {
                const cameraBytes = await cameraVideo.arrayBuffer();
                const cameraBuffer = Buffer.from(cameraBytes);
                const cameraFileName = `camera-${attemptId}-${timestamp}.webm`;
                const cameraFilePath = path.join(examVideosDir, cameraFileName);
                await writeFile(cameraFilePath, cameraBuffer);
                cameraPath = `/exam-videos/${cameraFileName}`;
                console.log('Camera video saved locally:', cameraPath);
            }

            // Save screen video
            if (screenVideo) {
                const screenBytes = await screenVideo.arrayBuffer();
                const screenBuffer = Buffer.from(screenBytes);
                const screenFileName = `screen-${attemptId}-${timestamp}.webm`;
                const screenFilePath = path.join(screenVideosDir, screenFileName);
                await writeFile(screenFilePath, screenBuffer);
                screenPath = `/exam-screen-videos/${screenFileName}`;
                console.log('Screen video saved locally:', screenPath);
            }
        } else {
            // Production without Cloudinary - error
            return NextResponse.json(
                { 
                    message: 'Cloud storage not configured. Please enable Cloudinary in settings.',
                    error: 'CLOUD_STORAGE_REQUIRED'
                },
                { status: 500 }
            );
        }

        // Update exam attempt with recording paths in Exam model
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
                }
                if (screenPath) {
                    attempt.recordings.screenVideo = screenPath;
                }
                attempt.recordings.recordedAt = new Date();
                
                // Mark the field as modified to ensure Mongoose saves it
                exam.markModified('attempts');
                
                await exam.save();
                console.log('Recordings saved to Exam attempt:', {
                    attemptId,
                    cameraPath,
                    screenPath,
                    recordings: attempt.recordings
                });
            } else {
                console.error('Attempt not found in exam');
            }
        } else {
            console.error('Exam not found');
        }

        return NextResponse.json({
            message: 'Recordings saved successfully',
            cameraPath,
            screenPath
        });
    } catch (error) {
        console.error('Error saving recordings:', error);
        return NextResponse.json(
            { message: 'Failed to save recordings', error: error.message },
            { status: 500 }
        );
    }
}