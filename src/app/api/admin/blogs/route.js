import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Blog from '@/models/Blog';
import { requireAdmin, getAuthenticatedUser } from '@/utils/apiAuth';
import { sendBlogPublishNotification } from '@/lib/sendBlogNotification';

// GET /api/admin/blogs - All blogs for admin
export async function GET(request) {
    try {
        await connectDB();
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const blogs = await Blog.find({}).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, data: blogs });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// POST /api/admin/blogs - Create a new blog
export async function POST(request) {
    try {
        await connectDB();
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const data = await request.json();
        if (!data.title || !data.content) {
            return NextResponse.json({ success: false, message: 'Title and content are required' }, { status: 400 });
        }

        const blog = await Blog.create({
            name: data.name || data.title,
            title: data.title,
            content: data.content,
            image: data.image || '',
            category: data.category || 'General',
            status: data.status || 'draft',
            downloadable: data.downloadable || false,
        });

        // Send push notification to all students if blog is published
        if (blog.status === 'published') {
            const adminUser = await getAuthenticatedUser(request);
            if (adminUser) {
                sendBlogPublishNotification(blog, adminUser._id).catch(err => {
                    console.error('Blog notification error:', err);
                });
            }
        }

        return NextResponse.json({ success: true, data: blog });
    } catch (error) {
        console.error('Error creating blog:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

