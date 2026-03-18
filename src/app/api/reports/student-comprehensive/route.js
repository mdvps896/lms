import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
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
            examAttempts = await ExamAttempt.find({ 
                user: studentId,
                isFreeMaterial: { $ne: true } // Exclude free material exams
            })
                .populate('exam', 'name duration passingPercentage')
                .sort({ createdAt: -1 })
                .lean();
        }

        if (includePdfViews) {
            pdfSessions = await PDFViewSession.find({
                user: studentId,
                duration: { $gte: 5 } // Standardized filter
            })
                .sort({ startTime: -1 })
                .lean();


            // No need to enrich one-by-one, selfieCount is already in the session model
        }

        if (includeCourses) {
            // Populate courses from User.enrolledCourses
            if (student.enrolledCourses && student.enrolledCourses.length > 0) {
                const courseIds = student.enrolledCourses.map(e => e.courseId);
                const courses = await Course.find({ _id: { $in: courseIds } }).select('title readingDuration').lean();

                courseProgress = await Promise.all(student.enrolledCourses.map(async enrolled => {
                    const course = courses.find(c => c._id.toString() === enrolled.courseId.toString());
                    
                    // Fetch time spent from PDFViewSession
                    const stats = await PDFViewSession.getTotalCourseTime(studentId, enrolled.courseId);
                    
                    // Calculate target seconds
                    let targetSeconds = 0;
                    if (course?.readingDuration) {
                        const val = course.readingDuration.value || 0;
                        const unit = course.readingDuration.unit || 'hours';
                        switch (unit) {
                            case 'minutes': targetSeconds = val * 60; break;
                            case 'hours': targetSeconds = val * 3600; break;
                            case 'days': targetSeconds = val * 86400; break;
                            case 'months': targetSeconds = val * 2592000; break;
                            default: targetSeconds = val * 3600;
                        }
                    }

                    const percentage = targetSeconds > 0 ? ((stats.totalSeconds / targetSeconds) * 100).toFixed(1) : 0;

                    return {
                        title: course?.title || 'Unknown Course',
                        enrolledAt: enrolled.enrolledAt,
                        completedLectures: enrolled.completedLectures?.length || 0,
                        timeSpentSeconds: stats.totalSeconds,
                        percentage: Math.min(100, parseFloat(percentage)),
                        formattedSpent: stats.formattedTime || '0s'
                    };
                }));
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

        // Join Date
        const joinDate = student.admissionDate || student.createdAt;
        if (joinDate) {
            const dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' };
            const formattedJoinDate = new Intl.DateTimeFormat('en-IN', dateOptions).format(new Date(joinDate));

            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40, 40, 40);
            doc.text('Join Date:', pageWidth - 60, yPos + 6);
            doc.setFont('helvetica', 'normal');
            doc.text(formattedJoinDate, pageWidth - 37, yPos + 6);
        }

        yPos += 35;

        // Format Duration Helper
        const fmtDur = (s) => {
            if (!s) return ' 0 min';
            const mTotal = Math.floor(s / 60);
            if (mTotal < 60) {
                return `${Math.max(1, mTotal)} min`;
            }
            const h = Math.floor(mTotal / 60);
            const m = mTotal % 60;
            return `${h} hr ${m} min`;
        };

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
                pdfGroups[title].groupSelfies = (pdfGroups[title].groupSelfies || 0) + (session.selfieCount || 0);
            });

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
            yPos = doc.lastAutoTable.finalY + 8;

            // Total Duration Summary Line
            const totalSecs = Object.values(pdfGroups).reduce((acc, g) => acc + (g.duration || 0), 0);
            const totalSelfies = Object.values(pdfGroups).reduce((acc, g) => acc + (g.groupSelfies || 0), 0);
            const totalSessions = Object.values(pdfGroups).reduce((acc, g) => acc + (g.sessions || 0), 0);
            
            if (totalSecs > 0 || totalSelfies > 0 || totalSessions > 0) {
                const totalMin = Math.floor(totalSecs / 60);
                const h = Math.floor(totalMin / 60);
                const m = totalMin % 60;
                const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
                const totalStr = `Total Sessions: ${totalSessions}  |  Total Selfies: ${totalSelfies}  |  Total Time: ${timeStr}`;

                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(220, 53, 69); // Red to match section
                doc.text(totalStr, pageWidth - 14, yPos, { align: 'right' });
                yPos += 10;
            } else {
                yPos += 7;
            }
        }

        // 4. Course Activity (Green)
        if (includeCourses && courseProgress.length > 0) {
            if (yPos > pageHeight - 60) { doc.addPage(); yPos = 20; }

            doc.setFontSize(16);
            doc.setTextColor(25, 135, 84); // Green
            doc.setFont('helvetica', 'normal');
            doc.text('Course Learning Activity (Summary)', 14, yPos);
            yPos += 5;

            autoTable(doc, {
                startY: yPos,
                head: [['Course Name', 'Joined Date', 'Time Spent (Read)', 'Progress (%)']],
                body: courseProgress.map(c => [
                    c.title,
                    new Date(c.enrolledAt).toLocaleDateString(),
                    c.formattedSpent,
                    `${c.percentage}%`
                ]),
                headStyles: { fillColor: [25, 135, 84], textColor: 255 }, // Green Header
                theme: 'grid',
                styles: { fontSize: 10, cellPadding: 3 },
                margin: { left: 14, right: 14 }
            });

            yPos = doc.lastAutoTable.finalY + 15;
            
            // Optional: Total Course Progress Summary Row
            const avgProgress = (courseProgress.reduce((acc, c) => acc + c.percentage, 0) / courseProgress.length).toFixed(1);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(25, 135, 84); // Green
            doc.text(`Average Progress: ${avgProgress}%`, pageWidth - 14, yPos - 10, { align: 'right' });
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
                head: [['Exam Title', 'Exam Time', 'Start Date', 'End Date', 'Taken Time', 'Score', 'Status', 'Result']],
                body: examAttempts.map(att => [
                    att.exam?.name || 'Unknown Exam',
                    att.exam?.duration ? `${att.exam.duration} min` : '-',
                    new Date(att.startedAt).toLocaleString(),
                    att.submittedAt ? new Date(att.submittedAt).toLocaleString() : '-',
                    att.timeTaken ? fmtDur(att.timeTaken) : '-',
                    `${att.score} / ${att.totalMarks}`,
                    att.status,
                    att.percentage >= (att.exam?.passingPercentage ?? 40) ? 'Pass' : 'Fail'
                ]),
                headStyles: { fillColor: primaryColor, textColor: 255 }, // Blue Header
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2 },
                columnStyles: {
                    7: { halign: 'center', fontStyle: 'bold' }
                },
                didParseCell: function(data) {
                    if (data.section === 'body' && data.column.index === 7) {
                        const result = data.cell.raw;
                        if (result === 'Pass') {
                            data.cell.styles.fillColor = [40, 167, 69]; // Green
                            data.cell.styles.textColor = [255, 255, 255]; // White
                        } else if (result === 'Fail') {
                            data.cell.styles.fillColor = [220, 53, 69]; // Red
                            data.cell.styles.textColor = [255, 255, 255]; // White
                        }
                    }
                },
                margin: { left: 14, right: 14 }
            });
            yPos = doc.lastAutoTable.finalY + 8;

            // Total Time Taken Summary for Exams
            const totalExamSecs = examAttempts.reduce((acc, att) => acc + (att.timeTaken || 0), 0);
            if (totalExamSecs > 0) {
                const totalMin = Math.floor(totalExamSecs / 60);
                const h = Math.floor(totalMin / 60);
                const m = totalMin % 60;
                const totalStr = h > 0 ? `Total Time Taken: ${h}h ${m}m` : `Total Time Taken: ${m}m`;

                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]); // Blue to match section
                doc.text(totalStr, pageWidth - 14, yPos, { align: 'right' });
                yPos += 12;
            } else {
                yPos += 7;
            }
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
