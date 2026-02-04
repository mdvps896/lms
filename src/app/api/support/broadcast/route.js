import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SupportMessage from '@/models/SupportMessage';
import User from '@/models/User';
import { requireAdmin, getAuthenticatedUser } from '@/utils/apiAuth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        await connectDB();

        // Security check
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const body = await request.json();
        const { text, images, recipientIds, sendToAll, categoryId } = body;

        // Get authenticated user (sender)
        const currentUser = await getAuthenticatedUser(request);
        if (!currentUser) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        let targetUserIds = [];

        if (sendToAll) {
            // Fetch all student IDs, optionally filtered by category
            const query = { role: 'student' };
            if (categoryId) {
                query.category = categoryId;
            }
            const students = await User.find(query).select('_id');
            targetUserIds = students.map(s => s._id);
        } else if (recipientIds && Array.isArray(recipientIds) && recipientIds.length > 0) {
            targetUserIds = recipientIds;
        } else {
            return NextResponse.json(
                { success: false, message: 'Recipients not specified' },
                { status: 400 }
            );
        }

        if (targetUserIds.length === 0) {
            return NextResponse.json(
                { success: false, message: 'No recipients found' },
                { status: 400 }
            );
        }

        // Create messages in bulk
        const messagesToInsert = targetUserIds.map(userId => ({
            user: userId,
            sender: currentUser.id || currentUser._id,
            text,
            images: images || [],
            isAdmin: true,
            isRead: false,
            createdAt: new Date()
        }));

        await SupportMessage.insertMany(messagesToInsert);

        return NextResponse.json({
            success: true,
            message: `Broadcast sent to ${targetUserIds.length} users`,
            count: targetUserIds.length
        });

    } catch (error) {
        console.error('Error broadcasting message:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to broadcast message' },
            { status: 500 }
        );
    }
}
