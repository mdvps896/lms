import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SupportMessage from '@/models/SupportMessage';
import User from '@/models/User';
import { requireAdmin } from '@/utils/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        await connectDB();

        // Security check
        const authError = await requireAdmin(request);
        if (authError) return authError;

        // Aggregate to find unique users who have chatted
        // This aggregation groups by 'user' (the student/teacher), gets the last message, and counts unread
        const conversations = await SupportMessage.aggregate([
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: "$user",
                    lastMessage: { $first: "$$ROOT" },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                { $and: [{ $eq: ["$isRead", false] }, { $eq: ["$isAdmin", false] }] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userInfo"
                }
            },
            {
                $unwind: "$userInfo"
            },
            {
                $project: {
                    userId: "$_id",
                    userName: "$userInfo.name",
                    userEmail: "$userInfo.email",
                    userProfileImage: "$userInfo.profileImage",
                    lastMessage: "$lastMessage.text",
                    lastMessageTime: "$lastMessage.createdAt",
                    unreadCount: 1
                }
            },
            {
                $sort: { lastMessageTime: -1 }
            }
        ]);

        return NextResponse.json({ success: true, data: conversations });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch conversations' },
            { status: 500 }
        );
    }
}
