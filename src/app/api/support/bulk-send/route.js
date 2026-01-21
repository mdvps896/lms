import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import SupportMessage from '@/models/SupportMessage';
import { requireAdmin, getAuthenticatedUser } from '@/utils/apiAuth';
import { sendFCMNotification } from '@/utils/fcmAdmin';

export async function POST(req) {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    try {
        await dbConnect();
        const { userIds, text, images, sendToAll } = await req.json();
        const adminUser = await getAuthenticatedUser(req);

        if (!text && (!images || images.length === 0)) {
            return NextResponse.json({ success: false, error: 'Message content is required' }, { status: 400 });
        }

        let recipients = [];
        if (sendToAll) {
            recipients = await User.find({ role: 'student', status: 'active' }).select('_id fcmToken').lean();
        } else {
            if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
                return NextResponse.json({ success: false, error: 'Recipients are required' }, { status: 400 });
            }
            recipients = await User.find({ _id: { $in: userIds } }).select('_id fcmToken').lean();
        }

        const senderId = adminUser.id || adminUser._id;

        // Batch creation of messages
        const messages = recipients.map(recipient => ({
            user: recipient._id,
            sender: senderId,
            text: text || '',
            images: images || [],
            isAdmin: true,
            isRead: false,
            createdAt: new Date()
        }));

        if (messages.length > 0) {
            await SupportMessage.insertMany(messages);
        }

        // Send FCM Notifications (Fire and Forget)
        // We don't want to await this if there are 1000s of users, but for now reasonable size is ok.
        // Ideally perform in chunks.
        const fcmTokens = recipients.map(r => r.fcmToken).filter(t => t);
        if (fcmTokens.length > 0) {
            // We need to send individual notifications or multicast if supported by utility
            // Assuming sendFCMNotification handles single token. 
            // For bulk, we loop or use multicast.
            // Since sendFCMNotification might be simple, let's just loop for now or broadcast if "All".

            // Optimization: Limit to first 500 for instant notification to avoid timeout
            const tokensToSend = fcmTokens.slice(0, 500);

            // Use a promise.all for parallel sending, but don't await the whole thing if irrelevant to response
            Promise.allSettled(tokensToSend.map(token =>
                sendFCMNotification(token, 'New Support Message', text || 'You have a new message from support')
            )).catch(err => console.error('Bulk FCM Error:', err));
        }

        return NextResponse.json({
            success: true,
            message: `Message sent to ${recipients.length} recipients`
        });
    } catch (error) {
        console.error('Bulk send error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
