import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export async function POST(request) {
    try {
        const { cloudName, apiKey, apiSecret } = await request.json();

        if (!cloudName || !apiKey || !apiSecret) {
            return NextResponse.json({
                success: false,
                message: 'Missing required credentials'
            }, { status: 400 });
        }

        // Configure Cloudinary with provided credentials
        cloudinary.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
            secure: true
        });

        // Test the configuration by making a simple API call
        try {
            // Ping the API to verify credentials
            const result = await cloudinary.api.ping();
            
            if (result.status === 'ok') {
                return NextResponse.json({
                    success: true,
                    message: 'Cloudinary connection successful',
                    cloudName: cloudName
                });
            } else {
                return NextResponse.json({
                    success: false,
                    message: 'Cloudinary configuration is invalid'
                }, { status: 400 });
            }
        } catch (cloudinaryError) {
            console.error('Cloudinary test error:', cloudinaryError);
            return NextResponse.json({
                success: false,
                message: cloudinaryError.message || 'Invalid Cloudinary credentials'
            }, { status: 400 });
        }
    } catch (error) {
        console.error('Error testing Cloudinary:', error);
        return NextResponse.json({
            success: false,
            message: 'Error testing Cloudinary configuration'
        }, { status: 500 });
    }
}
