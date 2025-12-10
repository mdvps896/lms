import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import connectDB from '@/lib/mongodb'
import Settings from '@/models/Settings'

export async function GET() {
    try {
        await connectDB()
        const settings = await Settings.findOne()
        
        if (!settings?.integrations?.cloudinary) {
            return NextResponse.json({ error: 'Cloudinary not configured' })
        }

        const { cloudName, apiKey, apiSecret } = settings.integrations.cloudinary

        // Test different possible cloud names
        const testCloudNames = [
            cloudName, // Original
            cloudName.trim(), // Remove whitespace
            `${cloudName}-exam`, // With suffix
            `md-consultancy`, // Alternative format
            `mdconsultancy123`, // With numbers
        ]

        const results = []

        for (const testName of testCloudNames) {
            try {
                // Configure Cloudinary with test name
                cloudinary.config({
                    cloud_name: testName,
                    api_key: apiKey,
                    api_secret: apiSecret,
                    secure: true
                })

                // Try to get account details (this will fail if credentials are wrong)
                const result = await cloudinary.api.ping()
                
                results.push({
                    cloudName: testName,
                    success: true,
                    result: result
                })
                
                // If we found a working one, break
                break
                
            } catch (error) {
                results.push({
                    cloudName: testName,
                    success: false,
                    error: error.message,
                    statusCode: error.http_code || error.status
                })
            }
        }

        return NextResponse.json({
            originalCloudName: cloudName,
            testResults: results,
            suggestion: results.find(r => r.success)?.cloudName || 'None found'
        })

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}