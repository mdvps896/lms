import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PDF from '@/models/PDF';
import User from '@/models/User';
import { getServerSession } from 'next-auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pdfs/my-pdfs
 * Returns all PDFs accessible to the logged-in user
 */
export async function GET(request) {
    try {
        await connectDB();

        // Get user from session or token
        const authHeader = request.headers.get('authorization');
        let userId;

        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            // Decode token to get userId (implement your token verification)
            // For now, assuming token is userId
            userId = token;
        }

        if (!userId) {
            return NextResponse.json({
                success: false,
                message: 'Unauthorized'
            }, { status: 401 });
        }

        // Get user with enrolled courses
        const user = await User.findById(userId).select('enrolledCourses');
        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'User not found'
            }, { status: 404 });
        }

        // Extract course IDs from enrolled courses
        const userCourseIds = user.enrolledCourses.map(enrollment => {
            if (typeof enrollment === 'object' && enrollment.courseId) {
                return enrollment.courseId.toString();
            }
            return enrollment.toString();
        });

        // Find all PDFs user has access to
        const pdfs = await PDF.find({
            $or: [
                // Global PDFs (free or purchased)
                {
                    accessType: 'global',
                    $or: [
                        { isPremium: false },
                        { 'purchasedBy.user': userId }
                    ]
                },
                // Course-assigned PDFs (free or purchased)
                {
                    accessType: 'course',
                    assignedCourses: { $in: userCourseIds },
                    $or: [
                        { isPremium: false },
                        { 'purchasedBy.user': userId }
                    ]
                },
                // User-assigned PDFs (free or purchased)
                {
                    accessType: 'user',
                    assignedUsers: userId,
                    $or: [
                        { isPremium: false },
                        { 'purchasedBy.user': userId }
                    ]
                }
            ]
        })
            .populate('category', 'name')
            .populate('subjects', 'name')
            .select('-purchasedBy') // Don't send purchase history to client
            .sort({ createdAt: -1 });

        // Add purchase status for each PDF
        const pdfsWithStatus = pdfs.map(pdf => {
            const pdfObj = pdf.toObject();
            const isPurchased = pdf.purchasedBy?.some(
                p => p.user.toString() === userId.toString()
            );

            return {
                ...pdfObj,
                isPurchased: isPurchased || !pdf.isPremium,
                needsPurchase: pdf.isPremium && !isPurchased
            };
        });

        return NextResponse.json({
            success: true,
            pdfs: pdfsWithStatus,
            count: pdfsWithStatus.length
        });

    } catch (error) {
        console.error('❌ Get My PDFs Error:', error);
        return NextResponse.json({
            success: false,
            message: error.message
        }, { status: 500 });
    }
}
