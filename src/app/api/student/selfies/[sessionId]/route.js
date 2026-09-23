import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SelfieCapture from '@/models/SelfieCapture';
import ExamAttempt from '@/models/ExamAttempt';
import mongoose from 'mongoose';
import { verifyToken } from '@/utils/auth';

export async function GET(request, { params }) {
    try {
        await connectDB();

        // Verify authentication
        const token = request.headers.get('authorization')?.replace('Bearer ', '') || request.cookies.get('token')?.value;
        if (!token) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json(
                { success: false, message: 'Invalid token' },
                { status: 401 }
            );
        }

        const { sessionId } = params;

        if (!sessionId) {
            return NextResponse.json(
                { success: false, message: 'Session/Attempt ID is required' },
                { status: 400 }
            );
        }

        // Fetch selfies - try both sessionId (for PDFs) and attemptId (for Exams)
        const selfies = await SelfieCapture.find({
            $or: [
                { sessionId },
                { attemptId: sessionId } // The param could be an attemptId for exam selfies
            ]
        })
            .sort({ createdAt: 1 }) // Chronological order
            .select('imageUrl captureType currentPage createdAt metadata')
            .lean();

        // Exam selfies are also recorded on the attempt itself. That list is
        // what the "Selfies" count is based on, so merge in any photo that has
        // no SelfieCapture document — otherwise the table says 1 and the
        // viewer says 0.
        if (mongoose.Types.ObjectId.isValid(sessionId)) {
            const attempt = await ExamAttempt.findById(sessionId)
                .select('verification.faceVerification.periodicChecks')
                .lean();
            const checks = attempt?.verification?.faceVerification?.periodicChecks || [];
            const knownUrls = new Set(selfies.map(s => s.imageUrl));
            checks.forEach((check, index) => {
                if (!check.selfieImage || knownUrls.has(check.selfieImage)) return;
                knownUrls.add(check.selfieImage);
                selfies.push({
                    _id: check._id || `${sessionId}_${index}`,
                    imageUrl: check.selfieImage,
                    captureType: index === 0 ? 'exam_initial' : 'exam_periodic',
                    createdAt: check.capturedAt,
                    fromAttempt: true
                });
            });
            selfies.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }

        return NextResponse.json({
            success: true,
            data: selfies,
            count: selfies.length
        });

    } catch (error) {
        console.error('Error fetching session selfies:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch selfies', error: error.message },
            { status: 500 }
        );
    }
}
