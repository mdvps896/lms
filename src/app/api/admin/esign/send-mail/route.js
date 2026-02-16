import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ESignSubmission from '@/models/ESignSubmission';
import User from '@/models/User';
import { generateESignPDF } from '@/app/api/student/esign/pdf/generator';
import { sendEmail } from '@/lib/email';
import { getAuthenticatedUser } from '@/utils/apiAuth';

export async function POST(request) {
    try {
        await connectDB();
        const currentUser = await getAuthenticatedUser(request);

        if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'teacher')) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { userId, toEmail, subject, message } = body;

        if (!userId || !toEmail || !subject || !message) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
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
        } catch (err) { }

        // Generate PDF
        console.log(`📄 Generating E-Sign PDF for user: ${userId}...`);
        const pdfArrayBuffer = await generateESignPDF(submission, userImages, userProfile);
        const buffer = Buffer.from(pdfArrayBuffer);
        console.log(`✅ PDF Generated (${(buffer.length / 1024).toFixed(2)} KB). Sending email...`);

        // Send Email with Attachment
        const mailResult = await sendEmail({
            to: toEmail,
            subject: subject,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #1a237e;">E-Sign Document</h2>
                    <p style="font-size: 15px; line-height: 1.6;"><strong>${message.replace(/\n/g, '<br>')}</strong></p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #777;">This is an automated message from MD Consultancy regarding your E-Sign submission.</p>
                </div>
            `,
            attachments: [
                {
                    filename: `${(submission.personalDetails?.fullName || 'esign').replace(/\s+/g, '_')}_ESign.pdf`,
                    content: buffer,
                    contentType: 'application/pdf'
                }
            ]
        });

        if (mailResult) {
            console.log(`📧 Email sent successfully to: ${toEmail}`);
            return NextResponse.json({ success: true, message: 'Email sent successfully with PDF attachment' });
        } else {
            console.error(`❌ Failed to send email to: ${toEmail}`);
            return NextResponse.json({ success: false, message: 'Failed to send email' }, { status: 500 });
        }

    } catch (error) {
        console.error('Send Email Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
