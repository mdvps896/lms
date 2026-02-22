import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Banner from '@/models/Banner';
import { requireAdmin } from '@/utils/apiAuth';

// PUT /api/admin/banners/[id] - Update a banner
export async function PUT(request, { params }) {
    try {
        await connectDB();
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const data = await request.json();
        const banner = await Banner.findByIdAndUpdate(
            params.id,
            {
                name: data.name,
                image: data.image,
                linkType: data.linkType,
                link: data.link,
                order: data.order,
                isActive: data.isActive,
            },
            { new: true, runValidators: true }
        );

        if (!banner) {
            return NextResponse.json({ success: false, message: 'Banner not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: banner });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// DELETE /api/admin/banners/[id] - Delete a banner
export async function DELETE(request, { params }) {
    try {
        await connectDB();
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const banner = await Banner.findByIdAndDelete(params.id);
        if (!banner) {
            return NextResponse.json({ success: false, message: 'Banner not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: 'Banner deleted successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
