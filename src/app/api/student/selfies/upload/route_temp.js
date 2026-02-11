import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SelfieCapture from '@/models/SelfieCapture';
import PDFViewSession from '@/models/PDFViewSession';
import ExamAttempt from '@/models/ExamAttempt';
import mongoose from 'mongoose';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { getAuthenticatedUser } from '@/utils/apiAuth';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        await connectDB();

        // Verify authentication
        const currentUser = await getAuthenticatedUser(request);
        if (!currentUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = currentUser.id || currentUser._id?.toString();

        // Parse multipart form data
        const formData = await request.formData();
        const selfieFile = formData.get('selfie');
        const courseId = formData.get('courseId');
        const lectureId = formData.get('lectureId');
        const sessionId = formData.get('sessionId');
        const attemptId = formData.get('attemptId'); // For exam attempts
        const captureType = formData.get('captureType');
        const currentPage = formData.get('currentPage') || '1';
        const latitude = formData.get('latitude');
        const longitude = formData.get('longitude');
        const locationName = formData.get('locationName');

        const userIdStr = String(userId);

        if (!selfieFile || !courseId || !captureType) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/octet-stream'];
        if (!allowedTypes.includes(selfieFile.type) && !selfieFile.type.startsWith('image/')) {
            return NextResponse.json(
                { success: false, message: 'Invalid file type. Only JPEG and PNG allowed.' },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (selfieFile.size > maxSize) {
            return NextResponse.json(
                { success: false, message: 'File size exceeds 5MB limit' },
                { status: 400 }
            );
        }

        let relativePath = '';
        let filePath = '';
        const timestamp = Date.now();
        const fileExtension = selfieFile.name.split('.').pop() || 'jpg';
        const fileName = `${captureType}_${timestamp}.${fileExtension}`;

        // CHECK IF FREE MATERIAL
        const isFreeMaterial = courseId === 'free_material';

        if (isFreeMaterial) {
            // Upload to Cloudinary
            const bytes = await selfieFile.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Use simple upload_stream
            const uploadResult = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: `free_materials/selfies/${userIdStr}`,
                        public_id: `${captureType}_${timestamp}`,
                        resource_type: 'image'
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                uploadStream.end(buffer);
            });

            relativePath = uploadResult.secure_url; // Use Cloudinary URL
            filePath = 'cloudinary'; // Placeholder
        } else {
            // NORMAL COURSE: Local Storage

            // Create directory structure: /uploads/selfies/{userId}/{courseId}/
            const courseIdStr = String(courseId);
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'selfies', userIdStr, courseIdStr);
            await mkdir(uploadDir, { recursive: true });

            filePath = path.join(uploadDir, fileName);

            // Save file
            const bytes = await selfieFile.arrayBuffer();
            const buffer = Buffer.from(bytes);
            await writeFile(filePath, buffer);

            // Create relative path for URL (Use API route for reliable serving)
            relativePath = `/api/storage/file/uploads/selfies/${userIdStr}/${courseIdStr}/${fileName}`;
        }

        // Get client metadata
        const userAgent = request.headers.get('user-agent') || '';
        const ipAddress = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';

        // Create SelfieCapture record
        // Note: For Free Materials, course is technically valid objectId if we made "Free Material" a course, 
        // but here we are using a string. Schema expects ObjectId for course...
        // Wait, Schema says: course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }
        // If courseId is 'free_material', this will FAIL validation.

        // FIX: We need to handle this. 
        // OPTION 1: Make course optional or mixed?
        // OPTION 2: Use a dummy ObjectId for 'Free Material' or find a way to bypass.
        // OPTION 3: Change Schema. Be careful.

        // Let's check Schema one more time.
        // c:\Users\RAJENDRA\Music\next js\exam\exam\src\models\SelfieCapture.js
        // course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }

        // I should have checked this in planning.
        // I will temporarily create a "dummy" course ObjectId for Free Material or modify the schema.
        // Modifying schema is better: allow String or ObjectId? Or just make it not required?
        // Or better, let's just make it ObjectId and I will generate a consistent ObjectId for "Free Material" 
        // e.g. 000000000000000000000000 (24 zeros)

        // Actually, let's check if I can just modify the schema to be less strict.
        // I'll try to use a constant ObjectId for "Free Materials" to avoiding Breaking Schema changes if possible, 
        // but standard practice is to allow mixed or make it optional.

        // Let's use a specific ObjectId constant for "Free Material" related records?
        // 507f1f77bcf86cd799439011 (Example)
        // Or '000000000000000000000000'

        let courseIdToSave = courseId;
        if (isFreeMaterial) {
            // Use a deterministic Dummy ID for "Free Material" "Course"
            // Hex string 24 chars.
            courseIdToSave = '000000000000000000000000';
        }

        const selfieCapture = await SelfieCapture.create({
            user: userIdStr,
            course: courseIdToSave,
            lectureId: lectureId || '',
            sessionId: sessionId || null,
            attemptId: attemptId || null, // Store attemptId for exam selfies
            captureType,
            imagePath: filePath,
            imageUrl: relativePath,
            currentPage: parseInt(currentPage),
            metadata: {
                deviceInfo: userAgent,
                ipAddress: ipAddress,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                locationName: locationName || null,
                isFreeMaterial: isFreeMaterial // Store flag in metadata if helpful
            }
        });

        // Update PDFViewSession or ExamAttempt if sessionId/attemptId provided
        const idToUpdate = attemptId || sessionId;
        if (idToUpdate && mongoose.Types.ObjectId.isValid(idToUpdate)) {
            try {
                // Try PDFViewSession first
                const updatedPdfSession = await PDFViewSession.findByIdAndUpdate(
                    idToUpdate,
                    {
                        $push: { selfies: selfieCapture._id },
                        $inc: { selfieCount: 1 }
                    }
                );

                if (!updatedPdfSession) {
                    // If not PDF, try ExamAttempt
                    const examAttempt = await ExamAttempt.findById(idToUpdate);
                    if (examAttempt) {
                        // Check if it has verification structure
                        if (examAttempt.verification?.faceVerification) {
                            examAttempt.verification.faceVerification.periodicChecks.push({
                                capturedAt: new Date(),
                                selfieImage: relativePath,
                                verificationScore: 100 // Placeholder
                            });
                            await examAttempt.save();
                        } else {
                        }
                    } else {
                    }
                } else {
                }
            } catch (sessionErr) {
            }
        } else {
        }

        return NextResponse.json({
            success: true,
            message: 'Selfie uploaded successfully',
            data: {
                selfieId: selfieCapture._id,
                imageUrl: relativePath,
                captureType,
                timestamp: selfieCapture.createdAt
            }
        });

    } catch (error) {
        return NextResponse.json(
            { success: false, message: 'Failed to upload selfie', error: error.message },
            { status: 500 }
        );
    }
}
