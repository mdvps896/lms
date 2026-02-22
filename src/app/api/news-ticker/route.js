import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import NewsTicker from '@/models/NewsTicker';

export const dynamic = 'force-dynamic';

// GET /api/news-ticker - Public endpoint for mobile app
export async function GET() {
    try {
        await connectDB();

        const tickers = await NewsTicker.find({ active: true })
            .sort({ order: 1, createdAt: -1 })
            .lean();

        return NextResponse.json({ success: true, data: tickers });
    } catch (error) {
        console.error('Error fetching news ticker:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
