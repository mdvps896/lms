import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ESignSubmission from '@/models/ESignSubmission';
import User from '@/models/User';
import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';
import { PDFDrawer } from './pdf-drawing';
import { drawImage } from './pdf-images';
import { getAuthenticatedUser } from '@/utils/apiAuth';
import { generateESignPDF } from './generator';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        // Staff-only lookup for public web submissions, which have no
        // linked User to look up by `userId` at all.
        const submissionId = searchParams.get('submissionId');
        const currentUser = await getAuthenticatedUser(request);
        const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'teacher';

        if (!currentUser) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        if (!userId && !submissionId) {
            return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
        }

        if (submissionId && !isStaff) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        // Security: Students can only access their own PDF, unless admin/teacher
        if (userId && !isStaff && currentUser.id !== userId && currentUser._id?.toString() !== userId) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        const submission = submissionId
            ? await ESignSubmission.findById(submissionId)
            : await ESignSubmission.findOne({ user: userId });
        if (!submission) {
            return NextResponse.json({ success: false, message: 'No E-Sign submission found' }, { status: 404 });
        }

        // Fallback to User images — only applies to app submissions; public
        // web submissions have no linked User (`submission.user` is null).
        let userImages = {};
        let userProfile = null;
        try {
            if (submission.user) {
                const user = await User.findById(submission.user).select('esign_images profileImage');
                if (user) {
                    userImages = user.esign_images || {};
                    userProfile = user.profileImage;
                }
            }
        } catch (err) {
            // Silently fail
        }

        // Generate PDF using shared generator
        const pdfArrayBuffer = await generateESignPDF(submission, userImages, userProfile);
        const buffer = Buffer.from(pdfArrayBuffer);

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${(submission.personalDetails?.fullName || 'esign').replace(/\s+/g, '_')}_ESign.pdf"`,
            },
        });

    } catch (error) {
        console.error('PDF Generation Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
