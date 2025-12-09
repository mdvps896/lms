import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
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

        // Create sounds directory if it doesn't exist
        const soundsDir = path.join(process.cwd(), 'public', 'sounds');
        try {
            await mkdir(soundsDir, { recursive: true });
        } catch (error) {
            // Directory might already exist
        }

        // Generate unique filename
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const fileName = `${type}-${timestamp}.${fileExtension}`;
        const filePath = path.join(soundsDir, fileName);

        // Write file
        await writeFile(filePath, buffer);

        // Return the public URL
        const publicPath = `/sounds/${fileName}`;

        return NextResponse.json({
            success: true,
            filePath: publicPath,
            message: 'File uploaded successfully'
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json(
            { message: 'Failed to upload file', error: error.message, success: false },
            { status: 500 }
        );
    }
}
