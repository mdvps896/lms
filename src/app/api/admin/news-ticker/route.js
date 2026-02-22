import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import NewsTicker from '@/models/NewsTicker';
import { requireAdmin } from '@/utils/apiAuth';

// GET /api/admin/news-ticker - Get all news ticker items (admin)
export async function GET(request) {
    try {
        await connectDB();
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const tickers = await NewsTicker.find({}).sort({ order: 1, createdAt: -1 });
        return NextResponse.json({ success: true, data: tickers });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// POST /api/admin/news-ticker - Create a new ticker item
export async function POST(request) {
    try {
        await connectDB();
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const data = await request.json();
        if (!data.content) {
            return NextResponse.json({ success: false, message: 'Content is required' }, { status: 400 });
        }

        const ticker = await NewsTicker.create({
            content: data.content,
            link: data.link || '',
            linkType: data.linkType || 'external',
            referenceId: data.referenceId || '',
            order: data.order ?? 0,
            active: data.active !== undefined ? data.active : true,
        });

        return NextResponse.json({ success: true, data: ticker });
    } catch (error) {
        console.error('Error creating news ticker:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
