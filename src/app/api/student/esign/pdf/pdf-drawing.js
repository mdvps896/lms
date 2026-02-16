import fs from 'fs';
import path from 'path';

export class PDFDrawer {
    constructor(doc) {
        this.doc = doc;
        this.pageWidth = doc.internal.pageSize.width;
        this.pageHeight = doc.internal.pageSize.height;
        this.margin = 20;
        this.yPos = 20;

        // Colors
        this.colors = {
            primary: [145, 198, 64], // #91C640 (Green)
            secondary: [28, 65, 109], // #1C416D (Blue)
            textMain: [45, 52, 54],
            textLight: [99, 110, 114]
        };
    }

    checkPageBreak(requiredSpace = 20) {
        if (this.yPos + requiredSpace > this.pageHeight - 20) {
            this.doc.addPage();
            this.yPos = 25;
            return true;
        }
        return false;
    }

    drawHeader(title) {
        try {
            const headerPath = path.join(process.cwd(), 'public', 'images', 'head.jpeg');
            if (fs.existsSync(headerPath)) {
                const headerBuffer = fs.readFileSync(headerPath);
                const headerBase64 = headerBuffer.toString('base64');
                this.doc.addImage(headerBase64, 'JPEG', 0, 0, this.pageWidth, 40);
            } else {
                this.doc.setFillColor(this.colors.secondary[0], this.colors.secondary[1], this.colors.secondary[2]);
                this.doc.rect(0, 0, this.pageWidth, 40, 'F');
                this.doc.setFontSize(22);
                this.doc.setTextColor(255, 255, 255);
                this.doc.setFont('helvetica', 'bold');
                this.doc.text(title || 'SERVICE APPLICATION', this.pageWidth / 2, 25, { align: 'center' });
            }
        } catch (e) {
            this.doc.setFillColor(this.colors.secondary[0], this.colors.secondary[1], this.colors.secondary[2]);
            this.doc.rect(0, 0, this.pageWidth, 40, 'F');
            this.doc.text(title || 'SERVICE APPLICATION', this.pageWidth / 2, 25, { align: 'center' });
        }

        // Add Subtitle
        this.doc.setFontSize(16);
        this.doc.setTextColor(this.colors.secondary[0], this.colors.secondary[1], this.colors.secondary[2]);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('DIGITAL CONSENT & AUTHORIZATION FORM', this.pageWidth / 2, 50, { align: 'center' });

        this.yPos = 65;
    }

    drawFooter(pageNum) {
        // Footer removed as per requirement
    }

    drawSectionTitle(title) {
        if (this.yPos > this.pageHeight - 40) {
            this.doc.addPage();
            this.yPos = 20;
        }
        this.doc.setFillColor(this.colors.primary[0], this.colors.primary[1], this.colors.primary[2]);
        this.doc.rect(this.margin, this.yPos - 5, 3, 8, 'F');

        this.doc.setFontSize(14);
        this.doc.setTextColor(this.colors.secondary[0], this.colors.secondary[1], this.colors.secondary[2]);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(title, this.margin + 5, this.yPos + 1);

        this.doc.setDrawColor(this.colors.primary[0], this.colors.primary[1], this.colors.primary[2]);
        this.doc.setLineWidth(0.5);
        this.doc.line(this.margin, this.yPos + 4, this.pageWidth - this.margin, this.yPos + 4);
        this.yPos += 15;
    }

    drawField(label, value) {
        this.checkPageBreak(15);

        this.doc.setFontSize(10);
        this.doc.setTextColor(this.colors.textLight[0], this.colors.textLight[1], this.colors.textLight[2]);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(label.toUpperCase(), this.margin, this.yPos);

        this.doc.setTextColor(this.colors.textMain[0], this.colors.textMain[1], this.colors.textMain[2]);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(11);

        const splitValue = this.doc.splitTextToSize(value || 'N/A', this.pageWidth - this.margin - 75);

        // Draw line by line to handle page breaks for very long fields
        for (let i = 0; i < splitValue.length; i++) {
            this.checkPageBreak(8);
            this.doc.text(splitValue[i], this.margin + 65, this.yPos);
            if (i < splitValue.length - 1) this.yPos += 6;
        }

        this.yPos += 12;
    }

