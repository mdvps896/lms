import { NextResponse } from 'next/server';
import { saveToLocalStorage } from '@/utils/localStorage';

// Configure this route to handle large uploads
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes timeout for large uploads

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const folder = formData.get('folder') || 'large-files';
        const fileName = formData.get('fileName');

        if (!file || !fileName) {
            return NextResponse.json(
                { success: false, message: 'No file or filename provided' },
                { status: 400 }
            )
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Local Storage
        const base64File = `data:${file.type};base64,${buffer.toString('base64')}`;

        const result = await saveToLocalStorage(base64File, folder, fileName);

        return NextResponse.json({
            success: true,
            url: result.url,
            fileName: result.fileName, // Public ID
            message: 'File uploaded successfully',
            size: result.size,
            publicId: result.publicId
        });
    } catch (error) {
        console.error('💥 Upload error:', error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}