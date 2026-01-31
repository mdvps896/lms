import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import ExamAttempt from '@/models/ExamAttempt';
import PDFViewSession from '@/models/PDFViewSession';
import SelfieCapture from '@/models/SelfieCapture';
import Course from '@/models/Course';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        await dbConnect();

        // Debug log

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
            pdfSessions = await PDFViewSession.find({ user: studentId })
                .sort({ startTime: -1 })
                .lean();

            // Enrich with Selfie Data (Optional now, but keeping for potential metadata use)
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
        const primaryColor = [52, 84, 209]; // #3454d1

        // 1. Header & Logo
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, pageWidth, 40, 'F');

        // Logo Logic
        try {
            const logoPath = path.join(process.cwd(), 'public', 'images', 'logo-abbr.png');
            if (fs.existsSync(logoPath)) {
                const logoBuffer = fs.readFileSync(logoPath);
                const logoBase64 = logoBuffer.toString('base64');
                // Logo at x:14, y:7, w:25, h:25
                doc.addImage(logoBase64, 'PNG', 14, 7, 25, 25);
            }
        } catch (e) {
            console.error('Logo embed error:', e);
        }

        // Title
        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('Performance Report', 50, 20); // Shifted right for logo

        // Date
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const dateStr = `Generated: ${new Date().toLocaleDateString()}`;
        doc.text(dateStr, pageWidth - 14, 28, { align: 'right' });

        let yPos = 55;

        // 2. Student Info (Rounded Box)
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(14, yPos - 5, pageWidth - 28, 25, 3, 3, 'FD');

        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.setFont('helvetica', 'bold');
        doc.text(student.name, 20, yPos + 6);

        doc.setFontSize(11);
        doc.setTextColor(108, 117, 125); // Secondary color
        doc.setFont('helvetica', 'normal');
        doc.text(student.email, 20, yPos + 14);

        yPos += 35;

        // --- Helper for Section Titles & Tables ---
        // We use autoTable for everything now to maintain consistency

        // 3. PDF Learning Activity (Red)
        if (includePdfViews && pdfSessions.length > 0) {
            if (yPos > pageHeight - 60) { doc.addPage(); yPos = 20; }

            doc.setFontSize(16);
            doc.setTextColor(220, 53, 69); // Red
            doc.setFont('helvetica', 'normal');
            doc.text('PDF Learning Activity (Summary)', 14, yPos);
            yPos += 5;

            // Grouping Logic (Backend equivalent of the frontend grouping)
            const pdfGroups = {};
            pdfSessions.forEach(session => {
                const title = session.pdfName || 'Unknown PDF';
                if (!pdfGroups[title]) {
                    pdfGroups[title] = { title, sessions: 0, duration: 0, lastViewed: session.startTime };
                }
                pdfGroups[title].sessions++;
                pdfGroups[title].duration += (session.duration || 0);
                if (new Date(session.startTime) > new Date(pdfGroups[title].lastViewed)) {
                    pdfGroups[title].lastViewed = session.startTime;
                }
            });

            // Format Duration Helper
            const fmtDur = (s) => {
                if (!s) return '0 min';
                const m = Math.floor(s / 60);
                return `${Math.max(1, m)} min`;
            };

            const tableBody = Object.values(pdfGroups).map(g => [
                g.title,
                g.sessions,
                new Date(g.lastViewed).toLocaleString(),
                fmtDur(g.duration)
            ]);

            autoTable(doc, {
                startY: yPos,
                head: [['PDF Name', 'Total Sessions', 'Last Viewed', 'Total Duration']],
                body: tableBody,
                headStyles: { fillColor: [220, 53, 69], textColor: 255 }, // Red Header
                theme: 'grid',
                styles: { fontSize: 10, cellPadding: 3 },
                margin: { left: 14, right: 14 }
            });
            yPos = doc.lastAutoTable.finalY + 15;
        }

        // 4. Course Activity (Green)
        if (includeCourses && courseProgress.length > 0) {
            if (yPos > pageHeight - 60) { doc.addPage(); yPos = 20; }

            doc.setFontSize(16);
            doc.setTextColor(25, 135, 84); // Green
            doc.setFont('helvetica', 'normal');
            doc.text('Course Learning Activity (Summary)', 14, yPos);
            yPos += 5;

            // Convert course progress to the format seen in the image (Summary)
            // The image shows 'Total Sessions', 'Last Viewed', 'Total Duration'.
            // Our current data model for 'enrolledCourses' might be limited (just 'completedLectures').
            // We will map available data: Title, Completed Lectures, Enrolled Date.
            // If we want it to look EXACTLY like the image, we'd need session data for courses, which might be in UserCourseActivity or similar.
            // For now, we stick to the available 'courseProgress' but style it broadly similar. 
            // The image implies aggregation. If we don't have activity logs for courses, we show Progress.

            autoTable(doc, {
                startY: yPos,
                head: [['Course Name', 'Joined', 'Progress (Lectures)']],
                body: courseProgress.map(c => [
                    c.title,
                    new Date(c.enrolledAt).toLocaleDateString(),
                    `${c.completedLectures} Completed`
                ]),
                headStyles: { fillColor: [25, 135, 84], textColor: 255 }, // Green Header
                theme: 'grid',
                styles: { fontSize: 10, cellPadding: 3 },
                margin: { left: 14, right: 14 }
            });
            yPos = doc.lastAutoTable.finalY + 15;
        }

        // 5. Exam History (Blue to match Header)
        if (includeExams && examAttempts.length > 0) {
            if (yPos > pageHeight - 60) { doc.addPage(); yPos = 20; }

            doc.setFontSize(16);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]); // Blue
            doc.setFont('helvetica', 'normal');
            doc.text('Exam Attempts History', 14, yPos);
            yPos += 5;

            autoTable(doc, {
                startY: yPos,
                head: [['Exam Title', 'Date', 'Score', 'Status']],
                body: examAttempts.map(att => [
                    att.exam?.title || 'Unknown Exam',
                    new Date(att.startedAt).toLocaleDateString(),
                    `${att.score} / ${att.totalMarks}`,
                    att.status
                ]),
                headStyles: { fillColor: primaryColor, textColor: 255 }, // Blue Header
                theme: 'grid',
                styles: { fontSize: 10, cellPadding: 3 },
                margin: { left: 14, right: 14 }
            });
            yPos = doc.lastAutoTable.finalY + 15;
        }

        // Footer (Page Numbers)
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.setTextColor(150);
            doc.text('Page ' + i + ' of ' + pageCount, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }

        // Return PDF
        const pdfOutput = doc.output('arraybuffer');

        return new NextResponse(pdfOutput, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${student.name.replace(/\s+/g, '_')}_Performance_Report.pdf"`,
            },
        });

    } catch (error) {
        console.error('Error generating report:', error);
        console.error(error.stack); // Log full stack trace
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
