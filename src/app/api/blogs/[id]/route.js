import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Blog from '@/models/Blog';

export const dynamic = 'force-dynamic';

// GET /api/blogs/[id] - Public endpoint to get a single published blog
export async function GET(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;

        const blog = await Blog.findOne({ _id: id, status: 'published' });
        if (!blog) {
            return NextResponse.json({ success: false, message: 'Blog not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: blog });
    } catch (error) {
        console.error('Error fetching blog:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
