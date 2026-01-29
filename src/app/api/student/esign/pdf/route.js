import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ESignSubmission from '@/models/ESignSubmission';
import User from '@/models/User';
import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';
import { PDFDrawer } from './pdf-drawing';
import { drawImage } from './pdf-images';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    console.log('GET /api/student/esign/pdf REQUEST RECEIVED');
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
        }

        const submission = await ESignSubmission.findOne({ user: userId });
        if (!submission) {
            console.log('No submission found for userId:', userId);
            return NextResponse.json({ success: false, message: 'No E-Sign submission found' }, { status: 404 });
        }
        console.log('Submission found:', submission._id);

        // Fallback to User images
        let userImages = {};
        try {
            console.log('Fetching User for fallback images...');
            const user = await User.findById(userId).select('esign_images');
            if (user) {
                userImages = user.esign_images || {};
                console.log('User images fetched:', Object.keys(userImages));
            } else {
                console.log('User not found.');
            }
        } catch (err) {
            console.error('Error fetching user images:', err);
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
        // Compact layout: Smaller boxes, tighter gaps
        const boxW = 75;
        const boxH = 45;
        const gap = 5;

        // Space check for Title + Row 1
        if (drawer.yPos + 15 + boxH > drawer.pageHeight - 20) {
            doc.addPage();
            drawer.yPos = 25;
        }

        drawer.drawSectionTitle('Uploaded Documents');
        const d = submission.documents || {};
        const startX = drawer.margin;

        let currentY = drawer.yPos + 5;

        // Draw Images (Fallback to User Model if submission doc is missing)
        // Row 1
        await drawImage(doc, 'Passport Front', d.passportFront || userImages.passportFront, startX, currentY, boxW, boxH, drawer.colors);
        await drawImage(doc, 'Passport Back', d.passportBack || userImages.passportBack, startX + boxW + gap, currentY, boxW, boxH, drawer.colors);

        // Row 2 (No page break check - force together)
        // Draw adjacent to row 1 if width allows? No, stick to 2x2 grid but keep close.
        // Actually, user said "1 page me hi dekhe". If we want ALL 4 on one line, we need smaller boxes.
        // 75*4 > PageWidth. 
        // Let's stick to 2 rows but remove gap between rows.

        // Check if Row 2 fits on same page?
        // Ideally we just continue drawing.

        // If we really want to fit on same page, we can try to draw Row 2 immediately below.
        // If it doesn't fit, it will naturally overflow or cut. 
        // But user asked to "see in 1 page". 
        // Let's try to fit closely.

        // Row 2
        currentY += boxH + 5; // minimal vertical gap

        await drawImage(doc, 'Passport Photo', d.passportPhoto || userImages.passportPhoto, startX, currentY, boxW, boxH, drawer.colors);
        await drawImage(doc, 'Selfie / Human Check', d.selfiePhoto || userImages.selfiePhoto, startX + boxW + gap, currentY, boxW, boxH, drawer.colors);

        drawer.yPos = currentY + boxH + 10;

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

        // 1. IMPORTANT NOTE (Static)
        doc.setFontSize(11);
        doc.setTextColor(255, 0, 0);
        doc.setFont('helvetica', 'bold');
        drawer.drawWrappedText('IMPORTANT NOTE');
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(drawer.colors.textMain[0], drawer.colors.textMain[1], drawer.colors.textMain[2]);
        drawer.drawWrappedText('Work/process will start only after MD Consultancy approval and payment confirmation as per selected services.');
        drawer.yPos += 5;

        // 2. LEGAL DISCLAIMER
        drawer.drawSectionTitle('LEGAL DISCLAIMER (INDIA COMPLIANCE)');
        drawer.drawWrappedText('MD Consultancy is a private consultancy / coaching & documentation support service provider. We are NOT a government body, NOT a visa issuing authority, and NOT affiliated with DHA / DOH / MOH / Prometric / DataFlow / PSV authorities.');
        drawer.drawWrappedText('All services are provided on the client\'s request and depend on official rules, portal systems, authority verification, and timelines.');
        drawer.yPos += 5;

        if (declarations.declarationAccepted || ca.paymentAccordingToWork || ca.thirdPartyFeesSeparate) {
            drawer.drawSectionTitle('CLIENT DECLARATION & TERMS (MANDATORY)');

            if (declarations.declarationAccepted) {
                doc.setFont('helvetica', 'bold');
                drawer.drawWrappedText(`I, ${submission.personalDetails?.fullName || '___________________________________________'} (Client Name), confirm that I am voluntarily taking services from MD Consultancy.`);
                doc.setFont('helvetica', 'normal');

                drawer.drawWrappedText('Terms & Conditions:', 0);

                const terms = [
                    '1. I have provided true and genuine documents/information to MD Consultancy.',
                    '2. I understand DHA / Prometric / DataFlow / PSV processes are controlled by official authorities, and outcomes depend on authority verification and my performance.',
                    '3. MD Consultancy provides professional guidance, coaching, documentation support, and process assistance only.',
                    '4. I clearly understand that PASS / JOB / VISA is NOT guaranteed by MD Consultancy.',
                    '5. Any delay or rejection due to authority timelines, wrong/incomplete documents, eligibility issues, technical portal problems, or third-party policies is not the direct responsibility of MD Consultancy.',
                    '6. I authorize MD Consultancy to submit my information/documents wherever required for official processing, booking, verification, and consultation purposes.',
                    '7. I understand third-party charges (authority fees, exam fees, visa fees, ticket/courier charges, etc.) are separate and payable by me as per actuals.',
                    '8. I understand service fees are charged for work done. Once work has started (Booking, DataFlow, documentation, coaching, etc.), fees may be non-refundable as per policy.',
                    '9. I agree that all communication on WhatsApp / Email will be treated as valid proof of consent and updates.',
                    '10. MD Consultancy will maintain confidentiality of my documents and will share them only when required for official processing.',
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
            drawer.drawSectionTitle('Refund Policy Acknowledgement');
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
        drawer.yPos += 5;
        drawer.yPos += 5;
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
            console.error('Stamp embed error:', e);
        }

        doc.setFontSize(11);
        doc.setTextColor(drawer.colors.textLight[0], drawer.colors.textLight[1], drawer.colors.textLight[2]);
        doc.setFontSize(11);
        doc.setTextColor(drawer.colors.textLight[0], drawer.colors.textLight[1], drawer.colors.textLight[2]);
        doc.text('CLIENT DIGITAL SIGNATURE:', drawer.margin, drawer.yPos + 10);

        // Draw Client Signature Image (Async)
        const signatureToUse = sig.signatureImage || userImages.signatureImage;
        if (signatureToUse) {
            // Moved down to +25 for more gap from label
            await drawImage(doc, 'Client Signature', signatureToUse, drawer.margin, drawer.yPos + 25, 60, 30, drawer.colors);
        }

        doc.setFont('courier', 'bolditalic');
        doc.setFontSize(12);
        doc.setTextColor(drawer.colors.secondary[0], drawer.colors.secondary[1], drawer.colors.secondary[2]);
        // Increased gap: Image ends at +55, Name at +70 (15 units gap)
        doc.text(sig.clientName || 'AUTHORIZED SIGNATORY', drawer.margin, drawer.yPos + 70);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(drawer.colors.textLight[0], drawer.colors.textLight[1], drawer.colors.textLight[2]);
        // Moved Date and Location below the name
        doc.text(`Submission Date: ${sig.date ? new Date(sig.date).toLocaleDateString('en-GB') : 'N/A'}`, drawer.margin, drawer.yPos + 78);
        doc.text(`Filing Location: ${sig.place || 'Registered Address'}`, drawer.margin, drawer.yPos + 85);

        // Add Approval Footer Text
        // Draw Disclaimer Text below Stamp (No Box, Black Text)
        const boxX = drawer.pageWidth - 70;
        const boxY = drawer.yPos + 55;
        const footerBoxW = 50;

        // Removed Red Box
        // doc.setDrawColor(255, 0, 0); 
        // doc.rect(boxX, boxY, footerBoxW, footerBoxH);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(0, 0, 0); // Black Text

        const footerText = "This document is electronically signed and approved by MD Consultancy and does not require a physical signature.";
        doc.text(footerText, boxX + 2, boxY + 5, { maxWidth: footerBoxW - 4, align: 'left' });

        // --- Finalize: Add Footers to All Pages ---
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            drawer.drawFooter(i);
        }

        const pdfOutput = doc.output('arraybuffer');

        return new NextResponse(pdfOutput, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${(submission.personalDetails?.fullName || 'esign').replace(/\s+/g, '_')}_ESign.pdf"`,
            },
        });

    } catch (error) {
        console.error('Error generating esign pdf:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
