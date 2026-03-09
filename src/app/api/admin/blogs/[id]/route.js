import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Blog from '@/models/Blog';
import { requireAdmin, getAuthenticatedUser } from '@/utils/apiAuth';
import { sendBlogPublishNotification } from '@/lib/sendBlogNotification';

// GET /api/admin/blogs/[id]
export async function GET(request, { params }) {
    try {
        await connectDB();
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const { id } = await params;
        const blog = await Blog.findById(id);
        if (!blog) return NextResponse.json({ success: false, message: 'Blog not found' }, { status: 404 });
        return NextResponse.json({ success: true, data: blog });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// PUT /api/admin/blogs/[id] - Update a blog
export async function PUT(request, { params }) {
    try {
        await connectDB();
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const { id } = await params;
        const data = await request.json();

        // Get the current blog to check previous status
        const previousBlog = await Blog.findById(id);
        const wasPublished = previousBlog?.status === 'published';

        const blog = await Blog.findByIdAndUpdate(
            id,
            {
                name: data.name,
                title: data.title,
                content: data.content,
                image: data.image,
                category: data.category,
                status: data.status,
                downloadable: data.downloadable,
                updatedAt: new Date(),
            },
            { new: true, runValidators: true }
        );

        if (!blog) return NextResponse.json({ success: false, message: 'Blog not found' }, { status: 404 });

        // Send push notification if blog was just published (status changed to published)
        if (blog.status === 'published' && !wasPublished) {
            const adminUser = await getAuthenticatedUser(request);
            if (adminUser) {
                sendBlogPublishNotification(blog, adminUser._id).catch(err => {
                    console.error('Blog notification error:', err);
                });
            }
        }

        return NextResponse.json({ success: true, data: blog });
    } catch (error) {
        console.error('Error updating blog:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// DELETE /api/admin/blogs/[id] - Delete a blog
export async function DELETE(request, { params }) {
    try {
        await connectDB();
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const { id } = await params;
        const blog = await Blog.findByIdAndDelete(id);
        if (!blog) return NextResponse.json({ success: false, message: 'Blog not found' }, { status: 404 });
        return NextResponse.json({ success: true, message: 'Blog deleted successfully' });
    } catch (error) {
        console.error('Error deleting blog:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
