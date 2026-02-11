import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SelfieCapture from '@/models/SelfieCapture';
import FreeMaterial from '@/models/FreeMaterial';
import mongoose from 'mongoose';
import { requireAdminOrOwner } from '@/utils/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    try {
        await connectDB();

        const userId = params.id;

        // Auth check
        const authError = await requireAdminOrOwner(request, userId);
        if (authError) return authError;

        // 1. Fetch PDF Data (Selfies)
        // Selfies for "Free Material" course (Dummy ID)
        const dummyCourseId = '000000000000000000000000';

        const selfies = await SelfieCapture.find({
            user: userId,
            course: dummyCourseId
        }).sort({ createdAt: -1 });

        // Group selfies by materialId
        const pdfGrouped = {};
        for (const selfie of selfies) {
            const matId = selfie.lectureId;
            if (!pdfGrouped[matId]) {
                pdfGrouped[matId] = {
                    materialId: matId,
                    materialTitle: 'Unknown Material',
                    selfies: []
                };
            }
            pdfGrouped[matId].selfies.push(selfie);
        }

        // Fetch Material Titles for PDFs
        const pdfMaterialIds = Object.keys(pdfGrouped).filter(id => mongoose.Types.ObjectId.isValid(id));
        if (pdfMaterialIds.length > 0) {
            const materials = await FreeMaterial.find({
                _id: { $in: pdfMaterialIds }
            }).select('title');

            const matMap = {};
            materials.forEach(m => {
                matMap[m._id.toString()] = m.title;
            });

            Object.keys(pdfGrouped).forEach(matId => {
                if (matMap[matId]) {
                    pdfGrouped[matId].materialTitle = matMap[matId];
                }
            });
        }

        // 2. Fetch Free Material Test History
        // Use ExamAttempt model (fresh import to be sure)
        const ExamAttempt = mongoose.models.ExamAttempt || require('@/models/ExamAttempt');

        const testAttempts = await ExamAttempt.find({
            user: userId,
            isFreeMaterial: true
        })
            .populate('exam', 'name')
            .sort({ submittedAt: -1, startedAt: -1 })
            .lean();

        // Enriched test attempts with selfie count
        const enrichedTestAttempts = testAttempts.map(attempt => ({
            ...attempt,
            selfieCount: attempt.verification?.faceVerification?.periodicChecks?.length || 0,
            timeTaken: attempt.timeTaken || 0
        }));

        return NextResponse.json({
            success: true,
            data: {
                pdfHistory: Object.values(pdfGrouped),
                testHistory: enrichedTestAttempts
            }
        });

    } catch (error) {
        console.error('Error fetching free material selfies:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch Data' },
            { status: 500 }
        );
    }
}
