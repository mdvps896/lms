import { NextResponse } from 'next/server';
import { getStorageStatus } from '@/utils/localStorage';

export async function GET() {
    try {
        console.log('🔍 Checking local storage status...');
        
        const status = await getStorageStatus();
        
        return NextResponse.json({
            success: true,
            data: status,
            message: 'Storage status retrieved successfully',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error checking storage status:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            message: 'Error getting storage status'
        }, { status: 500 });
    }
}