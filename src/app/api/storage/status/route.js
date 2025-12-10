import { NextResponse } from 'next/server';
import { getCloudinaryStatus, initCloudinary } from '@/utils/cloudinary';

export async function GET() {
    try {
        console.log('🔍 Checking Cloudinary status...');
        
        // Initialize and get status
        const isInitialized = await initCloudinary();
        const status = await getCloudinaryStatus();
        
        return NextResponse.json({
            success: true,
            cloudinary: {
                initialized: isInitialized,
                enabled: status.enabled,
                configured: status.configured,
                status: status.status || 'unknown'
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error checking Cloudinary status:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            cloudinary: {
                initialized: false,
                enabled: false,
                configured: false,
                status: 'error'
            }
        }, { status: 500 });
    }
}