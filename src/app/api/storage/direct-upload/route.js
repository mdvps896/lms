import { NextResponse } from 'next/server';
import { saveToLocalStorage } from '@/utils/localStorage';

// Configure for large uploads
export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request) {
    try {
        console.log('🚀 Direct Local upload started...');

        // Get the raw body as buffer to avoid size limits
        const body = await request.arrayBuffer();
        const buffer = Buffer.from(body);

        console.log(`📊 Received data: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

        // Parse multipart form data manually for large files
        const boundary = request.headers.get('content-type')?.split('boundary=')[1];
        if (!boundary) {
            return NextResponse.json(
                { success: false, message: 'Invalid multipart data' },
                { status: 400 }
            );
        }

        // Simple multipart parsing for file upload
        const parts = buffer.toString('binary').split('--' + boundary);
        let fileData = null;
        let fileName = '';
        let folder = 'direct-uploads';
        let mimeType = 'application/octet-stream';

        for (const part of parts) {
            if (part.includes('Content-Disposition: form-data')) {
                const lines = part.split('\r\n');

                // Check if this is the file part
                if (part.includes('filename=')) {
                    const nameMatch = part.match(/name="([^"]+)"/);
                    const filenameMatch = part.match(/filename="([^"]+)"/);
                    const typeMatch = part.match(/Content-Type: ([^\r\n]+)/);

                    if (filenameMatch) {
                        fileName = filenameMatch[1];
                        if (typeMatch) {
                            mimeType = typeMatch[1];
                        }

                        // Find the file data (after double CRLF)
                        const dataStartIndex = part.indexOf('\r\n\r\n') + 4;
                        if (dataStartIndex > 3) {
                            const fileDataBinary = part.substring(dataStartIndex);
                            // Convert binary string back to buffer
                            fileData = Buffer.from(fileDataBinary, 'binary');
                        }
                    }
                } else if (part.includes('name="folder"')) {
                    const dataStartIndex = part.indexOf('\r\n\r\n') + 4;
                    if (dataStartIndex > 3) {
                        folder = part.substring(dataStartIndex).trim();
                    }
                }
            }
        }

        if (!fileData || !fileName) {
            return NextResponse.json(
                { success: false, message: 'No file data found' },
                { status: 400 }
            );
        }

        console.log(`📁 File: ${fileName}`);
        console.log(`📏 Size: ${(fileData.length / 1024 / 1024).toFixed(2)} MB`);
        console.log(`📂 Folder: ${folder}`);
        console.log(`📋 Type: ${mimeType}`);

        // Convert to base64 for Local Storage
        const base64File = `data:${mimeType};base64,${fileData.toString('base64')}`;

        console.log('⬆️ Saving to Local Storage...');
        const result = await saveToLocalStorage(base64File, folder, fileName);

        console.log('🎉 Direct upload successful to Local Storage!');
        return NextResponse.json({
            success: true,
            url: result.url,
            fileName: result.fileName, // Public ID
            message: 'File uploaded successfully via direct method',
            fileSize: result.size,
            originalName: result.originalName,
            publicId: result.publicId
        });

    } catch (error) {
        console.error('💥 Direct upload error:', error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}