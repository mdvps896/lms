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
            console.error('Header image error:', e);
            this.doc.setFillColor(this.colors.secondary[0], this.colors.secondary[1], this.colors.secondary[2]);
            this.doc.rect(0, 0, this.pageWidth, 40, 'F');
            this.doc.text(title || 'SERVICE APPLICATION', this.pageWidth / 2, 25, { align: 'center' });
        }
        this.yPos = 55;
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
        if (this.yPos > this.pageHeight - 20) {
            this.doc.addPage();
            this.yPos = 25;
        }
        this.doc.setFontSize(10);
        this.doc.setTextColor(this.colors.textLight[0], this.colors.textLight[1], this.colors.textLight[2]);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(label.toUpperCase(), this.margin, this.yPos);

        this.doc.setTextColor(this.colors.textMain[0], this.colors.textMain[1], this.colors.textMain[2]);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(11);

        const splitValue = this.doc.splitTextToSize(value || 'N/A', this.pageWidth - this.margin - 75);
        this.doc.text(splitValue, this.margin + 65, this.yPos);

        this.yPos += (splitValue.length * 6) + 3;
    }

    drawSelectedItem(item) {
        if (this.yPos > this.pageHeight - 15) {
            this.doc.addPage();
            this.yPos = 25;
        }
        this.doc.setFontSize(11);
        this.doc.setTextColor(this.colors.textMain[0], this.colors.textMain[1], this.colors.textMain[2]);
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(`\u2022 ${item}`, this.margin + 5, this.yPos);
        this.yPos += 7;
    }

    drawWrappedText(text, indent = 0) {
        if (this.yPos > this.pageHeight - 15) {
            this.doc.addPage();
            this.yPos = 25;
        }
        this.doc.setFontSize(10);
        this.doc.setTextColor(this.colors.textMain[0], this.colors.textMain[1], this.colors.textMain[2]);
        this.doc.setFont('helvetica', 'normal');

        const lines = this.doc.splitTextToSize(text, this.pageWidth - this.margin - this.margin - indent);
        this.doc.text(lines, this.margin + indent, this.yPos);
        this.yPos += (lines.length * 5) + 3;
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
}
