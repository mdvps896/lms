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
            // Background Header
            doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
            doc.rect(0, 0, pageWidth, 40, 'F');

            // Logo
            try {
                const logoPath = path.join(process.cwd(), 'public', 'images', 'logo-lite.webp');
                if (fs.existsSync(logoPath)) {
                    const logoBuffer = fs.readFileSync(logoPath);
                    const logoBase64 = logoBuffer.toString('base64');
                    // Note: jsPDF might need the correct format string
                    doc.addImage(logoBase64, 'WEBP', 10, 5, 30, 30);
                }
            } catch (e) {
                console.error('Logo embed error:', e);
            }

            doc.setFontSize(22);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text(title, pageWidth / 2 + 15, 25, { align: 'center' });

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
        drawField('Aadhaar Number', p.aadhaarNumber);
        drawField('Education', p.education);
        drawField('Experience', p.workExperience + ' Years');
        drawField('Current Address', p.currentAddress);

        yPos += 10;
        drawSectionTitle('Documents Verification Status');
        const d = submission.documents || {};
        const getStatus = (val) => val ? 'VERIFIED' : 'PENDING';
        drawField('Passport Copy (Front)', getStatus(d.passportFront));
        drawField('Passport Copy (Back)', getStatus(d.passportBack));
        drawField('Passport Size Photo', getStatus(d.passportPhoto));
        drawField('Identity Verification (Selfie)', getStatus(d.selfiePhoto));

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

        doc.setFont('courier', 'bolditalic');
        doc.setFontSize(18);
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text(sig.clientName || 'AUTHORIZED SIGNATORY', margin, yPos + 22);

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
