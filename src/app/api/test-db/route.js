import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Question from '@/models/Question';
import { requireAdmin } from '@/utils/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }
    const authError = await requireAdmin(request);
    if (authError) return authError;

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
