import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SupportMessage from '@/models/SupportMessage';
import { verifyToken } from '@/utils/auth';

export async function DELETE(request) {
    try {
        await connectDB();

        // Verify authentication
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
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

        // Check if user is admin
        if (decoded.role !== 'admin') {
            return NextResponse.json(
                { success: false, message: 'Only admins can delete all messages' },
                { status: 403 }
            );
        }

        // Delete all support messages
        const result = await SupportMessage.deleteMany({});

        return NextResponse.json({
            success: true,
            message: `Successfully deleted ${result.deletedCount} messages`,
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error('Error deleting messages:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to delete messages', error: error.message },
            { status: 500 }
        );
    }
}
