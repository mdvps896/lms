import { NextResponse } from 'next/server';
import { saveToLocalStorage } from '@/utils/localStorage';

// Configure this route to handle uploads with minimal processing
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes timeout for large uploads

export async function POST(request) {
    try {
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

        // Read the raw body as buffer
        const arrayBuffer = await request.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const fileSizeMB = (buffer.length / 1024 / 1024).toFixed(2);
        // Create base64 data URL
        const base64File = `data:${mimeType || 'application/octet-stream'};base64,${buffer.toString('base64')}`;

        // Upload to Local Storage
        const result = await saveToLocalStorage(base64File, folder, fileName);

        return NextResponse.json({
            success: true,
            url: result.url,
            fileName: result.fileName, // Public ID
            message: `File uploaded successfully (${fileSizeMB} MB)`,
            size: result.size,
            type: result.mimeType,
            publicId: result.publicId
        });

    } catch (error) {
        console.error('💥 Simple upload error:', error);

        return NextResponse.json(
            { success: false, message: error.message || 'Upload failed' },
            { status: 500 }
        );
    }
}