import path from 'path';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FreeMaterial from '@/models/FreeMaterial';
import Category from '@/models/Category';
import Subject from '@/models/Subject';
import { saveFileLocally } from '@/utils/localFileStorage';

export async function GET(request) {
    try {
        await connectDB();
        const materials = await FreeMaterial.find({})
            .populate('category', 'name')
            .populate('subject', 'name')
            .sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: materials });
    } catch (error) {
        console.error('Error fetching free materials:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await connectDB();
        const data = await request.json();

        // Validation
        if (!data.title || !data.category) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        // Handle File Uploads
        let processedFiles = [];
        if (data.files && Array.isArray(data.files)) {
            for (const file of data.files) {
                // Check if it's a base64 data URI (new upload)
                if (file.fileData && file.fileData.startsWith('data:')) {
                    // Save locally
                    const uploadResult = await saveFileLocally(file.fileData, 'uploads/materials', file.title);

                    // Determine type based on extension
                    const ext = path.extname(uploadResult.originalName || '').toLowerCase();
                    let fileType = 'file';
                    const vidExts = ['.mp4', '.mkv', '.avi', '.webm', '.mov', '.3gp', '.flv', '.m4v'];
                    const docExts = ['.pdf', '.txt', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];

                    if (vidExts.includes(ext)) fileType = 'video';
                    else if (docExts.includes(ext)) fileType = (ext === '.pdf' ? 'pdf' : 'doc'); // Corrected logic for docExts

                    processedFiles.push({
                        title: file.title || uploadResult.originalName,
                        url: uploadResult.url,
                        type: fileType,
                        size: uploadResult.size
                    });
                } else if (file.url) {
                    // Valid link without upload (or external link)
                    processedFiles.push(file);
                }
            }
        }

        const newMaterial = await FreeMaterial.create({
            title: data.title,
            category: data.category,
            subject: data.subject || null, // Ensure null if undefined/empty logic
            files: processedFiles
        });

        return NextResponse.json({ success: true, data: newMaterial });

    } catch (error) {
        console.error('Error creating free material:', error);
        // Optimize error message
        const message = error.message || 'Failed to create material';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
