import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Banner from '@/models/Banner';
import { requireAdmin } from '@/utils/apiAuth';

// GET /api/admin/banners - All banners (including inactive) for admin
export async function GET(request) {
    try {
        await connectDB();
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const banners = await Banner.find({}).sort({ order: 1, createdAt: -1 });
        return NextResponse.json({ success: true, data: banners });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// POST /api/admin/banners - Create a new banner
export async function POST(request) {
    try {
        await connectDB();
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const data = await request.json();
        if (!data.name || !data.image) {
            return NextResponse.json({ success: false, message: 'Name and image are required' }, { status: 400 });
        }

        const banner = await Banner.create({
            name: data.name,
            image: data.image,
            linkType: data.linkType || 'none',
            link: data.link || '',
            order: data.order ?? 0,
            isActive: data.isActive !== false,
        });

        return NextResponse.json({ success: true, data: banner });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
