import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Settings from '@/models/Settings'

export async function POST() {
    try {
        await connectDB()
        
        const result = await Settings.updateOne(
            {},
            {
                $set: {
                    'integrations.cloudinary.cloudName': 'deuwdbzwc'
                }
            }
        )
        
        return NextResponse.json({
            success: true,
            message: 'Cloud name updated successfully',
            result: result
        })
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}