    drawSelectedItem(item) {
        this.checkPageBreak(12);

        // Draw Green Checkbox
        const boxSize = 4;
        const x = this.margin + 5;
        const y = this.yPos - boxSize + 1;

        this.doc.setFillColor(this.colors.primary[0], this.colors.primary[1], this.colors.primary[2]);
        this.doc.rect(x, y, boxSize, boxSize, 'F');

        // Draw White Checkmark
        this.doc.setDrawColor(255, 255, 255);
        this.doc.setLineWidth(0.4);
        this.doc.line(x + 0.8, y + 2, x + 1.6, y + 2.8);
        this.doc.line(x + 1.6, y + 2.8, x + 3.2, y + 0.8);

        // Draw Text
        this.doc.setFontSize(11);
        this.doc.setTextColor(this.colors.textMain[0], this.colors.textMain[1], this.colors.textMain[2]);
        this.doc.setFont('helvetica', 'bold');

        const splitItem = this.doc.splitTextToSize(item, this.pageWidth - this.margin - boxSize - 15);

        for (let i = 0; i < splitItem.length; i++) {
            if (i > 0) this.checkPageBreak(8);
            this.doc.text(splitItem[i], x + boxSize + 3, this.yPos);
            if (i < splitItem.length - 1) this.yPos += 6;
        }

        this.yPos += 10;
    }

    drawWrappedText(text, indent = 0, options = {}) {
        this.checkPageBreak(10);

        const fontSize = options.fontSize || 10;
        const fontStyle = options.fontStyle || 'normal';
        const textColor = options.textColor || this.colors.textMain;

        this.doc.setFontSize(fontSize);
        this.doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        this.doc.setFont('helvetica', fontStyle);

        const lines = this.doc.splitTextToSize(text, this.pageWidth - this.margin - this.margin - indent);

        for (let i = 0; i < lines.length; i++) {
            this.checkPageBreak(8);
            this.doc.text(lines[i], this.margin + indent, this.yPos);
            if (i < lines.length - 1) this.yPos += 5;
        }

        this.yPos += 12;
    }

    // New helper: Get current layout state
    getLayout() {
        return {
            x: this.margin,
            y: this.yPos,
            w: this.pageWidth,
            h: this.pageHeight
        };
    }

    // New helper: Update yPos manually if needed (e.g. after images)
    setY(y) {
        this.yPos = y;
    }

    drawKeyValueTable(tableData) {
        this.checkPageBreak(20);

        const startX = this.margin;
        const col1Width = 65; // Label column width
        const col2Width = this.pageWidth - (this.margin * 2) - col1Width;
        const padding = 3;
        const lineHeight = 5;

        // Table Header Line (Optional, maybe just start drawing rows)
        this.doc.setDrawColor(200, 200, 200);
        this.doc.setLineWidth(0.1);

        tableData.forEach((row, index) => {
            const label = row.label || '';
            const value = (row.value !== undefined && row.value !== null) ? String(row.value) : 'N/A';

            this.doc.setFontSize(10);

            // Calculate height based on wrapped text
            this.doc.setFont('helvetica', 'bold');
            const labelLines = this.doc.splitTextToSize(label, col1Width - (padding * 2));

            this.doc.setFont('helvetica', 'normal'); // Value font
            const valueLines = this.doc.splitTextToSize(value, col2Width - (padding * 2));

            const maxLines = Math.max(labelLines.length, valueLines.length);
            const rowHeight = (maxLines * lineHeight) + (padding * 3); // Extra padding

            // Check if row fits, else new page
            if (this.yPos + rowHeight > this.pageHeight - 20) {
                this.doc.addPage();
                this.yPos = 25;
            }

            // Draw Background for alternate rows (optional)
            // if (index % 2 === 0) {
            //     this.doc.setFillColor(245, 245, 245);
            //     this.doc.rect(startX, this.yPos, col1Width + col2Width, rowHeight, 'F');
            // }

            // Draw Cell Borders
            this.doc.rect(startX, this.yPos, col1Width, rowHeight); // Label Box
            this.doc.rect(startX + col1Width, this.yPos, col2Width, rowHeight); // Value Box

            // Draw Label Content
            this.doc.setFont('helvetica', 'bold');
            this.doc.setTextColor(this.colors.secondary[0], this.colors.secondary[1], this.colors.secondary[2]);
            this.doc.text(labelLines, startX + padding, this.yPos + padding + lineHeight - 1);

            // Draw Value Content
            this.doc.setFont('helvetica', 'normal');
            this.doc.setTextColor(this.colors.textMain[0], this.colors.textMain[1], this.colors.textMain[2]);
            this.doc.text(valueLines, startX + col1Width + padding, this.yPos + padding + lineHeight - 1);

            this.yPos += rowHeight;
        });

        this.yPos += 15; // Space after table
    }
}
