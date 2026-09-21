import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ESignSubmission from '@/models/ESignSubmission';
import { requireAdmin } from '@/utils/apiAuth';

export const dynamic = 'force-dynamic';

/**
 * Lists e-sign submissions made through the public /esign web form —
 * i.e. by people without a registered account — for the admin's
 * "Public E-Sign" screen. Reuses the same ESignSubmission collection as the
 * app flow, filtered to `source: 'public_web'`.
 */
export async function GET(request) {
    try {
        const authError = await requireAdmin(request);
        if (authError) return authError;

        await connectDB();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status'); // optional: Pending | Approved | Rejected

        const query = { source: 'public_web' };
        if (status && ['Pending', 'Approved', 'Rejected'].includes(status)) {
            query.adminStatus = status;
        }

        const submissions = await ESignSubmission.find(query)
            .select('-publicAccessToken')
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ success: true, data: submissions });
    } catch (error) {
        console.error('Error listing public esign submissions:', error);
        return NextResponse.json({ success: false, message: 'Failed to load submissions' }, { status: 500 });
    }
}
