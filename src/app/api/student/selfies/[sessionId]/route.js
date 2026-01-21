import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SelfieCapture from '@/models/SelfieCapture';
import { verifyToken } from '@/utils/auth';

export async function GET(request, { params }) {
    try {
        await connectDB();

        // Verify authentication
        const token = request.headers.get('authorization')?.replace('Bearer ', '') || request.cookies.get('token')?.value;
        if (!token) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json(
                { success: false, message: 'Invalid token' },
                { status: 401 }
            );
        }

        const { sessionId } = params;

        if (!sessionId) {
            return NextResponse.json(
                { success: false, message: 'Session ID is required' },
                { status: 400 }
            );
        }

        // Fetch all selfies for this session
        const selfies = await SelfieCapture.find({ sessionId })
            .sort({ createdAt: 1 }) // Chronological order
            .select('imageUrl captureType currentPage createdAt metadata')
            .lean();

        return NextResponse.json({
            success: true,
            data: selfies,
            count: selfies.length
        });

    } catch (error) {
        console.error('Error fetching session selfies:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch selfies', error: error.message },
            { status: 500 }
        );
    }
}
