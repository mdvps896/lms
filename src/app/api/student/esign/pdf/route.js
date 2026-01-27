import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ESignSubmission from '@/models/ESignSubmission';
import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
        }

        const submission = await ESignSubmission.findOne({ user: userId });
        if (!submission) {
            return NextResponse.json({ success: false, message: 'No E-Sign submission found' }, { status: 404 });
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        let yPos = 20;

        // Colors
        const primaryColor = [145, 198, 64]; // #91C640 (Green)
        const secondaryColor = [28, 65, 109]; // #1C416D (Blue)
        const textMain = [45, 52, 54];
        const textLight = [99, 110, 114];

        // --- Helper Functions ---
        const drawHeader = (title) => {
            try {
                // Background Header Image (Full Width)
                const headerPath = path.join(process.cwd(), 'public', 'images', 'head.jpeg');
                if (fs.existsSync(headerPath)) {
                    const headerBuffer = fs.readFileSync(headerPath);
                    const headerBase64 = headerBuffer.toString('base64');
                    // Header Image: Full Width, Fixed Height approx 40-50 units or proportionate?
                    // Let's use a fixed height of 35-40 to leave room, or calculate ratio if possible which is hard without reading dimensions.
                    // User want full width. Let's say 40 height.
                    doc.addImage(headerBase64, 'JPEG', 0, 0, pageWidth, 40);
                } else {
                    // Fallback
                    doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
                    doc.rect(0, 0, pageWidth, 40, 'F');
                    doc.setFontSize(22);
                    doc.setTextColor(255, 255, 255);
                    doc.setFont('helvetica', 'bold');
                    doc.text(title || 'SERVICE APPLICATION', pageWidth / 2, 25, { align: 'center' });
                }
            } catch (e) {
                console.error('Header image error:', e);
                doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
                doc.rect(0, 0, pageWidth, 40, 'F');
                doc.setFontSize(22);
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.text(title || 'SERVICE APPLICATION', pageWidth / 2, 25, { align: 'center' });
            }
            yPos = 55;
        };

        const drawFooter = (pageNum) => {
            doc.setFontSize(10);
            doc.setTextColor(textLight[0], textLight[1], textLight[2]);
            doc.setFont('helvetica', 'italic');
            doc.text('MD CONSULTANCY - Professional Service Application', pageWidth / 2, pageHeight - 10, { align: 'center' });
            doc.text(`Page ${pageNum}`, pageWidth - 20, pageHeight - 10);
        };

        const drawSectionTitle = (title) => {
            if (yPos > pageHeight - 40) {
                doc.addPage();
                yPos = 20;
                doc.setFontSize(10);
                doc.setTextColor(textLight[0], textLight[1], textLight[2]);
                doc.text('Continued...', margin, 15);
            }
            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.rect(margin, yPos - 5, 3, 8, 'F');

            doc.setFontSize(14);
            doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
            doc.setFont('helvetica', 'bold');
            doc.text(title, margin + 5, yPos + 1);

            doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setLineWidth(0.5);
            doc.line(margin, yPos + 4, pageWidth - margin, yPos + 4);
            yPos += 15;
        };

        const drawField = (label, value) => {
            if (yPos > pageHeight - 20) {
                doc.addPage();
                yPos = 25;
            }
            doc.setFontSize(10);
            doc.setTextColor(textLight[0], textLight[1], textLight[2]);
            doc.setFont('helvetica', 'bold');
            doc.text(label.toUpperCase(), margin, yPos);

            doc.setTextColor(textMain[0], textMain[1], textMain[2]);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);

            const splitValue = doc.splitTextToSize(value || 'N/A', pageWidth - margin - 75);
            doc.text(splitValue, margin + 65, yPos);

            yPos += (splitValue.length * 6) + 3;
        };

        const drawSelectedItem = (item) => {
            if (yPos > pageHeight - 15) {
                doc.addPage();
                yPos = 25;
            }
            doc.setFontSize(11);
            doc.setTextColor(textMain[0], textMain[1], textMain[2]);
            doc.setFont('helvetica', 'normal');
            doc.text(`\u2022 ${item}`, margin + 5, yPos);
            yPos += 7;
        };

        const drawImage = (label, imagePath, x, y, w, h) => {
            // Always draw label and box frame
            doc.setFontSize(10);
            doc.setTextColor(textLight[0], textLight[1], textLight[2]);
            doc.setFont('helvetica', 'bold');
            doc.text(label.toUpperCase(), x, y - 2);

            doc.setDrawColor(textLight[0], textLight[1], textLight[2]);
            doc.setLineWidth(0.1);
            doc.rect(x, y, w, h); // Draw border for the box

            if (!imagePath) {
                // Draw placeholder text
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(200, 200, 200);
                doc.text('Pending Upload', x + 5, y + (h / 2));
                return;
            }

            try {
                // Construct absolute path. 
                // Stored path example: /api/storage/file/uploads/images/file.jpg
                // We need: public/uploads/images/file.jpg

                let cleanPath = imagePath;
                if (cleanPath.startsWith('/api/storage/file/')) {
                    cleanPath = cleanPath.replace('/api/storage/file/', '');
                } else if (cleanPath.startsWith('/')) {
                    cleanPath = cleanPath.substring(1);
                }

                const absolutePath = path.join(process.cwd(), 'public', cleanPath);

                if (fs.existsSync(absolutePath)) {
                    const imgBuffer = fs.readFileSync(absolutePath);
                    const imgBase64 = imgBuffer.toString('base64');
                    const ext = path.extname(absolutePath).substring(1).toUpperCase();

                    doc.addImage(imgBase64, ext === 'JPG' ? 'JPEG' : ext, x + 1, y + 1, w - 2, h - 2);
                } else {
                    doc.setFont('helvetica', 'italic');
                    doc.setTextColor(200, 200, 200);
                    doc.text('Image File Missing', x + 5, y + (h / 2));
                }
            } catch (e) {
                console.error(`Error drawing image ${label}:`, e);
                doc.text('[Error]', x + 5, y + 10);
            }
        };

        // --- PAGE 1: Personal Details & Documents ---
        drawHeader('SERVICE APPLICATION');
        // --- PAGE 1: Personal Details & Documents ---
        drawHeader('SERVICE APPLICATION');
        // Footers will be added at the end

        drawSectionTitle('Student Personal Information');
        const p = submission.personalDetails || {};
        drawField('Full Name', p.fullName);
        drawField('Email Address', p.email);
        drawField('Mobile / WhatsApp', p.mobile);
        drawField('Date of Birth', p.dob);
        drawField('Nationality', p.nationality);
        drawField('Passport Number', p.passportNumber);
        drawField('Education', p.education);
        drawField('Experience', p.workExperience + ' Years');
        drawField('Current Address', p.currentAddress);

        yPos += 10;
        drawSectionTitle('Uploaded Documents');
        const d = submission.documents || {};

        // 2x2 Grid Layout
        // Page width is typically ~210mm. Margin 20. Content width ~170.
        // Box width ~80. Box height ~50.

        const boxW = 80;
        const boxH = 55;
        const gap = 10;
        const startX = margin;

        // Check space
        if (yPos + (boxH * 2) + gap > pageHeight - 20) {
            doc.addPage();
            yPos = 25;
        }

        // Row 1
        let currentY = yPos + 5;
        drawImage('Passport Front', d.passportFront, startX, currentY, boxW, boxH);
        drawImage('Passport Back', d.passportBack, startX + boxW + gap, currentY, boxW, boxH);

        // Row 2
        currentY += boxH + 15;
        drawImage('Passport Photo', d.passportPhoto, startX, currentY, boxW, boxH);
        drawImage('Selfie / Human Check', d.selfiePhoto, startX + boxW + gap, currentY, boxW, boxH);

        yPos = currentY + boxH + 10;

        // --- Service Selections ---
        drawSectionTitle('Service Selection Details');

        const s = submission.selections || {};

        // Normalize gulfLicenseCourse to array (it might be a string from Radio button)
        const gulfCourses = Array.isArray(s.gulfLicenseCourse)
            ? s.gulfLicenseCourse
            : (s.gulfLicenseCourse ? [s.gulfLicenseCourse] : []);

        if (gulfCourses.length > 0) {
            drawSectionTitle('Gulf Specialized Courses / Exams');
            gulfCourses.forEach(ex => drawSelectedItem(ex));
            yPos += 5;
        }

        if (s.coursePackageType && s.coursePackageType.length > 0) {
            drawSectionTitle('Selected Package Category');
            s.coursePackageType.forEach(pk => drawSelectedItem(pk));
            yPos += 5;
        }

        if (s.servicesSelected && s.servicesSelected.length > 0) {
            drawSectionTitle('Included Support Services');
            s.servicesSelected.forEach(sv => drawSelectedItem(sv));
            yPos += 5;
        }

        if (s.otherService && s.otherService.trim() !== '') {
            drawSectionTitle('Special Requests / Remarks');
            drawField('Other Details', s.otherService);
        }

        if (s.confirmedPaymentServices && s.confirmedPaymentServices.length > 0) {
            yPos += 5;
            drawSectionTitle('Payment Based on Selected Services');
            s.confirmedPaymentServices.forEach(ps => drawSelectedItem(ps));
            if (s.otherPayment) drawField('Other Payment Details', s.otherPayment);
            yPos += 5;
        }

        if (s.paymentMethods && s.paymentMethods.length > 0) {
            drawSectionTitle('Payment Confirmation Method');
            s.paymentMethods.forEach(pm => drawSelectedItem(pm));
            yPos += 5;
        }

        // Service-Wise Payment Terms Declarations
        if (s.paymentTerms) {
            drawSectionTitle('Service-Wise Payment Terms');
            if (s.paymentTerms.noAdvanceAccepted) drawSelectedItem('I understand that MD Consultancy does NOT take advance payment.');
            if (s.paymentTerms.payAsWorkAccepted) drawSelectedItem('I will pay fees only for selected services and work started/completed.');
            yPos += 5;
        }

        // --- Declarations & Consents ---
        yPos += 5;
        // Check if there are declarations to show
        const declarations = s.declarations || {};
        const ca = s.clientAcceptance || {};

        const drawWrappedText = (text, indent = 0) => {
            if (yPos > pageHeight - 15) {
                doc.addPage();
                yPos = 25;
            }
            doc.setFontSize(10);
            doc.setTextColor(textMain[0], textMain[1], textMain[2]);
            doc.setFont('helvetica', 'normal');

            const lines = doc.splitTextToSize(text, pageWidth - margin - margin - indent);
            doc.text(lines, margin + indent, yPos);
            yPos += (lines.length * 5) + 3;
        };

        // 1. IMPORTANT NOTE (Static)
        doc.setFontSize(11);
        doc.setTextColor(255, 0, 0);
        doc.setFont('helvetica', 'bold');
        drawWrappedText('IMPORTANT NOTE');
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textMain[0], textMain[1], textMain[2]);
        drawWrappedText('Work/process will start only after MD Consultancy approval and payment confirmation as per selected services.');
        yPos += 5;

        // 2. LEGAL DISCLAIMER (Static)
        drawSectionTitle('LEGAL DISCLAIMER (INDIA COMPLIANCE)');
        drawWrappedText('MD Consultancy is a private consultancy / coaching & documentation support service provider. We are NOT a government body, NOT a visa issuing authority, and NOT affiliated with DHA / DOH / MOH / Prometric / DataFlow / PSV authorities.');
        drawWrappedText('All services are provided on the client\'s request and depend on official rules, portal systems, authority verification, and timelines.');
        yPos += 5;

        if (declarations.declarationAccepted || ca.paymentAccordingToWork || ca.thirdPartyFeesSeparate) {
            drawSectionTitle('CLIENT DECLARATION & TERMS (MANDATORY)');

            if (declarations.declarationAccepted) {
                doc.setFont('helvetica', 'bold');
                drawWrappedText(`I, ${submission.personalDetails?.fullName || '___________________________________________'} (Client Name), confirm that I am voluntarily taking services from MD Consultancy.`);
                doc.setFont('helvetica', 'normal');

                drawWrappedText('Terms & Conditions:', 0);

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

                terms.forEach(term => drawWrappedText(term, 5));
                yPos += 5;
            }

            if (ca.paymentAccordingToWork) drawSelectedItem('Accepted: Payment is strictly according to work progress.');
            if (ca.thirdPartyFeesSeparate) drawSelectedItem('Accepted: Third-party fees (embassy, etc.) are separate.');
            // Removed redundant summary line
            yPos += 5;
        }

        if (declarations.dataPrivacy) {
            drawSectionTitle('Data Privacy & Digital Consent');
            if (declarations.digitalConsent?.confirmed) drawSelectedItem('Confirmed: Digital Signature is valid.');
            if (declarations.digitalConsent?.validTreat) drawSelectedItem('Accepted: E-Sign treated as physical signature.');
            if (declarations.dataPrivacy?.collectionAuth) drawSelectedItem('Authorized: Data collection for processing.');
            if (declarations.dataPrivacy?.shareAuth) drawSelectedItem('Authorized: Sharing data with relevant authorities.');
            yPos += 5;
        }

        if (declarations.refundPolicy) {
            drawSectionTitle('Refund Policy Acknowledgement');
            if (declarations.refundPolicy.startedNonRefundable) drawSelectedItem('Understood: Fees non-refundable once work starts.');
            if (declarations.refundPolicy.cancelNoRefund) drawSelectedItem('Understood: No refund on cancellation.');
            if (declarations.refundPolicy.thirdPartyNonRefundable) drawSelectedItem('Understood: Third-party fees are non-refundable.');
            yPos += 5;
        }

        if (declarations.thirdPartyDisclaimer) {
            drawSectionTitle('Third-Party Disclaimer');
            if (declarations.thirdPartyDisclaimer.govtDecision) drawSelectedItem('Understood: Authority decisions are final.');
            if (declarations.thirdPartyDisclaimer.consultancyLiability) drawSelectedItem('Understood: Consultancy not liable for delays.');
            yPos += 5;
        }

        if (declarations.finalConfirmation) {
            drawSectionTitle('Final Confirmation');
            if (declarations.finalConfirmation['readAll ']) drawSelectedItem('Confirmed: I have read all terms and conditions.'); // Note space key
            if (declarations.finalConfirmation.authorizeStart) drawSelectedItem('Authorized: Start processing application.');
            yPos += 5;
        }
        yPos += 5;
        yPos += 5;
        drawSectionTitle('Payment Authorization');

        doc.setFontSize(10);
        doc.setTextColor(textMain[0], textMain[1], textMain[2]);
        drawSelectedItem('I acknowledge that MD Consultancy does not accept any advance payment.');
        drawSelectedItem('I agree to proceed with the services as per the discussed milestones.');
        drawField('Payment Mode', s.paymentMethod || 'Selected by Consultant');

        yPos += 10;

        // Stamp and Signature Area
        drawSectionTitle('Digital Verification & Approval');
        const sig = submission.signature || {};

        // Draw Stamp
        try {
            const stampPath = path.join(process.cwd(), 'public', 'images', 'stamp.jpeg');
            if (fs.existsSync(stampPath)) {
                const stampBuffer = fs.readFileSync(stampPath);
                const stampBase64 = stampBuffer.toString('base64');
                doc.addImage(stampBase64, 'JPEG', pageWidth - 70, yPos, 45, 45);
            }
        } catch (e) {
            console.error('Stamp embed error:', e);
        }

        doc.setFontSize(11);
        doc.setTextColor(textLight[0], textLight[1], textLight[2]);
        doc.text('CLIENT DIGITAL SIGNATURE:', margin, yPos + 10);

        // Draw Client Signature Image
        if (sig.signatureImage) {
            try {
                let cleanSigPath = sig.signatureImage;
                if (cleanSigPath.startsWith('/api/storage/file/')) {
                    cleanSigPath = cleanSigPath.replace('/api/storage/file/', '');
                } else if (cleanSigPath.startsWith('/')) {
                    cleanSigPath = cleanSigPath.substring(1);
                }

                const absSigPath = path.join(process.cwd(), 'public', cleanSigPath);

                if (fs.existsSync(absSigPath)) {
                    const sigBuffer = fs.readFileSync(absSigPath);
                    const sigBase64 = sigBuffer.toString('base64');
                    const sigExt = path.extname(absSigPath).substring(1).toUpperCase();
                    doc.addImage(sigBase64, sigExt === 'JPG' ? 'JPEG' : sigExt, margin, yPos + 15, 60, 30);
                }
            } catch (e) {
                console.error('Signature embed error:', e);
            }
        }

        doc.setFont('courier', 'bolditalic');
        doc.setFontSize(12);
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text(sig.clientName || 'AUTHORIZED SIGNATORY', margin, yPos + 50);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(textLight[0], textLight[1], textLight[2]);
        doc.text(`Submission Date: ${sig.date ? new Date(sig.date).toLocaleDateString('en-GB') : 'N/A'}`, margin, yPos + 35);
        doc.text(`Filing Location: ${sig.place || 'Registered Address'}`, margin, yPos + 42);

        // Verification Badge
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(0.8);
        doc.setFillColor(245, 255, 235); // Very light green
        doc.rect(margin, yPos + 60, pageWidth - (margin * 2), 22, 'FD');

        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');

        doc.text('CERTIFIED DIGITAL AUTHENTICATION BY MD CONSULTANCY', pageWidth / 2, yPos + 74, { align: 'center' });

        // --- Finalize: Add Footers to All Pages ---
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            drawFooter(i);
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
