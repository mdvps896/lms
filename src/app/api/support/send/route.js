import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SupportMessage from '@/models/SupportMessage';
import User from '@/models/User';

export async function POST(request) {
    try {
        await connectDB();
        const body = await request.json();
        const { userId, senderId, text, images, isAdmin } = body;

        if (!userId || !senderId) {
            return NextResponse.json({ success: false, message: 'User ID and Sender ID are required' }, { status: 400 });
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
