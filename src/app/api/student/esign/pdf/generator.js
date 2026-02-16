import { jsPDF } from 'jspdf';
import { PDFDrawer } from './pdf-drawing';
import { drawImage } from './pdf-images';
import path from 'path';
import fs from 'fs';

export async function generateESignPDF(submission, userImages = {}, userProfile = null) {
    const doc = new jsPDF();
    const drawer = new PDFDrawer(doc);

    // --- PAGE 1: Personal Details & Documents ---
    drawer.drawHeader('SERVICE APPLICATION');

    drawer.drawSectionTitle('Student Personal Information');
    const p = submission.personalDetails || {};

    drawer.drawKeyValueTable([
        { label: 'Full Name', value: p.fullName },
        { label: 'Email Address', value: p.email },
        { label: 'Mobile / WhatsApp', value: p.mobile },
        { label: 'Date of Birth', value: p.dob },
        { label: 'Nationality', value: p.nationality },
        { label: 'Passport Number', value: p.passportNumber },
        { label: 'Education', value: p.education },
        { label: 'Experience', value: p.workExperience ? `${p.workExperience} Years` : '' },
        { label: 'Current Address', value: p.currentAddress },
        { label: 'Roll Number', value: p.rollNumber || 'N/A' }
    ]);

    drawer.yPos += 10;

    // --- Uploaded Documents ---
    const boxW = 75;
    const boxH = 55;
    const gap = 5;

    if (drawer.yPos + 75 > drawer.pageHeight - 20) {
        doc.addPage();
        drawer.yPos = 25;
    }

    drawer.drawSectionTitle('Uploaded Documents');
    const d = submission.documents || {};
    const startX = drawer.margin;

    let currentY = drawer.yPos + 5;

    await drawImage(doc, 'Passport Front', d.passportFront || userImages.passportFront, startX, currentY, boxW, boxH, drawer.colors);
    await drawImage(doc, 'Passport Back', d.passportBack || userImages.passportBack, startX + boxW + gap, currentY, boxW, boxH, drawer.colors);

    currentY += boxH + 10;

    if (currentY + boxH + 8 > drawer.pageHeight - 15) {
        doc.addPage();
        currentY = 25;
    }

    await drawImage(doc, 'Passport Photo', d.passportPhoto || userImages.passportPhoto, startX, currentY, boxW, boxH, drawer.colors);

    const selfieToUse = d.selfiePhoto || userImages.selfiePhoto || userProfile || d.selfie || userImages.selfie;
    const selfieX = startX + boxW + gap;
    const actualSelfieW = await drawImage(doc, 'Selfie / Human Check', selfieToUse, selfieX, currentY, boxW, boxH, drawer.colors, { autoWidth: true });

    if (selfieToUse) {
        try {
            let dateObj = new Date(submission.updatedAt || new Date());
            if (submission.signature && submission.signature.date) {
                const sigDateStr = String(submission.signature.date);
                if (/^\d{2}\/\d{2}\/\d{4}$/.test(sigDateStr)) {
                    const [day, month, year] = sigDateStr.split('/').map(Number);
                    const tempDate = new Date();
                    tempDate.setFullYear(year, month - 1, day);
                    if (!isNaN(tempDate.getTime())) {
                        const serverTime = new Date(submission.updatedAt || new Date());
                        tempDate.setHours(serverTime.getHours(), serverTime.getMinutes(), serverTime.getSeconds());
                        dateObj = tempDate;
                    }
                } else {
                    const parsed = new Date(sigDateStr);
                    if (!isNaN(parsed.getTime())) dateObj = parsed;
                }
            }

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
                const textX = selfieX + (actualSelfieW / 2);
                doc.text(`VERIFIED ON: ${dStr} ${tStr}`, textX, currentY + boxH + 5, { align: 'center' });
                doc.setFont('helvetica', 'normal');
            }
        } catch (err) {
            console.error("Error drawing selfie timestamp:", err);
        }
    }

    drawer.yPos = currentY + boxH + 15;

    const s = submission.selections || {};

    const gulfCourses = Array.isArray(s.gulfLicenseCourse) ? s.gulfLicenseCourse : (s.gulfLicenseCourse ? [s.gulfLicenseCourse] : []);
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

    if (s.confirmedPaymentServices && s.confirmedPaymentServices.length > 0) {
        drawer.yPos += 5;
        drawer.drawSectionTitle('Payment Based on Selected Services');
        s.confirmedPaymentServices.forEach(ps => drawer.drawSelectedItem(ps));
        drawer.yPos += 5;
    }

    if (s.paymentMethods && s.paymentMethods.length > 0) {
        drawer.drawSectionTitle('Payment Confirmation Method (Receipt Not Mandatory)');
        s.paymentMethods.forEach(pm => drawer.drawSelectedItem(pm));
        drawer.yPos += 5;
    }

    drawer.yPos += 5;
    const declarations = s.declarations || {};
    const ca = s.clientAcceptance || {};

    drawer.drawSectionTitle('Service-Wise Payment Terms');
    drawer.drawSelectedItem('I understand that MD Consultancy does NOT take advance payment.');
    drawer.drawSelectedItem('I will pay fees only for selected services and work started/completed.');
    drawer.yPos += 10;

    if (declarations.declarationAccepted || ca.paymentAccordingToWork || ca.thirdPartyFeesSeparate) {
        drawer.drawSectionTitle('CLIENT DECLARATION & TERMS (MANDATORY)');
        if (declarations.declarationAccepted) {
            drawer.drawWrappedText(
                `I, ${submission.personalDetails?.fullName || '___________________________________________'}, hereby confirm that I am voluntarily taking professional consultancy services from MD Consultancy.`,
                0,
                { fontStyle: 'bold' }
            );
            drawer.yPos += 5;

            const terms = [
                { title: '1. Voluntary Service Confirmation', content: 'I confirm that I am availing services by my own free will without any pressure, coercion, fraud, or misrepresentation.' },
                { title: '2. Document Authenticity Declaration', content: 'I declare that all documents and information submitted by me are true, genuine, authentic, and legally valid. If any document is found fake, forged, altered, fabricated, or misleading, I shall be solely responsible for all civil and criminal liabilities.' },
                { title: '3. Service Scope Limitation', content: 'MD Consultancy provides professional guidance, coaching, documentation support, and process assistance only. MD Consultancy does NOT guarantee PASS, JOB, VISA, LICENSE approval, or employment.' },
                { title: '4. No Employment Agency Clause', content: 'MD Consultancy is NOT a recruitment agency and does not guarantee job placement, salary, offer letter, or employment contract.' },
                { title: '5. Authority Decision Clause', content: 'All approvals and decisions (including but not limited to DHA / DOH / MOH / Prometric / DataFlow / PSV / Embassy / Immigration authorities) are controlled by respective official authorities. Authority decisions are final and binding.' },
                { title: '6. Performance Responsibility Clause', content: 'Exam results, eligibility approval, verification outcomes, interview performance, and licensing decisions depend entirely upon my qualifications and authority verification.' },
                { title: '7. Rule Change Protection Clause', content: 'If any authority changes rules, fees, eligibility criteria, or procedures at any stage, I agree to comply with updated rules. MD Consultancy shall not be responsible for such changes.' },
                { title: '8. Delay & Rejection Clause', content: 'Any delay or rejection due to Authority timelines, Rule changes, Incomplete / incorrect documents, Technical portal errors, Third-party verification, or Eligibility issues shall not be the responsibility of MD Consultancy.' },
                { title: '9. Third-Party Charges Clause', content: 'All third-party charges (exam fees, embassy fees, authority portal fees, DataFlow fees, visa fees, air tickets, courier charges, etc.) are separate and strictly non-refundable.' },
                { title: '10. Service Fee & Refund Policy (STRICT)', content: 'Service fees are charged for professional work performed. Once any process has started (Eligibility, DataFlow, Exam Booking, Documentation, Coaching, Visa Process, etc.), service fees are strictly non-refundable under any circumstances. Cancellation after process initiation shall not be eligible for refund.' },
                { title: '11. Instalment Default Clause', content: 'If any payment milestone is delayed, MD Consultancy reserves the right to pause or terminate services without liability.' },
                { title: '12. Payment Proof Clause', content: 'All payments must be supported by valid proof (UTR / Transaction ID / Screenshot / Receipt). Without valid proof, MD Consultancy shall not be liable for payment disputes.' },
                { title: '13. Cash Payment Protection Clause', content: 'In case of cash payment without official receipt, the client shall not raise any future payment dispute.' },
                { title: '14. Chargeback & False Complaint Protection', content: 'I agree not to raise false chargebacks, payment reversals, or baseless complaints after service initiation. Legal recovery action may be initiated in such cases.' },
                { title: '15. Criminal Liability Clause', content: 'MD Consultancy does NOT create, alter, manipulate, or fabricate any government document. Any legal issue arising from submitted documents shall be solely my responsibility.' },
                { title: '16. Indemnity Clause', content: 'I agree to indemnify and hold harmless MD Consultancy from any legal claims, penalties, damages, losses, or liabilities arising due to: Fake documents, False information, Authority rejection, or Third-party actions.' },
                { title: '17. Misconduct Clause', content: 'Use of abusive language, threats, harassment, or defamation against MD Consultancy or its staff will result in immediate termination of services without refund.' },
                { title: '18. Defamation Protection Clause', content: 'False allegations, social media defamation, or reputational damage attempts may result in strict legal action.' },
                { title: '19. Digital Communication Validity', content: 'WhatsApp chats, emails, SMS, call recordings, and digital payment confirmations shall be treated as valid legal proof of consent and agreement.' },
                { title: '20. Recording Consent Clause', content: 'I consent that calls may be recorded for quality control and legal protection purposes.' },
                { title: '21. Data Privacy & Authorization', content: 'I authorize MD Consultancy to: Submit my documents for official processing, Share data with relevant authorities, and Use information strictly for processing purposes. All documents will be kept confidential and shared only when required for official processing.' },
                { title: '22. Legal Notice Requirement Clause', content: 'Before filing any legal complaint or police case, I agree to send a written legal notice and allow 15 working days for resolution.' },
                { title: '23. Force Majeure Clause', content: 'MD Consultancy shall not be responsible for delays caused by: Natural disasters, Government restrictions, Portal/server issues, Strikes, Pandemic, or Unforeseen circumstances.' },
                { title: '24. Jurisdiction Clause', content: 'Any dispute shall be subject to Bhavnagar, Gujarat jurisdiction only.' }
            ];

            terms.forEach(term => {
                drawer.checkPageBreak(30);

                // Title: 12pt Bold
                drawer.drawWrappedText(term.title, 0, {
                    fontSize: 12,
                    fontStyle: 'bold',
                    textColor: drawer.colors.secondary
                });
                drawer.yPos -= 8; // Tighter gap between title and its description

                // Content: 11pt Bold
                drawer.drawWrappedText(term.content, 5, {
                    fontSize: 11,
                    fontStyle: 'bold',
                    textColor: drawer.colors.textMain
                });
                drawer.yPos += 2; // Extra gap between the end of one point and the start of the next
            });
            drawer.yPos += 5;
        }
    }

    drawer.yPos += 10;
    drawer.checkPageBreak(30);
    drawer.drawSectionTitle('LEGAL DISCLAIMER (INDIA COMPLIANCE)');
    const disclaimerParts = [
        'MD Consultancy is a private consultancy and documentation support service provider.',
        'We are NOT a government authority, NOT a visa issuing authority, and NOT affiliated with DHA / DOH / MOH / Prometric / DataFlow / PSV authorities.',
        'All approvals and decisions are subject to official authority rules and verification.',
        'We are not responsible for rejection, delay, government rule changes, or technical portal issues.'
    ];
    disclaimerParts.forEach(part => {
        drawer.drawWrappedText(part, 0, { fontStyle: 'bold' });
        drawer.yPos -= 7;
    });
    drawer.yPos += 7;
    drawer.yPos += 5;

    drawer.checkPageBreak(30);
    drawer.drawSectionTitle('FINAL CONFIRMATION');
    drawer.drawWrappedText('I hereby confirm that:', 0, { fontStyle: 'bold' });
    const finalPoints = [
        '• I have read and understood all the above terms and conditions.',
        '• I legally accept all clauses mentioned above.',
        '• I will not raise any false complaint or payment dispute after service initiation.',
        '• I take full responsibility for my documents and authority outcomes.'
    ];
    finalPoints.forEach(p => drawer.drawSelectedItem(p));

    drawer.yPos += 5;
    drawer.yPos += 10;
    drawer.checkPageBreak(25);
    drawer.drawSectionTitle('Payment Authorization');

    doc.setFontSize(10);
    doc.setTextColor(drawer.colors.textMain[0], drawer.colors.textMain[1], drawer.colors.textMain[2]);
    drawer.drawSelectedItem('I acknowledge that MD Consultancy does not accept any advance payment.');
    drawer.drawSelectedItem('I agree to proceed with the services as per the discussed milestones.');

    drawer.yPos += 5;
    drawer.drawField('PAYMENT MODE', s.paymentMethod || 'Selected by Consultant');

    drawer.yPos += 15;
    drawer.checkPageBreak(60);

    const sig = submission.signature || {};

    try {
        const stampPath = path.join(process.cwd(), 'public', 'images', 'stamp.jpeg');
        if (fs.existsSync(stampPath)) {
            const stampBuffer = fs.readFileSync(stampPath);
            const stampBase64 = stampBuffer.toString('base64');
            doc.addImage(stampBase64, 'JPEG', drawer.pageWidth - 65, drawer.yPos, 45, 45);
        }
    } catch (e) { }

    const signatureToUse = sig.signatureImage || userImages.signatureImage;
    if (signatureToUse) {
        await drawImage(doc, 'Client Signature', signatureToUse, drawer.margin, drawer.yPos + 25, 50, 25, drawer.colors);
    }

    doc.setFont('courier', 'bolditalic');
    doc.setFontSize(12);
    doc.setTextColor(drawer.colors.secondary[0], drawer.colors.secondary[1], drawer.colors.secondary[2]);
    doc.text(sig.clientName || submission.personalDetails?.fullName || 'AUTHORIZED SIGNATORY', drawer.margin, drawer.yPos + 60);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    let subDate = new Date().toLocaleDateString('en-GB');
    if (sig.date) {
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(sig.date)) {
            subDate = sig.date;
        } else {
            try {
                const parsed = new Date(sig.date);
                if (!isNaN(parsed.getTime())) subDate = parsed.toLocaleDateString('en-GB');
            } catch (e) { }
        }
    }
    const loc = sig.place || 'Porbandar';
    doc.text(`Submission Date: ${subDate} Filing Location: ${loc}`, drawer.margin, drawer.yPos + 68);

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

    return doc.output('arraybuffer');
}
