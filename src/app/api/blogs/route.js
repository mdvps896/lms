import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Blog from '@/models/Blog';

export const dynamic = 'force-dynamic';

// GET /api/blogs - Public endpoint, paginated
export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '4');
        const category = searchParams.get('category') || '';
        const skip = (page - 1) * limit;

        const query = { status: 'published' };
        if (category) query.category = category;

        const [blogs, total] = await Promise.all([
            Blog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Blog.countDocuments(query),
        ]);

        return NextResponse.json({
            success: true,
            data: blogs,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            hasMore: skip + blogs.length < total,
        });
    } catch (error) {
        console.error('Error fetching blogs:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
