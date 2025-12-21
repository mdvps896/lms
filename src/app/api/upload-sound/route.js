import { NextResponse } from 'next/server';
import { saveToLocalStorage } from '@/utils/localStorage';
import path from 'path';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const type = formData.get('type');

        if (!file) {
            return NextResponse.json(
                { message: 'No file uploaded', success: false },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const base64 = buffer.toString('base64');
        const mimeType = file.type || 'audio/mpeg'; // Default to mp3 if unknown, or auto
        const fileData = `data:${mimeType};base64,${base64}`;

        // Generate unique filename
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const fileName = `${type}-${timestamp}.${fileExtension}`;

        console.log('Saving sound locally:', fileName);

        // Upload to Local Storage
        const result = await saveToLocalStorage(fileData, 'sounds', fileName);

        console.log('Sound saved:', result.url);

        // Return the public URL
        // Cloudinary returns full URL, which is good.

        return NextResponse.json({
            success: true,
            filePath: result.url,
            message: 'File uploaded successfully',
            publicId: result.publicId
        });
    } catch (error) {
        console.error('Error uploading file to Cloudinary:', error);
        return NextResponse.json(
            { message: 'Failed to upload file', error: error.message, success: false },
            { status: 500 }
        );
    }
}
