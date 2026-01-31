import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SupportMessage from '@/models/SupportMessage';
import { getAuthenticatedUser } from '@/utils/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const currentUser = await getAuthenticatedUser(request);

        if (!currentUser) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 });
        }

        // Security: Students can only access their own messages, unless admin/teacher
        if (currentUser.role !== 'admin' && currentUser.role !== 'teacher' && currentUser.id !== userId && currentUser._id?.toString() !== userId) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        const messages = await SupportMessage.find({ user: userId })
            .sort({ createdAt: 1 })
            .lean();

        return NextResponse.json({ success: true, messages });
    } catch (error) {
        console.error('Fetch support messages error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
