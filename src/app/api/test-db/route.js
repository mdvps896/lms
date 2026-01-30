import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Question from '@/models/Question';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    await connectDB();
    const questions = await Question.find().sort({ createdAt: -1 }).limit(5).lean();
    return NextResponse.json({
        success: true,
        data: questions.map(q => ({
            _id: q._id,
            text: q.questionText?.substring(0, 20),
            createdBy: q.createdBy,
            isDeleted: q.isDeleted
        }))
    });
}
