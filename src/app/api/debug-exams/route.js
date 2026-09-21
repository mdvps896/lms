
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ExamAttempt from '@/models/ExamAttempt';
import { requireAdmin } from '@/utils/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
        }
        const authError = await requireAdmin(request);
        if (authError) return authError;

        await connectDB();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        
        const attempts = await ExamAttempt.find({ user: userId }).lean();
        
        const summary = attempts.map(a => ({
            id: a._id,
            startedAt: a.startedAt,
            submittedAt: a.submittedAt,
            timeTaken: a.timeTaken,
            status: a.status
        }));

        return NextResponse.json({ 
            count: attempts.length,
            summary 
        });
    } catch (error) {
        return NextResponse.json({ error: error.message });
    }
}
