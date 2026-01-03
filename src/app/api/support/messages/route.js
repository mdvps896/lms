import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SupportMessage from '@/models/SupportMessage';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 });
        }

        const messages = await SupportMessage.find({ user: userId })
            .sort({ createdAt: 1 })
            .lean();

        // Mark as read if admin is fetching or user is fetching (simpler logic)
        // In a real app, only mark unread messages from the OTHER party as read.

        return NextResponse.json({ success: true, messages });
    } catch (error) {
        console.error('Fetch support messages error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
