import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import SelfieCapture from '@/models/SelfieCapture'
import Course from '@/models/Course' // Import Course model to ensure it's registered
import PDFViewSession from '@/models/PDFViewSession' // Import PDFViewSession model

export async function GET(request, { params }) {
    try {
        await connectDB()

        const { userId } = params

        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'User ID is required' },
                { status: 400 }
            )
        }

        const selfies = await SelfieCapture.find({ user: userId })
            .sort({ createdAt: -1 })
            .populate('course', 'title') // Populate course title if available
            .lean()

        // Format the response
        const formattedSelfies = selfies.map(selfie => ({
            ...selfie,
            name: `Selfie - ${new Date(selfie.createdAt).toLocaleString()}`,
            path: selfie.imageUrl,
            type: 'image',
            size: 0, // Size usually not stored in SelfieCapture
            createdAt: selfie.createdAt,
            courseName: selfie.course?.title || 'Unknown Course',
            captureType: selfie.captureType
        }))

        return NextResponse.json({
            success: true,
            files: formattedSelfies
        })

    } catch (error) {
        console.error('Error fetching user selfies:', error)
        return NextResponse.json(
            { success: false, message: 'Error fetching selfies' },
            { status: 500 }
        )
    }
}
