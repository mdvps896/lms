import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getStorageStatus } from '@/utils/localStorage';

export async function GET() {
    try {
        await connectDB();
        const status = await getStorageStatus();

        // Add DB-based stats (Cloudinary files)
        const SelfieCapture = (await import('@/models/SelfieCapture')).default;
        const freeMaterialCount = await SelfieCapture.countDocuments({
            course: '000000000000000000000000'
        });

        // Update total count
        if (status.total) {
            status.total.count += freeMaterialCount;
        }

        // Add specific category
        status.freeMaterials = {
            count: freeMaterialCount,
            size: 0, // Cloudinary size unknown
            sizeFormatted: '0 B (Cloud)'
        };

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