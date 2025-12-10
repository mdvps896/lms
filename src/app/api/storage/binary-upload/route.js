import { NextResponse } from 'next/server';
import { saveToLocalStorage } from '@/utils/localStorage';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request) {
    try {
        console.log('🎯 Binary upload API called...');

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
        
        console.log('⬆️ Uploading to local storage...');
        
        // Upload to local storage
        const result = await saveToLocalStorage(base64File, folder, fileName);
        
        console.log('🎉 Binary upload successful!');
        return NextResponse.json({
            success: true,
            url: result.url,
            fileName: result.fileName,
            message: 'File uploaded successfully via binary method',
            fileSize: result.size,
            originalName: result.originalName
        });
        
    } catch (error) {
        console.error('💥 Binary upload error:', error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}