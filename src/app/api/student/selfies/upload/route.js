import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SelfieCapture from '@/models/SelfieCapture';
import PDFViewSession from '@/models/PDFViewSession';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getAuthenticatedUser } from '@/utils/apiAuth';

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
        const captureType = formData.get('captureType');
        const currentPage = formData.get('currentPage') || '1';
        const latitude = formData.get('latitude');
        const longitude = formData.get('longitude');
        const locationName = formData.get('locationName');

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

        // Create directory structure: /uploads/selfies/{userId}/{courseId}/
        const userIdStr = String(userId);
        const courseIdStr = String(courseId);
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'selfies', userIdStr, courseIdStr);
        await mkdir(uploadDir, { recursive: true });

        // Generate unique filename
        const timestamp = Date.now();
        const fileExtension = selfieFile.name.split('.').pop() || 'jpg';
        const fileName = `${captureType}_${timestamp}.${fileExtension}`;
        const filePath = path.join(uploadDir, fileName);

        // Save file
        const bytes = await selfieFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // Create relative path for URL (Use API route for reliable serving)
        const relativePath = `/api/storage/file/uploads/selfies/${userIdStr}/${courseIdStr}/${fileName}`;

        // Get client metadata
        const userAgent = request.headers.get('user-agent') || '';
        const ipAddress = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';

        // Create SelfieCapture record
        const selfieCapture = await SelfieCapture.create({
            user: userIdStr,
            course: courseIdStr,
            lectureId: lectureId || '',
            sessionId: sessionId || null,
            captureType,
            imagePath: filePath,
            imageUrl: relativePath,
            currentPage: parseInt(currentPage),
            metadata: {
                deviceInfo: userAgent,
                ipAddress: ipAddress,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                locationName: locationName || null
            }
        });

        // Update PDFViewSession if sessionId provided
        if (sessionId) {
            await PDFViewSession.findByIdAndUpdate(
                sessionId,
                {
                    $push: { selfies: selfieCapture._id },
                    $inc: { selfieCount: 1 }
                }
            );
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
        console.error('Error uploading selfie:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to upload selfie', error: error.message },
            { status: 500 }
        );
    }
}
