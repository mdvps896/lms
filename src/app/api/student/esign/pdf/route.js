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

        const drawImage = (label, imagePath) => {
            if (!imagePath) return;

            if (yPos > pageHeight - 80) {
                doc.addPage();
                yPos = 25;
            }

            doc.setFontSize(10);
            doc.setTextColor(textLight[0], textLight[1], textLight[2]);
            doc.setFont('helvetica', 'bold');
            doc.text(label.toUpperCase(), margin, yPos);

            try {
                // Construct absolute path. stored path is like '/uploads/...' or 'uploads/...'
                // Remove leading slash if present to join correctly
                const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
                const absolutePath = path.join(process.cwd(), 'public', cleanPath);

                if (fs.existsSync(absolutePath)) {
                    const imgBuffer = fs.readFileSync(absolutePath);
                    const imgBase64 = imgBuffer.toString('base64');
                    const ext = path.extname(absolutePath).substring(1).toUpperCase();

                    // Simple aspect ratio handling: fix width to 80, scale height
                    // For passport (landscape) vs selfie (portrait)
                    // Let's just use a fixed box for now to fit layout
                    doc.addImage(imgBase64, ext === 'JPG' ? 'JPEG' : ext, margin, yPos + 5, 80, 50);
                    yPos += 60;
                } else {
                    doc.setFont('helvetica', 'italic');
                    doc.text('[Image Not Found]', margin, yPos + 10);
                    yPos += 15;
                }
            } catch (e) {
                console.error(`Error drawing image ${label}:`, e);
                doc.text('[Error Loading Image]', margin, yPos + 10);
                yPos += 15;
            }
        };

        // --- PAGE 1: Personal Details & Documents ---
        drawHeader('SERVICE APPLICATION');
        drawFooter(1);

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
        yPos += 10;
        drawSectionTitle('Uploaded Documents');
        const d = submission.documents || {};

        // We'll put images in a grid or sequence
        // For simplicity in PDF, sequence is safer

        if (d.passportFront) drawImage('Passport Copy (Front)', d.passportFront);
        if (d.passportBack) drawImage('Passport Copy (Back)', d.passportBack);
        if (d.passportPhoto) drawImage('Passport Size Photo', d.passportPhoto);
        if (d.selfiePhoto) drawImage('Identity Verification (Selfie)', d.selfiePhoto);

        // --- PAGE 2: Services selections ---
        doc.addPage();
        yPos = 25;
        doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.rect(0, 0, pageWidth, 20, 'F');
        doc.setTextColor(255);
        doc.setFontSize(12);
        doc.text('SERVICE SELECTION DETAILS', pageWidth / 2, 13, { align: 'center' });
        yPos = 35;
        drawFooter(2);

        const s = submission.selections || {};

        if (s.gulfLicenseCourse && s.gulfLicenseCourse.length > 0) {
            drawSectionTitle('Gulf Specialized Courses / Exams');
            s.gulfLicenseCourse.forEach(ex => drawSelectedItem(ex));
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
            yPos += 10;
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

        // --- PAGE 3: Authorization ---
        doc.addPage();
        yPos = 25;
        doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.rect(0, 0, pageWidth, 20, 'F');
        doc.setTextColor(255);
        doc.setFontSize(12);
        doc.text('AUTHORIZATION & DISCLAIMER', pageWidth / 2, 13, { align: 'center' });
        yPos = 35;
        drawFooter(3);

        drawSectionTitle('Acknowledgement of Terms');
        doc.setFontSize(10);
        doc.setTextColor(textMain[0], textMain[1], textMain[2]);
        drawSelectedItem('I acknowledge that MD Consultancy does not accept any advance payment.');
        drawSelectedItem('I agree to proceed with the services as per the discussed milestones.');
        drawField('Payment Mode', s.paymentMethod || 'Selected by Consultant');

        yPos += 10;
        drawSectionTitle('Legal Disclaimer');
        doc.setFontSize(9);
        doc.setTextColor(textLight[0], textLight[1], textLight[2]);
        doc.setFont('helvetica', 'normal');
        const disclaimer = "MD Consultancy is a private professional consultancy, coaching, and documentation support provider. We are NOT a government body, NOT a visa issuing authority, and NOT affiliated with any official healthcare authorities (DHA, DOH, MOH, etc.) or DataFlow/Prometric. Timeline and verification results depend entirely on the respective authority portals and official rules.";
        const splitDisc = doc.splitTextToSize(disclaimer, pageWidth - (margin * 2));
        doc.text(splitDisc, margin, yPos);
        yPos += (splitDisc.length * 5) + 15;

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
                const cleanSigPath = sig.signatureImage.startsWith('/') ? sig.signatureImage.substring(1) : sig.signatureImage;
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
