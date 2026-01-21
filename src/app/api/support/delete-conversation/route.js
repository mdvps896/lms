import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SupportMessage from '@/models/SupportMessage';
import { requireAdmin } from '@/utils/apiAuth';

export async function DELETE(req) {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
        }

        // Delete all messages where this user is either sender or receiver (implied by 'user' field in schema)
        // Schema has 'user' field which links message to a student conversation
        await SupportMessage.deleteMany({ user: userId });

        return NextResponse.json({
            success: true,
            message: 'Conversation deleted successfully'
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
