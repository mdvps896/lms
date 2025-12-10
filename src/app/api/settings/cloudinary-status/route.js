import { NextResponse } from 'next/server'
import { getCloudinaryStatus } from '@/utils/cloudinary'
import connectDB from '@/lib/mongodb'
import Settings from '@/models/Settings'

export async function GET() {
    try {
        console.log('=== Cloudinary Status Check API ===')
        
        // Direct check
        await connectDB()
        const settings = await Settings.findOne()
        console.log('Settings found:', !!settings)
        
        if (settings) {
            console.log('Cloudinary integration exists:', !!settings.integrations?.cloudinary)
            if (settings.integrations?.cloudinary) {
                console.log('Cloudinary enabled:', settings.integrations.cloudinary.enabled)
                console.log('Has cloudName:', !!settings.integrations.cloudinary.cloudName)
                console.log('Has apiKey:', !!settings.integrations.cloudinary.apiKey)
                console.log('Has apiSecret:', !!settings.integrations.cloudinary.apiSecret)
            }
        }
        
        const status = await getCloudinaryStatus()
        console.log('Final status:', status)
        
        return NextResponse.json(status)
    } catch (error) {
        console.error('Error checking Cloudinary status:', error)
        return NextResponse.json(
            { enabled: false, configured: false, error: error.message },
            { status: 500 }
        )
    }
}