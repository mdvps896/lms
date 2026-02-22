import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import NewsTicker from '@/models/NewsTicker';
import { requireAdmin } from '@/utils/apiAuth';

// PUT /api/admin/news-ticker/[id] - Update a ticker item
export async function PUT(request, { params }) {
    try {
        await connectDB();
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const { id } = await params;
        const data = await request.json();

        const ticker = await NewsTicker.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        if (!ticker) {
            return NextResponse.json({ success: false, message: 'Ticker item not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: ticker });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// DELETE /api/admin/news-ticker/[id] - Delete a ticker item
export async function DELETE(request, { params }) {
    try {
        await connectDB();
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const { id } = await params;
        const ticker = await NewsTicker.findByIdAndDelete(id);
        if (!ticker) {
            return NextResponse.json({ success: false, message: 'Ticker item not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Ticker item deleted' });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
