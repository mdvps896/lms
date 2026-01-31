import path from 'path';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FreeMaterial from '@/models/FreeMaterial';
import Question from '@/models/Question';
import Exam from '@/models/Exam';
import { saveFileLocally } from '@/utils/localFileStorage';
import { requireAdmin } from '@/utils/apiAuth';

export async function GET(request) {
    try {
        await connectDB();
        const materials = await FreeMaterial.find({})
            .populate('category', 'name')
            .populate('subject', 'name')
            .populate({
                path: 'testId',
                model: Exam,
                select: 'name questionGroups',
                options: { strictPopulate: false }
            })
            .sort({ createdAt: -1 });

        const transformedMaterials = await Promise.all(materials.map(async (material) => {
            const materialObj = material.toObject();

            if (materialObj.testId) {
                let totalQuestions = 0;
                if (materialObj.testId.questionGroups && materialObj.testId.questionGroups.length > 0) {
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

        // Security: Admin only
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const data = await request.json();

        // Validation
        if (!data.title || !data.category) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        const materialType = data.type || 'document';

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
            testId = data.testId;
        } else {
            if (data.files && Array.isArray(data.files)) {
                for (const file of data.files) {
                    if (file.fileData && file.fileData.startsWith('data:')) {
                        const uploadResult = await saveFileLocally(file.fileData, 'uploads/materials', file.title);
                        const ext = path.extname(uploadResult.originalName || '').toLowerCase();
                        let fileType = materialType;

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
        return NextResponse.json({ success: false, message: error.message || 'Failed to create material' }, { status: 500 });
    }
}
