import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SupportMessage from '@/models/SupportMessage';
import User from '@/models/User';
import { requireAdmin } from '@/utils/apiAuth';

export const dynamic = 'force-dynamic';

// GET: Fetch messages for a specific user
export async function GET(request, { params }) {
    try {
        await connectDB();

        // Security check
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const { userId } = params;

        // Update read status for admin
        await SupportMessage.updateMany(
            { user: userId, isAdmin: false, isRead: false },
            { $set: { isRead: true } }
        );

        const messages = await SupportMessage.find({ user: userId })
            .sort({ createdAt: 1 });

        return NextResponse.json({ success: true, data: messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch messages' },
            { status: 500 }
        );
    }
}

// POST: Send a message as admin
export async function POST(request, { params }) {
    try {
        await connectDB();

        // Security check
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const { userId } = params;
        const body = await request.json();
        const { text, images } = body;

        // Get admin user (sender)
        // In a real app, this would come from the session/token. 
        // For now, we'll find an admin user or use a placeholder if auth logic is loose.
        // Assuming requireAdmin verified the user, we can try to get the ID from the request headers if set by middleware,
        // or just find the first admin.

        // Strategy: Find the user making the request if possible, or any admin.
        // Since requireAdmin checks token, we can assume authorized.
        // We'll use the 'sender' field as the admin's ID.

        // For simplicity in this specific "admin panel" context:
        // We will find the admin user.
        const adminUser = await User.findOne({ role: { $regex: /^admin$/i } });
        if (!adminUser) {
            return NextResponse.json({ success: false, message: 'Admin user not found' }, { status: 404 });
        }

        const newMessage = await SupportMessage.create({
            user: userId,
            sender: adminUser._id,
            text,
            images,
            isAdmin: true,
            isRead: false
        });

        return NextResponse.json({ success: true, data: newMessage });
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to send message' },
            { status: 500 }
        );
    }
}

// DELETE: Clear chat for a user
export async function DELETE(request, { params }) {
    try {
        await connectDB();

        // Security check
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const { userId } = params;

        // Delete all messages associated with this user
        await SupportMessage.deleteMany({ user: userId });

        return NextResponse.json({
            success: true,
            message: 'Chat cleared successfully'
        });

    } catch (error) {
        console.error('Error clearing chat:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to clear chat' },
            { status: 500 }
        );
    }
}
