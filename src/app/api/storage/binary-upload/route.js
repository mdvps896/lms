import { NextResponse } from 'next/server';
import { uploadToCloudinary, getCloudinaryStatus } from '@/utils/cloudinary';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request) {
    try {
        console.log('🎯 Binary upload API called...');
        
        // Check Cloudinary status
        const cloudinaryStatus = await getCloudinaryStatus();
        if (!cloudinaryStatus.enabled || !cloudinaryStatus.configured) {
            return NextResponse.json(
                { success: false, message: 'Cloudinary not configured' },
                { status: 500 }
            );
        }

        // Get upload parameters from headers
        const fileName = request.headers.get('x-filename');
        const folder = request.headers.get('x-folder') || 'binary-uploads';
        const mimeType = request.headers.get('x-mime-type') || 'application/octet-stream';
        
        if (!fileName) {
            return NextResponse.json(
                { success: false, message: 'Missing filename header' },
                { status: 400 }
            );
        }

        // Read the raw binary data
        const arrayBuffer = await request.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        console.log(`📁 File: ${fileName}`);
        console.log(`📏 Size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
        console.log(`📂 Folder: ${folder}`);
        console.log(`📋 MIME Type: ${mimeType}`);

        // Convert to base64
        const base64File = `data:${mimeType};base64,${buffer.toString('base64')}`;
        
        console.log('⬆️ Uploading to Cloudinary with enhanced system...');
        
        // Use enhanced Cloudinary upload
        const result = await uploadToCloudinary(base64File, folder, 'auto', fileName);
        
        if (result.success) {
            console.log('🎉 Binary upload successful!');
            return NextResponse.json({
                success: true,
                url: result.url,
                publicId: result.publicId,
                message: 'File uploaded successfully via binary method',
                fileSize: buffer.length,
                fileName: fileName,
                compressed: result.compressed || false,
                chunked: result.chunked || false
            });
        } else {
            console.error('❌ Binary upload failed:', result.error);
            return NextResponse.json(
                { success: false, message: result.error },
                { status: 500 }
            );
        }
        
    } catch (error) {
        console.error('💥 Binary upload error:', error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}