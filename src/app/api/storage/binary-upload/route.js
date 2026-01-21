import { NextResponse } from 'next/server';
import { saveToLocalStorage } from '@/utils/localStorage';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request) {
    try {
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

        // Convert to base64
        const base64File = `data:${mimeType};base64,${buffer.toString('base64')}`;

        // Upload to Local Storage
        const result = await saveToLocalStorage(base64File, folder, fileName);

        return NextResponse.json({
            success: true,
            url: result.url,
            fileName: result.fileName, // Public ID
            message: 'File uploaded successfully via binary method',
            fileSize: result.size,
            originalName: result.originalName,
            publicId: result.publicId
        });

    } catch (error) {
        console.error('💥 Binary upload error:', error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}