import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SupportMessage from '@/models/SupportMessage';
import { getAuthenticatedUser } from '@/utils/apiAuth';

export async function POST(request) {
    try {
        await connectDB();
        const body = await request.json();
        const { userId, senderId, text, images, isAdmin } = body;
        const currentUser = await getAuthenticatedUser(request);

        if (!currentUser) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        if (!userId || !senderId) {
            return NextResponse.json({ success: false, message: 'User ID and Sender ID are required' }, { status: 400 });
        }

        // Security: Students can only send messages from themselves, into their own
        // conversation thread, unless admin
        if (
            currentUser.role !== 'admin' &&
            (currentUser.id !== senderId && currentUser._id?.toString() !== senderId ||
                currentUser.id !== userId && currentUser._id?.toString() !== userId)
        ) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        // 🔒 SECURITY: `isAdmin` must reflect the real caller's role, not a
        // client-supplied flag — otherwise a student could forge "admin" replies
        // into any conversation (their own userId points the thread anywhere).
        const message = await SupportMessage.create({
            user: userId,
            sender: senderId,
            text: text || '',
            images: images || [],
            isAdmin: currentUser.role === 'admin',
            isRead: false
        });

        return NextResponse.json({ success: true, message });
    } catch (error) {
        console.error('Send support message error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
