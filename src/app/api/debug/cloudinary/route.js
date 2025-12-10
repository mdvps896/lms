import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Settings from '@/models/Settings'

export async function GET() {
    try {
        await connectDB()
        const settings = await Settings.findOne()
        
        if (!settings) {
            return NextResponse.json({ error: 'No settings found' })
        }
        
        return NextResponse.json({
            hasIntegrations: !!settings.integrations,
            hasCloudinary: !!settings.integrations?.cloudinary,
            cloudinaryEnabled: settings.integrations?.cloudinary?.enabled,
            cloudName: settings.integrations?.cloudinary?.cloudName,
            hasApiKey: !!settings.integrations?.cloudinary?.apiKey,
            hasApiSecret: !!settings.integrations?.cloudinary?.apiSecret,
            folder: settings.integrations?.cloudinary?.folder
        })
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}