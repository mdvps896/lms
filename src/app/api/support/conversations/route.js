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
                    _id: "$_id",
                    userDetails: {
                        _id: "$_id",
                        name: "$userInfo.name",
                        email: "$userInfo.email",
                        profileImage: "$userInfo.profileImage",
                        isSupportBlocked: "$userInfo.isSupportBlocked"
                    },
                    latestMessage: {
                        text: "$lastMessage.text",
                        createdAt: "$lastMessage.createdAt"
                    },
                    unreadCount: 1
                }
            },
            {
                $sort: { "latestMessage.createdAt": -1 }
            }
        ]);

        return NextResponse.json({
            success: true,
            conversations,
            data: conversations.map(c => ({
                userId: c.userDetails._id,
                userName: c.userDetails.name,
                userEmail: c.userDetails.email,
                userProfileImage: c.userDetails.profileImage,
                lastMessage: c.latestMessage.text,
                lastMessageTime: c.latestMessage.createdAt,
                unreadCount: c.unreadCount
            }))
        });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch conversations' },
            { status: 500 }
        );
    }
}
