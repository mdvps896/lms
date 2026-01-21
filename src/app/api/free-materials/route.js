import path from 'path';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FreeMaterial from '@/models/FreeMaterial';
import Category from '@/models/Category';
import Subject from '@/models/Subject';
import { saveFileLocally } from '@/utils/localFileStorage';

import Question from '@/models/Question';
import Exam from '@/models/Exam'; // Import Exam model

export async function GET(request) {
    try {
        await connectDB();
        const materials = await FreeMaterial.find({})
            .populate('category', 'name')
            .populate('subject', 'name')
            .populate({
                path: 'testId',
                model: Exam, // Explicitly specify the model to use
                select: 'name questionGroups',
                options: { strictPopulate: false }
            })
            .sort({ createdAt: -1 });

        // Transform testId data to match expected format
        const transformedMaterials = await Promise.all(materials.map(async (material) => {
            const materialObj = material.toObject();

            if (materialObj.testId) {
                let totalQuestions = 0;
                if (materialObj.testId.questionGroups && materialObj.testId.questionGroups.length > 0) {
                    // Extract IDs depending on whether questionGroups are populated objects or just IDs
                    // populate options above suggest they might be populated if strictPopulate allows, 
                    // but we only selected 'name questionGroups'. 
                    // If they are just IDs in the array or objects, we handle both.
                    const groupIds = materialObj.testId.questionGroups.map(g => g._id || g);

                    totalQuestions = await Question.countDocuments({
                        questionGroup: { $in: groupIds }
                    });
                }

                materialObj.testId = {
                    ...materialObj.testId,
                    title: materialObj.testId.name,
                    questions: { length: totalQuestions }
                };
            }

            return materialObj;
        }));

        return NextResponse.json({ success: true, data: transformedMaterials });
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

        const materialType = data.type || 'document'; // default to document

        // Validate based on type
        if (materialType === 'test') {
            if (!data.testId) {
                return NextResponse.json({ success: false, message: 'Test ID is required for test materials' }, { status: 400 });
            }
        } else {
            if (!data.files || !Array.isArray(data.files) || data.files.length === 0) {
                return NextResponse.json({ success: false, message: 'At least one file is required' }, { status: 400 });
            }
        }

        let processedFiles = [];
        let testId = null;

        if (materialType === 'test') {
            // For test type, store the testId
            testId = data.testId;
        } else {
            // Handle File Uploads for document/video types
            if (data.files && Array.isArray(data.files)) {
                for (const file of data.files) {
                    // Check if it's a base64 data URI (new upload)
                    if (file.fileData && file.fileData.startsWith('data:')) {
                        // Save locally
                        const uploadResult = await saveFileLocally(file.fileData, 'uploads/materials', file.title);

                        // Determine type based on extension or material type
                        const ext = path.extname(uploadResult.originalName || '').toLowerCase();
                        let fileType = materialType; // Use material type (document/video)

                        const vidExts = ['.mp4', '.mkv', '.avi', '.webm', '.mov', '.3gp', '.flv', '.m4v'];
                        const docExts = ['.pdf', '.txt', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];

                        if (vidExts.includes(ext)) fileType = 'video';
                        else if (docExts.includes(ext)) fileType = (ext === '.pdf' ? 'pdf' : 'doc');

                        processedFiles.push({
                            title: file.title || uploadResult.originalName,
                            url: `/api/storage/file${uploadResult.url}`,
                            type: fileType,
                            size: uploadResult.size
                        });
                    } else if (file.url) {
                        // Valid link without upload (or external link)
                        processedFiles.push(file);
                    }
                }
            }
        }

        const newMaterial = await FreeMaterial.create({
            title: data.title,
            type: materialType,
            category: data.category,
            subject: data.subject || null,
            files: processedFiles,
            testId: testId
        });

        return NextResponse.json({ success: true, data: newMaterial });

    } catch (error) {
        console.error('Error creating free material:', error);
        const message = error.message || 'Failed to create material';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
