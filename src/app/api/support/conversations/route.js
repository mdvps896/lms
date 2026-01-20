import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SupportMessage from '@/models/SupportMessage';
import User from '@/models/User';

export async function GET(request) {
    try {
        await connectDB();

        // Group by user and get latest message
        const count = await SupportMessage.countDocuments();
        console.log(`Debug: Total support messages in DB: ${count}`);

        const conversations = await SupportMessage.aggregate([
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: "$user",
                    latestMessage: { $first: "$$ROOT" },
                    unreadCount: {
                        $sum: { $cond: [{ $and: [{ $eq: ["$isRead", false] }, { $eq: ["$isAdmin", false] }] }, 1, 0] }
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            {
                $unwind: {
                    path: "$userDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            { $sort: { "latestMessage.createdAt": -1 } }
        ]);

        return NextResponse.json({ success: true, conversations });
    } catch (error) {
        console.error('Fetch conversations error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
