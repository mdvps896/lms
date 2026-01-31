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

        // Security: Students can only send messages from themselves, unless admin
        if (currentUser.role !== 'admin' && currentUser.id !== senderId && currentUser._id?.toString() !== senderId) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        const message = await SupportMessage.create({
            user: userId,
            sender: senderId,
            text: text || '',
            images: images || [],
            isAdmin: isAdmin || false,
            isRead: false
        });

        return NextResponse.json({ success: true, message });
    } catch (error) {
        console.error('Send support message error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
