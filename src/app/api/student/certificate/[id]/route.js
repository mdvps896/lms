import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ExamAttempt from '@/models/ExamAttempt';
import Settings from '@/models/Settings';
import jsPDF from 'jspdf';
import path from 'path';
import fs from 'fs';

// Helper to load fonts/images from the local filesystem
const loadAsset = (relativePath) => {
    try {
        const fullPath = path.join(process.cwd(), 'public', relativePath);
        if (fs.existsSync(fullPath)) {
            return fs.readFileSync(fullPath);
        }
        return null;
    } catch (e) {
        console.error(`Error loading asset ${relativePath}:`, e);
        return null;
    }
};

export async function GET(request, { params }) {
    try {
        await dbConnect();
        const { id } = params;

        // 1. Fetch Attempt with populated data
        const attempt = await ExamAttempt.findById(id)
            .populate('user', 'name email parentName rollNumber')
            .populate('exam', 'name');

        if (!attempt) {
            return NextResponse.json({ success: false, message: 'Attempt not found' }, { status: 404 });
        }

        // 2. Fetch Settings for branding
        const settings = await Settings.findOne({});
        const generalSettings = settings?.general || {};

        // 3. Initialize PDF (Landscape A4) with compression
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
            compress: true
        });

        const width = doc.internal.pageSize.getWidth();
        const height = doc.internal.pageSize.getHeight();

        // --- DESIGN TOKENS ---
        const colors = {
            navy: [27, 66, 108],    // #1b426c
            gold: [144, 199, 64],   // #90c740 (Green)
            darkGold: [115, 159, 51], // Darker version of #90c740
            textMain: [40, 40, 40],
            textLight: [100, 100, 100],
            white: [255, 255, 255],
            red: [220, 53, 69] // Red for Fail
        };

        // --- BACKGROUND & BORDERS ---
        // 1. Solid Navy Outer Margin
        doc.setFillColor(...colors.navy);
        doc.rect(0, 0, width, height, 'F');

        // 2. White Inner Body
        doc.setFillColor(...colors.white);
        doc.rect(5, 5, width - 10, height - 10, 'F');

        // 3. Double Gold Borders
        doc.setLineWidth(1.5);
        doc.setDrawColor(...colors.gold);
        doc.rect(10, 10, width - 20, height - 20, 'S');

        doc.setLineWidth(0.5);
        doc.rect(12, 12, width - 24, height - 24, 'S');

        // 4. Decorative Corner Accents
        const drawCorner = (x, y, rotX, rotY) => {
            doc.setFillColor(...colors.navy);
            doc.triangle(x, y, x + (15 * rotX), y, x, y + (15 * rotY), 'F');
            doc.setDrawColor(...colors.gold);
            doc.line(x + (2 * rotX), y + (18 * rotY), x + (18 * rotX), y + (2 * rotY));
        };
        drawCorner(12, 12, 1, 1);       // Top Left
        drawCorner(width - 12, 12, -1, 1); // Top Right
        drawCorner(12, height - 12, 1, -1); // Bottom Left
        drawCorner(width - 12, height - 12, -1, -1); // Bottom Right

        // --- WATERMARK (Added) ---
        // Text Watermark: "MD CONSULTANCY"
        try {
            doc.saveGraphicsState();
            doc.setGState(new doc.GState({ opacity: 0.2 })); // 10% opacity
            doc.setFont("helvetica", "bold");
            doc.setFontSize(110);
            doc.setTextColor(220, 220, 220);
            // Corrected Y from 300 to 110 (center of A4 page)
            doc.text("MD CONSULTANCY", width / 2, 110, { align: "center", angle: 45 });
            doc.restoreGraphicsState();
        } catch (e) {
            console.error("Error adding watermark:", e);
        }


        // --- HEADER SECTION ---
        let y = 20; // Reduced top margin

        // Logo Placement
        let logoPath = generalSettings.siteLogo ? generalSettings.siteLogo.replace(/^\//, '') : 'images/logo-full.png';
        let logoBuffer = loadAsset(logoPath);

        // Fallback mechanism: If custom logo fails, load default
        if (!logoBuffer) {
            logoPath = 'images/logo-full.png';
            logoBuffer = loadAsset(logoPath);
        }

        if (logoBuffer) {
            const ext = logoPath.split('.').pop().toUpperCase();
            const fmt = (ext === 'PNG' || ext === 'WEBP') ? ext : 'JPEG';

            // Top Logo - Scale down
            const logoSize = 20; // Increased from 14
            const logoX = (width / 2) - (logoSize / 2);
            const logoY = y;
            const radius = logoSize / 2;

            try {
                // Add logo with FAST compression
                doc.addImage(logoBuffer, fmt, logoX, logoY, logoSize, logoSize, undefined, 'FAST');
            } catch (e) {
                console.error("Error adding top logo:", e);
                try {
                    doc.addImage(logoBuffer, fmt, (width / 2) - 25, y, 50, 16);
                } catch (e2) { }
            }
            y += (logoSize + 5);
        }

        // REMOVED Site Name text as per reference image (Logo only)
        // doc.setFont("helvetica", "bold");
        // doc.setFontSize(14);
        // doc.setTextColor(...colors.navy);
        // doc.text("MD CONSULTANCY", width / 2, y, { align: "center" });
        // y += 6;
        // doc.setFontSize(10);
        // doc.text("MOH DHA COACHING CENTER", width / 2, y, { align: "center" });

        // --- CERTIFICATE TITLE (Row 2) ---
        y += 20;
        doc.setFontSize(38);
        doc.setFont("times", "bold");
        doc.setTextColor(...colors.gold);
        doc.text("CERTIFICATE", width / 2, y, { align: "center", charSpace: 2 });

        y += 10;
        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...colors.textLight);
        doc.text("OF ACHIEVEMENT", width / 2, y, { align: "center", charSpace: 2 });

        // --- RECIPIENT (Row 3) ---
        y += 12; // Reduced from 20
        doc.setFontSize(12);
        doc.setFont("times", "italic");
        doc.text("This is to certify that", width / 2, y, { align: "center" });

        y += 12;
        doc.setFontSize(32); // Reduced from 42
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...colors.navy);
        doc.text(attempt.user?.name?.toUpperCase() || "STUDENT NAME", width / 2, y, { align: "center" });

        // Horizontal line under name
        doc.setDrawColor(...colors.gold);
        doc.setLineWidth(0.8);
        doc.line(width / 2 - 100, y + 2, width / 2 + 100, y + 2); // Widened line to 200mm

        y += 15;
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...colors.textMain);
        const passText = attempt.passed ? "has successfully passed the examination for" : "has appeared for the examination for";
        doc.text(passText, width / 2, y, { align: "center" });

        y += 10;
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...colors.navy);
        doc.text(attempt.exam?.name?.toUpperCase() || "EXAMINATION TITLE", width / 2, y, { align: "center" });

        // --- EXAM SUBTITLES (Reference Match) ---
        y += 7;
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...colors.navy);
        doc.text("Medical Licensing Exam Coaching Centre", width / 2, y, { align: "center" });

        y += 6;
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...colors.gold);
        doc.text("(DHA • HAAD • MOH • PROMETRIC) DUBAI / UAE JOB ASSISTANCE", width / 2, y, { align: "center" });


        // --- STATS BOX (Row 4 - 4 Columns) ---
        y += 8; // Further reduced gap from 14 to 8
        const boxW = 230; // Increased width from 180 to 230
        const boxX = (width - boxW) / 2;
        doc.setDrawColor(...colors.gold);
        doc.setLineWidth(0.5); // Thicker separator line
        doc.line(boxX, y, boxX + boxW, y); // Top separator

        // Roll No Generation: prefer user's real roll no, else fallback to generated
        const rollNo = attempt.user?.rollNumber || `MDC-${new Date().getFullYear()}-${attempt._id.toString().substr(-4).toUpperCase()}`;

        const stats = [
            { label: "SCORE", value: `${(attempt.percentage || 0).toFixed(1)}%` },
            { label: "MARKS", value: `${attempt.score}/${attempt.totalMarks}` },
            { label: "ROLL NO", value: rollNo }, // Real Roll No
            { label: "RESULT", value: attempt.passed ? "PASSED" : "FAILED" }
        ];

        stats.forEach((stat, i) => {
            // Shift columns outwards to leave more space for the stamp in the center
            const x = boxX + (i * (boxW / 4)) + (i < 2 ? (boxW / 12) : (boxW / 6));
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...colors.gold);
            doc.text(stat.label, x, y + 6, { align: "center" }); // Tighter text

            // Value
            let fontSize = stat.label === "ROLL NO" ? 11 : 14;
            doc.setFontSize(fontSize);
            if (stat.label === "RESULT" && stat.value === "FAILED") {
                doc.setTextColor(...colors.red);
            } else {
                doc.setTextColor(...colors.navy);
            }

            // Auto-scale font size to fit width
            const maxWidth = (boxW / 4) - 4; // ~53mm max width
            while (doc.getTextWidth(stat.value) > maxWidth && fontSize > 6) {
                fontSize -= 0.5;
                doc.setFontSize(fontSize);
            }

            doc.text(stat.value, x, y + 14, { align: "center" });
        });

        // --- GOLD SEAL ---
        // Shift seal further up (height - 35) to increase bottom gap
        const sealX = width / 2;
        const optimizedSealY = height - 35; // Moved up from -30

        // Draw Logo Center in Seal OR Stamp Overlay
        // Try to load stamp.jpeg first
        let stampBuffer = loadAsset('images/stamp.jpeg');
        let sealImageBuffer = stampBuffer || logoBuffer; // Prefer stamp, else fallback to logo
        let useStamp = !!stampBuffer;

        if (sealImageBuffer) {
            const ext = useStamp ? 'JPEG' : logoPath.split('.').pop().toUpperCase();
            const fmt = (ext === 'PNG' || ext === 'WEBP') ? ext : 'JPEG';
            const sealImgSize = 35; // Increased from 22
            const imgX = sealX - (sealImgSize / 2);
            const imgY = optimizedSealY - (sealImgSize / 2);

            let sealDrawn = false;
            try {
                // Add seal with FAST compression
                doc.addImage(sealImageBuffer, fmt, imgX, imgY, sealImgSize, sealImgSize, undefined, 'FAST');
                sealDrawn = true;
            } catch (e) {
                console.error("Error adding seal image:", e);
            }

            if (!sealDrawn) {
                doc.setTextColor(...colors.white);
                doc.setFontSize(8);
                doc.text("OFFICIAL", sealX, optimizedSealY - 1, { align: "center" });
            }
        }

        // --- FOOTER SIGNATURES ---
        const footerY = height - 30; // Moved up from -25 to increase bottom gap

        // Date
        const dateStr = attempt.submittedAt
            ? new Date(attempt.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            : new Date().toLocaleDateString();

        doc.setTextColor(...colors.textMain);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(dateStr, 50, footerY - 8, { align: "center" }); // Moved above the line (baseline was footerY)
        doc.setDrawColor(...colors.textLight);
        doc.setLineWidth(0.5);
        doc.line(30, footerY - 5, 70, footerY - 5);
        doc.setFontSize(8);
        doc.text("DATE OF ISSUANCE", 50, footerY + 3, { align: "center" }); // Slightly adjusted gap below line

        // Signature Image
        // Attempt to load signature image
        let signBuffer = loadAsset('images/sign.png');
        if (signBuffer) {
            try {
                // Draw Signature Image
                // Center roughly at width-50, y=FooterY-5 (line position)
                // Assuming sig is approx 40 wide
                const sigW = 40;
                const sigH = 15; // Aspect ratio guess
                doc.addImage(signBuffer, 'PNG', (width - 50) - (sigW / 2), footerY - 20, sigW, sigH, undefined, 'FAST');
            } catch (e) {
                console.error("Error drawing signature image:", e);
                // Fallback to text if fail
                doc.setFontSize(11);
                doc.text("ADMINISTRATOR", width - 50, footerY, { align: "center" });
            }
        } else {
            // Fallback text
            doc.setFontSize(11);
            doc.text("ADMINISTRATOR", width - 50, footerY, { align: "center" });
        }

        doc.line(width - 70, footerY - 5, width - 30, footerY - 5);
        doc.setFontSize(8);
        doc.text("AUTHORIZED SIGNATURE", width - 50, footerY + 3, { align: "center" });

        // --- output ---
        const pdfBuffer = doc.output('arraybuffer');
        const pdfUint8Array = new Uint8Array(pdfBuffer);
        const fileName = `Certificate_${(attempt.user?.name || 'Student').replace(/\s+/g, '_')}.pdf`;

        return new NextResponse(pdfUint8Array, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${fileName}"`,
            },
        });

    } catch (error) {
        console.error('Certificate generation error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}