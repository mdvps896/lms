import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateStudentReport = async (student, details, logoUrl) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // --- Header Design ---
    const primaryColor = [52, 84, 209]; // #3454d1
    const secondaryColor = [108, 117, 125]; // #6c757d

    // Banner Background
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Load Logo
    try {
        const finalLogoUrl = logoUrl || '/images/logo-abbr.png';
        const logoImg = await new Promise((resolve) => {
            const img = new Image();
            img.src = finalLogoUrl;
            img.crossOrigin = "Anonymous"; // Handle CORS if logo is on different domain (e.g. Cloudinary)
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
        });

        if (logoImg) {
            // Add logo (x: 14, y: 7, width: 25, height: 25) - centered vertically in 40px banner
            doc.addImage(logoImg, 'PNG', 14, 7, 25, 25);
        }
    } catch (error) {
        console.warn('Error loading logo for student report:', error);
    }

    // Title
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    // Shift title to the right to make room for logo
    doc.text('Performance Report', 50, 20);

    // Subtitle / Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 14, 28, { align: 'right' });

    // --- Student Info Section ---
    let yPos = 55;

    // Student Info Box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(14, yPos - 5, pageWidth - 28, 25, 3, 3, 'FD');

    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.text(student.name, 20, yPos + 6);

    doc.setFontSize(11);
    doc.setTextColor(...secondaryColor);
    doc.setFont('helvetica', 'normal');
    doc.text(student.email, 20, yPos + 14);

    yPos += 35;

    // Helper to format duration
    const formatDuration = (seconds) => {
        if (!seconds) return '0 min';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);

        if (h > 0) {
            return `${h} hr ${m > 0 ? `${m} min` : ''}`;
        }
        return `${m || 1} min`; // Show at least 1 min for non-zero seconds less than 60
    };

    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString() + ' ' +
            new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Helper to group data by title
    const groupActivityData = (data, defaultTitle) => {
        if (!data || data.length === 0) return [];

        const groups = data.reduce((acc, view) => {
            const name = view.title || defaultTitle;
            if (!acc[name]) {
                acc[name] = {
                    title: name,
                    sessions: 0,
                    totalDuration: 0,
                    lastViewed: view.lastViewed || view.startTime
                };
            }
            acc[name].sessions += 1;
            acc[name].totalDuration += (view.duration || 0);

            // Update last viewed if this view is more recent
            const currentLastViewed = new Date(view.lastViewed || view.startTime);
            const storedLastViewed = new Date(acc[name].lastViewed);
            if (currentLastViewed > storedLastViewed) {
                acc[name].lastViewed = view.lastViewed || view.startTime;
            }

            return acc;
        }, {});

        return Object.values(groups);
    };

    // --- Exam Attempts Section ---
    if (details.attempts && details.attempts.length > 0) {
        doc.setFontSize(16);
        doc.setTextColor(33, 150, 243); // Blue
        doc.text('Exam Attempts History', 14, yPos);
        yPos += 5;

        const tableBody = details.attempts.map(attempt => [
            attempt.examTitle,
            formatDate(attempt.startedAt),
            `${attempt.score || 0} / ${attempt.totalMarks}`,
            attempt.status,
            attempt.result
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Exam Name', 'Date', 'Score', 'Status', 'Result']],
            body: tableBody,
            headStyles: { fillColor: [66, 66, 66], textColor: 255 },
            theme: 'grid',
        });

        yPos = doc.lastAutoTable.finalY + 15;
    }

    // --- PDF Activity Section ---
    // Check if we need to add a new page
    if (yPos > 250) {
        doc.addPage();
        yPos = 20;
    }

    doc.setFontSize(16);
    doc.setTextColor(220, 53, 69); // Red
    doc.text('PDF Learning Activity (Summary)', 14, yPos);
    yPos += 5;

    const pdfGroups = groupActivityData(details.pdfViews, 'Unknown PDF');

    if (pdfGroups.length > 0) {
        const tableBody = pdfGroups.map(group => [
            group.title,
            group.sessions,
            formatDate(group.lastViewed),
            formatDuration(group.totalDuration)
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['PDF Name', 'Total Sessions', 'Last Viewed', 'Total Duration']],
            body: tableBody,
            headStyles: { fillColor: [220, 53, 69], textColor: 255 },
            theme: 'grid',
        });

        yPos = doc.lastAutoTable.finalY + 15;
    } else {
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text('No PDF activity recorded.', 14, yPos + 5);
        yPos += 15;
    }

    // --- Course Activity Section ---
    if (yPos > 250) {
        doc.addPage();
        yPos = 20;
    }

    doc.setFontSize(16);
    doc.setTextColor(25, 135, 84); // Green
    doc.text('Course Learning Activity (Summary)', 14, yPos);
    yPos += 5;

    const courseGroups = groupActivityData(details.courseViews, 'Unknown Course');

    if (courseGroups.length > 0) {
        const tableBody = courseGroups.map(group => [
            group.title,
            group.sessions,
            formatDate(group.lastViewed),
            formatDuration(group.totalDuration)
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Course Name', 'Total Sessions', 'Last Viewed', 'Total Duration']],
            body: tableBody,
            headStyles: { fillColor: [25, 135, 84], textColor: 255 },
            theme: 'grid',
        });

        yPos = doc.lastAutoTable.finalY + 15;
    } else {
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text('No Course activity recorded.', 14, yPos + 5);
        yPos += 15;
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text('Page ' + i + ' of ' + pageCount, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    // Save
    doc.save(`${student.name.replace(/\s+/g, '_')}_Report.pdf`);
};
