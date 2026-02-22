import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Banner from '@/models/Banner';

// GET /api/banners - Public, returns active banners sorted by order
export async function GET() {
    try {
        await connectDB();
        const banners = await Banner.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
        return NextResponse.json({ success: true, data: banners });
    } catch (error) {
        console.error('Error fetching banners:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
