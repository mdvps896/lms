import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import SelfieCapture from '@/models/SelfieCapture'
import User from '@/models/User'

export async function GET() {
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
