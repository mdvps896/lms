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
        const currentUser = await getAuthenticatedUser(request);

        if (!currentUser) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
        }

        // Security: Students can only access their own PDF, unless admin/teacher
        if (currentUser.role !== 'admin' && currentUser.role !== 'teacher' && currentUser.id !== userId && currentUser._id?.toString() !== userId) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        const submission = await ESignSubmission.findOne({ user: userId });
        if (!submission) {
            return NextResponse.json({ success: false, message: 'No E-Sign submission found' }, { status: 404 });
        }

        // Fallback to User images
        let userImages = {};
        let userProfile = null;
        try {
            const user = await User.findById(userId).select('esign_images profileImage');
            if (user) {
                userImages = user.esign_images || {};
                userProfile = user.profileImage;
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
