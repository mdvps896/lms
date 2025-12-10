import { NextResponse } from 'next/server';
import { uploadToCloudinary, getCloudinaryStatus } from '@/utils/cloudinary';

// Configure this route to handle uploads with minimal processing
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes timeout for large uploads (Vercel hobby plan limit)

export async function POST(request) {
    try {
        console.log('🔥 Simple upload strategy initiated...');
        
        // Check if Cloudinary is enabled
        const cloudinaryStatus = await getCloudinaryStatus();
        if (!cloudinaryStatus.enabled || !cloudinaryStatus.configured) {
            return NextResponse.json(
                { success: false, message: 'Cloudinary not configured. Please check settings.' },
                { status: 500 }
            );
        }

        // Get file data from request body
        const contentType = request.headers.get('content-type');
        const fileName = request.headers.get('x-filename');
        const folder = request.headers.get('x-folder') || 'uploads';
        const mimeType = request.headers.get('x-mime-type');

        if (!fileName) {
            return NextResponse.json(
                { success: false, message: 'Missing filename header' },
                { status: 400 }
            );
        }

        console.log(`📋 File: ${fileName}, Type: ${mimeType}, Folder: ${folder}`);

        // Read the raw body as buffer
        const arrayBuffer = await request.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const fileSizeMB = (buffer.length / 1024 / 1024).toFixed(2);
        console.log(`📊 File size: ${fileSizeMB} MB`);

        // Create base64 data URL
        const base64File = `data:${mimeType || 'application/octet-stream'};base64,${buffer.toString('base64')}`;
        
        console.log('🚀 Uploading to Cloudinary...');
        
        // Upload to Cloudinary with optimized settings for large files
        const result = await uploadToCloudinary(base64File, folder, 'auto', fileName);
        
        if (result.success) {
            console.log('✅ Simple upload successful:', result.url);
            return NextResponse.json({
                success: true,
                url: result.url,
                publicId: result.publicId,
                message: `File uploaded successfully (${fileSizeMB} MB)`,
                size: buffer.length,
                type: mimeType
            });
        } else {
            console.error('❌ Simple upload failed:', result.message);
            return NextResponse.json(
                { success: false, message: result.message },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('💥 Simple upload error:', error);
        
        // Handle specific errors
        if (error.message?.includes('413')) {
            return NextResponse.json(
                { success: false, message: 'File too large. Try using chunked upload instead.' },
                { status: 413 }
            );
        }
        
        if (error.message?.includes('401')) {
            return NextResponse.json(
                { success: false, message: 'Cloudinary authentication failed. Check API credentials.' },
                { status: 401 }
            );
        }
        
        return NextResponse.json(
            { success: false, message: error.message || 'Upload failed' },
            { status: 500 }
        );
    }
}