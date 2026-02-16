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

        const doc = new jsPDF();
        const drawer = new PDFDrawer(doc);

        // --- PAGE 1: Personal Details & Documents ---
        drawer.drawHeader('SERVICE APPLICATION');

        drawer.drawSectionTitle('Student Personal Information');
        const p = submission.personalDetails || {};
        drawer.drawField('Full Name', p.fullName);
        drawer.drawField('Email Address', p.email);
        drawer.drawField('Mobile / WhatsApp', p.mobile);
        drawer.drawField('Date of Birth', p.dob);
        drawer.drawField('Nationality', p.nationality);
        drawer.drawField('Passport Number', p.passportNumber);
        drawer.drawField('Education', p.education);
        drawer.drawField('Experience', p.workExperience + ' Years');
        drawer.drawField('Current Address', p.currentAddress);
        drawer.drawField('Roll Number', p.rollNumber || 'N/A');

        drawer.yPos += 10;

        // --- Uploaded Documents ---
        const boxW = 75;
        const boxH = 55;
        const gap = 5;

        // Check if there's enough room for TITLE + ONE ROW (approx 75 units)
        if (drawer.yPos + 75 > drawer.pageHeight - 20) {
            doc.addPage();
            drawer.yPos = 25;
        }

        drawer.drawSectionTitle('Uploaded Documents');
        const d = submission.documents || {};
        const startX = drawer.margin;

        let currentY = drawer.yPos + 5;

        // Row 1
        await drawImage(doc, 'Passport Front', d.passportFront || userImages.passportFront, startX, currentY, boxW, boxH, drawer.colors);
        await drawImage(doc, 'Passport Back', d.passportBack || userImages.passportBack, startX + boxW + gap, currentY, boxW, boxH, drawer.colors);

        // Row 2 Setup
        currentY += boxH + 10;

        // Check if Row 2 fits, if not, move to next page
        if (currentY + boxH + 8 > drawer.pageHeight - 15) {
            doc.addPage();
            currentY = 25;
        }

        await drawImage(doc, 'Passport Photo', d.passportPhoto || userImages.passportPhoto, startX, currentY, boxW, boxH, drawer.colors);

        // Selfie Fallback Logic
        const selfieToUse = d.selfiePhoto || userImages.selfiePhoto || userProfile || d.selfie || userImages.selfie;
        const selfieX = startX + boxW + gap;
        const actualSelfieW = await drawImage(doc, 'Selfie / Human Check', selfieToUse, selfieX, currentY, boxW, boxH, drawer.colors, { autoWidth: true });

        // Add Timestamp below Selfie (at bottom as requested)
        if (selfieToUse) {
            try {
                const sigDate = (submission.signature && submission.signature.date)
                    ? submission.signature.date
                    : (submission.updatedAt || new Date());
                const dateObj = new Date(sigDate);

                if (!isNaN(dateObj.getTime())) {
                    const pad = (n) => n.toString().padStart(2, '0');
                    const dStr = `${pad(dateObj.getDate())}/${pad(dateObj.getMonth() + 1)}/${dateObj.getFullYear()}`;
                    const hh = dateObj.getHours();
                    const mm = pad(dateObj.getMinutes());
                    const ampm = hh >= 12 ? 'PM' : 'AM';
                    const h12 = hh % 12 || 12;
                    const tStr = `${h12}:${mm} ${ampm}`;

                    doc.setFontSize(8);
                    doc.setTextColor(drawer.colors.secondary[0], drawer.colors.secondary[1], drawer.colors.secondary[2]);
                    doc.setFont('helvetica', 'bold');
                    // Center the text under the ACTUAL width of the selfie
                    doc.text(`VERIFIED ON: ${dStr} ${tStr}`, selfieX + (actualSelfieW / 2), currentY + boxH + 5, { align: 'center' });
                    doc.setFont('helvetica', 'normal');
                }
            } catch (err) {
                // Silently fail
            }
        }

        drawer.yPos = currentY + boxH + 15; // Space after documents row

        // --- Service Selections ---
        drawer.drawSectionTitle('Service Selection Details');

        const s = submission.selections || {};

        const gulfCourses = Array.isArray(s.gulfLicenseCourse)
            ? s.gulfLicenseCourse
            : (s.gulfLicenseCourse ? [s.gulfLicenseCourse] : []);

        if (gulfCourses.length > 0) {
            drawer.drawSectionTitle('Gulf Specialized Courses / Exams');
            gulfCourses.forEach(ex => drawer.drawSelectedItem(ex));
            drawer.yPos += 5;
        }

        if (s.coursePackageType && s.coursePackageType.length > 0) {
            drawer.drawSectionTitle('Selected Package Category');
            s.coursePackageType.forEach(pk => drawer.drawSelectedItem(pk));
            drawer.yPos += 5;
        }

        if (s.servicesSelected && s.servicesSelected.length > 0) {
            drawer.drawSectionTitle('Included Support Services');
            s.servicesSelected.forEach(sv => drawer.drawSelectedItem(sv));
            drawer.yPos += 5;
        }

        if (s.otherService && s.otherService.trim() !== '') {
            drawer.drawSectionTitle('Special Requests / Remarks');
            drawer.drawField('Other Details', s.otherService);
        }

        if (s.confirmedPaymentServices && s.confirmedPaymentServices.length > 0) {
            drawer.yPos += 5;
            drawer.drawSectionTitle('Payment Based on Selected Services');
            s.confirmedPaymentServices.forEach(ps => drawer.drawSelectedItem(ps));
            if (s.otherPayment) drawer.drawField('Other Payment Details', s.otherPayment);
            drawer.yPos += 5;
        }

        if (s.paymentMethods && s.paymentMethods.length > 0) {
            drawer.drawSectionTitle('Payment Confirmation Method');
            s.paymentMethods.forEach(pm => drawer.drawSelectedItem(pm));
            drawer.yPos += 5;
        }

        if (s.paymentTerms) {
            drawer.drawSectionTitle('Service-Wise Payment Terms');
            if (s.paymentTerms.noAdvanceAccepted) drawer.drawSelectedItem('I understand that MD Consultancy does NOT take advance payment.');
            if (s.paymentTerms.payAsWorkAccepted) drawer.drawSelectedItem('I will pay fees only for selected services and work started/completed.');
            drawer.yPos += 5;
        }

        // --- Declarations & Consents ---
        drawer.yPos += 5;
        const declarations = s.declarations || {};
        const ca = s.clientAcceptance || {};

        doc.setFontSize(11);
        doc.setTextColor(255, 0, 0);
        doc.setFont('helvetica', 'bold');
        drawer.drawWrappedText('IMPORTANT NOTE');
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(drawer.colors.textMain[0], drawer.colors.textMain[1], drawer.colors.textMain[2]);
        drawer.drawWrappedText('Work/process will start only after MD Consultancy approval and payment confirmation as per selected services.');
        drawer.yPos += 5;

        drawer.drawSectionTitle('LEGAL DISCLAIMER (INDIA COMPLIANCE)');
        drawer.drawWrappedText('MD Consultancy is a private consultancy and documentation support service provider.');
        drawer.drawWrappedText('We are not a government authority and not affiliated with DHA / DOH / MOH / Prometric / DataFlow / PSV authorities.');
        drawer.drawWrappedText('All approvals and decisions are subject to official authority rules and verification.');
        drawer.drawWrappedText('We are not responsible for rejection, delay, government rule changes, or technical portal issues.');
        drawer.yPos += 5;

        if (declarations.declarationAccepted || ca.paymentAccordingToWork || ca.thirdPartyFeesSeparate) {
            drawer.drawSectionTitle('CLIENT DECLARATION & TERMS (MANDATORY)');

            if (declarations.declarationAccepted) {
                doc.setFont('helvetica', 'bold');
                drawer.drawWrappedText(`I, ${submission.personalDetails?.fullName || '___________________________________________'}, confirm that I am voluntarily taking services from MD Consultancy.`);
                doc.setFont('helvetica', 'normal');

                drawer.drawWrappedText('Terms & Conditions:', 0);

                const terms = [
                    '1. I have provided true and genuine documents and information to MD Consultancy.',
                    '2. MD Consultancy provides professional guidance, coaching, documentation support, and process assistance only.',
                    '3. I clearly understand that PASS / JOB / VISA / LICENSE approval is NOT guaranteed by MD Consultancy.',
                    '4. Authority decisions (DHA / DOH / MOH / Prometric / DataFlow / PSV etc.) are final.',
                    '5. Any delay or rejection due to authority timelines, rule changes, incomplete documents, or technical issues is not the responsibility of MD Consultancy.',
                    '6. Third-party charges (exam fees, embassy fees, authority portal fees, ticket charges etc.) are separate and non-refundable.',
                    '7. Service fees are charged for work done and may be non-refundable once process starts.',
                    '8. Document Authenticity: All documents submitted by me are genuine. If any document is fake, forged, or misleading, I shall be solely responsible for legal consequences.',
                    '9. Criminal Liability: MD Consultancy does not create or modify any government document. Any legal issue arising from submitted documents is my responsibility.',
                    '10. Digital Communication Validity: WhatsApp chats, emails, call recordings, and payment confirmations shall be treated as valid legal proof of consent.',
                    '11. Chargeback & False Complaint Protection: I agree not to raise false payment disputes or baseless complaints after service initiation. Legal recovery action may be taken.',
                    '12. Defamation Protection: False allegations or social media defamation against MD Consultancy may result in legal action.',
                    '13. Jurisdiction Clause: Any dispute shall be subject to Bhavnagar, Gujarat jurisdiction only.',
                    '14. I authorize MD Consultancy to submit my documents wherever required for official processing, booking, and verification.',
                    '15. MD Consultancy will maintain confidentiality of my documents and share them only for official processing.',
                ];

                terms.forEach(term => drawer.drawWrappedText(term, 5));
                drawer.yPos += 5;
            }

            if (ca.paymentAccordingToWork) drawer.drawSelectedItem('Accepted: Payment is strictly according to work progress.');
            if (ca.thirdPartyFeesSeparate) drawer.drawSelectedItem('Accepted: Third-party fees (embassy, etc.) are separate.');
            drawer.yPos += 5;
        }

        if (declarations.dataPrivacy) {
            drawer.drawSectionTitle('Data Privacy & Digital Consent');
            if (declarations.digitalConsent?.confirmed) drawer.drawSelectedItem('Confirmed: Digital Signature is valid.');
            if (declarations.digitalConsent?.validTreat) drawer.drawSelectedItem('Accepted: E-Sign treated as physical signature.');
            if (declarations.dataPrivacy?.collectionAuth) drawer.drawSelectedItem('Authorized: Data collection for processing.');
            if (declarations.dataPrivacy?.shareAuth) drawer.drawSelectedItem('Authorized: Sharing data with relevant authorities.');
            drawer.yPos += 5;
        }

        if (declarations.refundPolicy) {
            drawer.drawSectionTitle('REFUND POLICY (STRICT)');
            drawer.drawWrappedText('Once any service process has started (Eligibility, DataFlow, Exam Booking, Documentation, Coaching, Visa Process etc.), service fees are non-refundable. Third-party fees are completely non-refundable.');
            if (declarations.refundPolicy.startedNonRefundable) drawer.drawSelectedItem('Understood: Fees non-refundable once work starts.');
            if (declarations.refundPolicy.cancelNoRefund) drawer.drawSelectedItem('Understood: No refund on cancellation.');
            if (declarations.refundPolicy.thirdPartyNonRefundable) drawer.drawSelectedItem('Understood: Third-party fees are non-refundable.');
            drawer.yPos += 5;
        }

        if (declarations.thirdPartyDisclaimer) {
            drawer.drawSectionTitle('Third-Party Disclaimer');
            if (declarations.thirdPartyDisclaimer.govtDecision) drawer.drawSelectedItem('Understood: Authority decisions are final.');
            if (declarations.thirdPartyDisclaimer.consultancyLiability) drawer.drawSelectedItem('Understood: Consultancy not liable for delays.');
            drawer.yPos += 5;
        }

        if (declarations.finalConfirmation) {
            drawer.drawSectionTitle('Final Confirmation');
            if (declarations.finalConfirmation['readAll ']) drawer.drawSelectedItem('Confirmed: I have read all terms and conditions.');
            if (declarations.finalConfirmation.authorizeStart) drawer.drawSelectedItem('Authorized: Start processing application.');
            drawer.yPos += 5;
        }
        drawer.yPos += 10;
        drawer.drawSectionTitle('Payment Authorization');

        doc.setFontSize(10);
        doc.setTextColor(drawer.colors.textMain[0], drawer.colors.textMain[1], drawer.colors.textMain[2]);
        drawer.drawSelectedItem('I acknowledge that MD Consultancy does not accept any advance payment.');
        drawer.drawSelectedItem('I agree to proceed with the services as per the discussed milestones.');
        drawer.drawField('Payment Mode', s.paymentMethod || 'Selected by Consultant');

        drawer.yPos += 10;

        // Stamp and Signature Area
        drawer.drawSectionTitle('Digital Verification & Approval');
        const sig = submission.signature || {};

        // Draw Stamp
        try {
            const stampPath = path.join(process.cwd(), 'public', 'images', 'stamp.jpeg');
            if (fs.existsSync(stampPath)) {
                const stampBuffer = fs.readFileSync(stampPath);
                const stampBase64 = stampBuffer.toString('base64');
                doc.addImage(stampBase64, 'JPEG', drawer.pageWidth - 70, drawer.yPos, 45, 45);
            }
        } catch (e) {
            // Silently fail
        }

        doc.setFontSize(11);
        doc.setTextColor(drawer.colors.textLight[0], drawer.colors.textLight[1], drawer.colors.textLight[2]);
        doc.text('CLIENT DIGITAL SIGNATURE:', drawer.margin, drawer.yPos + 10);

        // Draw Client Signature Image (Async)
        const signatureToUse = sig.signatureImage || userImages.signatureImage;
        if (signatureToUse) {
            await drawImage(doc, 'Client Signature', signatureToUse, drawer.margin, drawer.yPos + 25, 60, 30, drawer.colors);
        }

        doc.setFont('courier', 'bolditalic');
        doc.setFontSize(12);
        doc.setTextColor(drawer.colors.secondary[0], drawer.colors.secondary[1], drawer.colors.secondary[2]);
        doc.text(sig.clientName || 'AUTHORIZED SIGNATORY', drawer.margin, drawer.yPos + 70);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(drawer.colors.textLight[0], drawer.colors.textLight[1], drawer.colors.textLight[2]);
        doc.text(`Submission Date: ${sig.date ? new Date(sig.date).toLocaleDateString('en-GB') : 'N/A'}`, drawer.margin, drawer.yPos + 78);
        doc.text(`Filing Location: ${sig.place || 'Registered Address'}`, drawer.margin, drawer.yPos + 85);

        const boxX = drawer.pageWidth - 70;
        const boxY = drawer.yPos + 55;
        const footerBoxW = 50;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(0, 0, 0);

        const footerText = "This document is electronically signed and approved by MD Consultancy and does not require a physical signature.";
        doc.text(footerText, boxX + 2, boxY + 5, { maxWidth: footerBoxW - 4, align: 'left' });

        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            drawer.drawFooter(i);
        }

        const pdfOutput = doc.output('arraybuffer');
        const buffer = Buffer.from(pdfOutput);

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${(submission.personalDetails?.fullName || 'esign').replace(/\s+/g, '_')}_ESign.pdf"`,
            },
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
