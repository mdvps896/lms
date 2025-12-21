import { NextResponse } from 'next/server';
import { saveToLocalStorage } from '@/utils/localStorage';

// Configure this route to handle large uploads
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes timeout for large uploads

export async function POST(request) {
    try {
        console.log('🚀 Starting Local upload process...');

        const formData = await request.formData();
        const file = formData.get('file');
        const folder = formData.get('folder') || 'large-files';
        const fileName = formData.get('fileName');

        console.log(`📦 Processing file ${fileName}`)

        if (!file || !fileName) {
            return NextResponse.json(
                { success: false, message: 'No file or filename provided' },
                { status: 400 }
            )
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        console.log(`📊 File size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

        // Upload to Local Storage
        const base64File = `data:${file.type};base64,${buffer.toString('base64')}`;

        console.log('📤 Saving to Local Storage...');
        const result = await saveToLocalStorage(base64File, folder, fileName);

        console.log('✅ File upload successful to Local Storage!');
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