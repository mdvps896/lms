import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import ExamAttempt from '@/models/ExamAttempt';
import PDFViewSession from '@/models/PDFViewSession';
import SelfieCapture from '@/models/SelfieCapture';
import Course from '@/models/Course';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Buffer } from 'buffer';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');
        const includeExams = searchParams.get('includeExams') === 'true';
        const includePdfViews = searchParams.get('includePdfViews') === 'true';
        const includeCourses = searchParams.get('includeCourses') === 'true';

        if (!studentId) {
            return NextResponse.json({ success: false, message: 'Student ID required' }, { status: 400 });
        }

        const student = await User.findById(studentId).lean();
        if (!student) {
            return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
        }

        // Fetch Data based on selections
        let examAttempts = [];
        let pdfSessions = [];
        let courseProgress = [];

        if (includeExams) {
            examAttempts = await ExamAttempt.find({ user: studentId })
                .populate('exam', 'title')
                .sort({ createdAt: -1 })
                .lean();
        }

        if (includePdfViews) {
            pdfSessions = await PDFViewSession.find({ userId: studentId })
                .sort({ startTime: -1 })
                .lean();

            // Enrich with Selfie Data
            for (let session of pdfSessions) {
                const selfies = await SelfieCapture.find({ sessionId: session.sessionId })
                    .sort({ capturedAt: 1 })
                    .lean();
                session.selfies = selfies;
            }
        }

        if (includeCourses) {
            // Populate courses from User.enrolledCourses
            if (student.enrolledCourses && student.enrolledCourses.length > 0) {
                const courseIds = student.enrolledCourses.map(e => e.courseId);
                const courses = await Course.find({ _id: { $in: courseIds } }).select('title').lean();

                courseProgress = student.enrolledCourses.map(enrolled => {
                    const course = courses.find(c => c._id.toString() === enrolled.courseId.toString());
                    return {
                        title: course?.title || 'Unknown Course',
                        enrolledAt: enrolled.enrolledAt,
                        completedLectures: enrolled.completedLectures?.length || 0,
                    };
                });
            }
        }

        // Determine Base URL for images
        const host = request.headers.get('host');
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const baseUrl = `${protocol}://${host}`;

        // --- PDF GENERATION ---
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 15;

        // --- Helper: Section Header ---
        const addSectionHeader = (text, y) => {
            doc.setFillColor(240, 240, 240); // Light Gray Background
            doc.rect(margin, y, pageWidth - (margin * 2), 10, 'F');
            doc.setTextColor(33, 37, 41); // Dark Gray Text
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(text, margin + 5, y + 7);
            doc.setFont('helvetica', 'normal');
            return y + 15;
        };

        // --- 1. Report Header ---
        doc.setFillColor(52, 84, 209); // Brand Blue
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('MD Consultancy', margin, 20); // Brand Name

        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text('Student Comprehensive Report', margin, 30);

        doc.setFontSize(10);
        const dateStr = `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
        doc.text(dateStr, pageWidth - margin - doc.getTextWidth(dateStr), 30);

        // --- 2. Student Profile ---
        let finalY = 55;
        finalY = addSectionHeader('Student Profile', finalY);

        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);

        // Left Column
        doc.text(`Name:`, margin, finalY);
        doc.setFont('helvetica', 'bold');
        doc.text(student.name, margin + 25, finalY);
        doc.setFont('helvetica', 'normal');

        doc.text(`Email:`, margin, finalY + 7);
        doc.text(student.email, margin + 25, finalY + 7);

        // Right Column
        doc.text(`Phone:`, pageWidth / 2, finalY);
        doc.text(student.phone || 'N/A', (pageWidth / 2) + 25, finalY);

        doc.text(`Status:`, pageWidth / 2, finalY + 7);
        doc.setTextColor(student.status === 'active' ? 40 : 200, student.status === 'active' ? 167 : 0, student.status === 'active' ? 69 : 0);
        doc.text(student.status.toUpperCase(), (pageWidth / 2) + 25, finalY + 7);
        doc.setTextColor(50, 50, 50);

        finalY += 20;

        // --- 3. Course Progress ---
        if (includeCourses && courseProgress.length > 0) {
            finalY = addSectionHeader('Enrolled Courses & Progress', finalY);

            doc.autoTable({
                startY: finalY,
                head: [['Course Title', 'Enrolled Date', 'Completed Lectures']],
                body: courseProgress.map(c => [
                    c.title,
                    new Date(c.enrolledAt).toLocaleDateString(),
                    c.completedLectures
                ]),
                theme: 'grid',
                headStyles: { fillColor: [52, 84, 209], textColor: 255 },
                styles: { fontSize: 10, cellPadding: 3 },
                margin: { left: margin, right: margin }
            });
            finalY = doc.lastAutoTable.finalY + 15;
        }

        // --- 4. Exam History ---
        if (includeExams && examAttempts.length > 0) {
            // Check page break
            if (finalY > pageHeight - 60) {
                doc.addPage();
                finalY = 20;
            }
            finalY = addSectionHeader('Exam Attempts History', finalY);

            doc.autoTable({
                startY: finalY,
                head: [['Exam Title', 'Date', 'Score', 'Status']],
                body: examAttempts.map(att => [
                    att.exam?.title || 'Unknown Exam',
                    new Date(att.startTime).toLocaleDateString(),
                    `${att.score} / ${att.totalMarks}`,
                    att.status
                ]),
                theme: 'grid',
                headStyles: { fillColor: [52, 84, 209], textColor: 255 },
                styles: { fontSize: 10, cellPadding: 3 },
                margin: { left: margin, right: margin }
            });
            finalY = doc.lastAutoTable.finalY + 15;
        }

        // --- 5. PDF Reading & Selfies ---
        if (includePdfViews && pdfSessions.length > 0) {
            doc.addPage();
            finalY = 20;
            finalY = addSectionHeader('PDF Reading Activity & Verification', finalY);

            for (const session of pdfSessions) {
                // Determine duration
                const durationMins = Math.floor((session.activeDuration || 0) / 60);

                // Session Card Background
                doc.setFillColor(248, 249, 250); // Very light gray
                const boxHeight = (session.selfies?.length > 0) ? 60 : 30; // Estimate height (dynamic later if needed)

                // Check space
                if (finalY + boxHeight > pageHeight - 20) {
                    doc.addPage();
                    finalY = 20;
                }

                // Render Session Info
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text(session.pdfName || 'Unknown Document', margin, finalY + 5);

                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                const infoLine = `${new Date(session.startTime).toLocaleString()}  |  Duration: ${durationMins} mins  |  Pages: ${session.totalPages || 'N/A'}  |  Loc: ${session.locationName || 'N/A'}`;
                doc.text(infoLine, margin, finalY + 11);

                finalY += 16;

                // Selfies Grid
                if (session.selfies && session.selfies.length > 0) {
                    const imgWidth = 25;
                    const imgHeight = 35;
                    const spacing = 5;
                    let currentX = margin;

                    // Max height tracking for this row
                    let maxRowH = 0;

                    for (const selfie of session.selfies) {
                        // Check row overflow
                        if (currentX + imgWidth > pageWidth - margin) {
                            currentX = margin;
                            finalY += imgHeight + spacing + 10; // New row

                            // Check page overflow
                            if (finalY + imgHeight > pageHeight - 20) {
                                doc.addPage();
                                finalY = 20;
                            }
                        }

                        // Fetch & Embed
                        try {
                            let finalImageUrl = selfie.imageUrl;

                            // Normalize Path
                            if (finalImageUrl.startsWith('/')) {
                                finalImageUrl = `${baseUrl}${finalImageUrl}`;
                            } else if (!finalImageUrl.startsWith('http')) {
                                finalImageUrl = `${baseUrl}/${finalImageUrl}`;
                            }

                            const imgResp = await fetch(finalImageUrl);
                            if (imgResp.ok) {
                                const imgBuffer = await imgResp.arrayBuffer();
                                const imgBase64 = Buffer.from(imgBuffer).toString('base64');

                                let format = 'JPEG';
                                if (finalImageUrl.toLowerCase().endsWith('.png')) format = 'PNG';

                                doc.addImage(imgBase64, format, currentX, finalY, imgWidth, imgHeight);

                                // Frame
                                doc.setDrawColor(200);
                                doc.rect(currentX, finalY, imgWidth, imgHeight);

                                // Timestamp Label
                                doc.setFontSize(7);
                                doc.setTextColor(100);
                                const timeStr = new Date(selfie.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                doc.text(timeStr, currentX + (imgWidth / 2) - (doc.getTextWidth(timeStr) / 2), finalY + imgHeight + 4);
                            }
                        } catch (e) {
                            // Silent match fail
                            doc.setDrawColor(200);
                            doc.rect(currentX, finalY, imgWidth, imgHeight);
                            doc.setFontSize(7);
                            doc.text('Error', currentX + 2, finalY + 15);
                        }

                        currentX += imgWidth + spacing;
                        maxRowH = imgHeight + 10;
                    }
                    finalY += maxRowH + 5; // Finish grid
                }

                // Separator line
                doc.setDrawColor(230);
                doc.line(margin, finalY, pageWidth - margin, finalY);
                finalY += 10;
            }
        }

        // Return PDF
        const pdfOutput = doc.output('arraybuffer');

        return new NextResponse(pdfOutput, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${student.name.replace(/\s+/g, '_')}_Report.pdf"`,
            },
        });

    } catch (error) {
        console.error('Error generating report:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
