import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import SelfieCapture from '@/models/SelfieCapture'
import User from '@/models/User'
import { requirePermission } from '@/utils/apiAuth';

// These routes now read auth headers, so they must never be statically
// prerendered (a prerendered 401 would be cached and served to everyone).
export const dynamic = 'force-dynamic';

export async function GET(request) {
    // 🔒 SECURITY: staff-only view. This had no authorization check, so any
    // authenticated user (including every student) could read it.
    const authError = await requirePermission(request, 'manage_storage');
    if (authError) return authError;

    try {
        await connectDB()

        // Aggregate selfies by user
        const userAggregates = await SelfieCapture.aggregate([
            {
                $sort: { createdAt: -1 } // Sort by newest first
            },
            {
                $group: {
                    _id: '$user',
                    count: { $sum: 1 },
                    lastSelfie: { $first: '$imageUrl' },
                    lastUploadAt: { $first: '$createdAt' }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            {
                $unwind: '$userDetails'
            },
            {
                $project: {
                    _id: 1,
                    count: 1,
                    lastSelfie: 1,
                    lastUploadAt: 1,
                    name: '$userDetails.name',
                    email: '$userDetails.email',
                    profileImage: '$userDetails.profileImage',
                    phone: '$userDetails.phone'
                }
            },
            {
                $sort: { lastUploadAt: -1 }
            }
        ])

        return NextResponse.json({
            success: true,
            users: userAggregates
        })

    } catch (error) {
        console.error('Error fetching user selfie aggregates:', error)
        return NextResponse.json(
            { success: false, message: 'Error fetching user data' },
            { status: 500 }
        )
    }
}
