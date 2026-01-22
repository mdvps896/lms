import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import ExamAttempt from '@/models/ExamAttempt';
import PDFViewSession from '@/models/PDFViewSession';
import SelfieCapture from '@/models/SelfieCapture';
import Course from '@/models/Course';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

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

        // --- PDF GENERATION ---
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;

        // Header
        doc.setFillColor(52, 84, 209); // Primary Blue
        doc.rect(0, 0, pageWidth, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text('Student Comprehensive Report', 14, 20);
        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

        // Student Details
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text('Student Profile', 14, 50);

        doc.setFontSize(10);
        doc.text(`Name: ${student.name}`, 14, 60);
        doc.text(`Email: ${student.email}`, 14, 66);
        doc.text(`Phone: ${student.phone || 'N/A'}`, 14, 72);
        doc.text(`Status: ${student.status}`, 14, 78);

        let finalY = 85;

        // 1. Course Progress Table
        if (includeCourses && courseProgress.length > 0) {
            doc.setFontSize(14);
            doc.text('Course Progress', 14, finalY + 10);

            doc.autoTable({
                startY: finalY + 15,
                head: [['Course Title', 'Enrolled Date', 'Completed Lectures']],
                body: courseProgress.map(c => [
                    c.title,
                    new Date(c.enrolledAt).toLocaleDateString(),
                    c.completedLectures
                ]),
                theme: 'striped',
                headStyles: { fillColor: [52, 84, 209] }
            });
            finalY = doc.lastAutoTable.finalY;
        }

        // 2. Exam History Table
        if (includeExams && examAttempts.length > 0) {
            doc.setFontSize(14);
            doc.text('Exam History', 14, finalY + 15);

            doc.autoTable({
                startY: finalY + 20,
                head: [['Exam Title', 'Date', 'Score', 'Status']],
                body: examAttempts.map(att => [
                    att.exam?.title || 'Unknown Exam',
                    new Date(att.startTime).toLocaleDateString(),
                    `${att.score} / ${att.totalMarks}`,
                    att.status
                ]),
                theme: 'striped',
                headStyles: { fillColor: [52, 84, 209] } // Purple/Blue
            });
            finalY = doc.lastAutoTable.finalY;
        }

        // 3. PDF Usage & Selfies
        if (includePdfViews && pdfSessions.length > 0) {
            doc.addPage();
            doc.setFontSize(14);
            doc.text('PDF Reading Sessions & Privacy Proofs', 14, 20);
            finalY = 30;

            for (const session of pdfSessions) {
                // Session Info
                const durationMins = Math.floor((session.activeDuration || 0) / 60);
                const sessionInfo = [
                    `PDF: ${session.pdfName || 'Unknown'}`,
                    `Date: ${new Date(session.startTime).toLocaleString()}`,
                    `Duration: ${durationMins} mins`,
                    `Pages: ${session.totalPages || 'N/A'}`,
                    `Location: ${session.locationName || 'N/A'}`
                ];

                // Check if we need a new page for text
                if (finalY > 250) {
                    doc.addPage();
                    finalY = 20;
                }

                doc.setFontSize(11);
                doc.setTextColor(0, 0, 0);
                doc.text(sessionInfo.join(' | '), 14, finalY);
                finalY += 8;

                // Selfies Grid
                if (session.selfies && session.selfies.length > 0) {
                    let imageX = 14;
                    // doc.text('Selfie Proofs:', 14, finalY + 5);
                    finalY += 2;

                    const imageWidth = 30;
                    const imageHeight = 40;

                    for (const selfie of session.selfies) {
                        if (finalY + imageHeight > 280) {
                            doc.addPage();
                            finalY = 20;
                            imageX = 14;
                        }

                        try {
                            // Embed Image (Assuming URL is accessible or base64)
                            // Note: External URLs might need fetching and converting to base64 buffer
                            // For simplicity in this step, we'll try to add it. If it fails (CORS), we skip.
                            // Ideally, we server-side fetch the image buffer.

                            // To make this robust, let's fetch the image buffer:
                            const imgResp = await fetch(selfie.imageUrl);
                            if (imgResp.ok) {
                                const imgBuffer = await imgResp.arrayBuffer();
                                const imgBase64 = Buffer.from(imgBuffer).toString('base64');
                                const format = selfie.imageUrl.split('.').pop().toUpperCase();
                                // Handle standard formats
                                const safeFormat = (format === 'JPG' ? 'JPEG' : format) || 'JPEG';

                                doc.addImage(imgBase64, safeFormat, imageX, finalY, imageWidth, imageHeight);

                                doc.setFontSize(8);
                                doc.text(new Date(selfie.capturedAt).toLocaleTimeString(), imageX, finalY + imageHeight + 4);

                                imageX += imageWidth + 5;
                                if (imageX > pageWidth - 40) {
                                    imageX = 14;
                                    finalY += imageHeight + 10;
                                }
                            }
                        } catch (imgErr) {
                            console.error('Error embedding image:', imgErr);
                        }
                    }
                    finalY += imageHeight + 15;
                } else {
                    finalY += 5;
                }

                // Separator
                doc.setDrawColor(200, 200, 200);
                doc.line(14, finalY, pageWidth - 14, finalY);
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
