import fs from 'fs';
import path from 'path';

// Helper to handle image rendering (now async)
export const drawImage = async (doc, label, imagePath, x, y, w, h, colors) => {
    // Label and border
    doc.setFontSize(10);
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(label.toUpperCase(), x, y - 2);

    doc.setDrawColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
    doc.setLineWidth(0.1);
    doc.rect(x, y, w, h); // Draw border for the box

    if (!imagePath) {
        // Draw placeholder text
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(200, 200, 200);
        doc.text('Pending Upload', x + 5, y + (h / 2));
        return;
    }

    try {
        let cleanPath = imagePath;
        if (cleanPath.startsWith('/api/storage/file/')) {
            cleanPath = cleanPath.replace('/api/storage/file/', '');
        } else if (cleanPath.startsWith('/')) {
            cleanPath = cleanPath.substring(1);
        }
        cleanPath = decodeURIComponent(cleanPath);

        // Option 1: Local File
        const absolutePath = path.join(process.cwd(), 'public', cleanPath);

        let imgData = null;
        let format = 'JPEG';

        if (fs.existsSync(absolutePath)) {
            const imgBuffer = fs.readFileSync(absolutePath);
            imgData = imgBuffer.toString('base64');
            const ext = path.extname(absolutePath).substring(1).toUpperCase();
            // Support basic web formats
            if (ext === 'PNG') format = 'PNG';
            if (ext === 'JPG' || ext === 'JPEG') format = 'JPEG';
            if (ext === 'WEBP') format = 'WEBP';

            doc.addImage(imgData, format, x + 1, y + 1, w - 2, h - 2);
        } else {
            // Option 2: Remote Fetch (Fallback)
            try {
                const remoteUrl = `https://app.mdconsultancy.in/api/storage/secure-file?path=/${encodeURIComponent(cleanPath)}`;
                const res = await fetch(remoteUrl);
                if (res.ok) {
                    const arrayBuffer = await res.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    imgData = buffer.toString('base64');

                    const contentType = res.headers.get('content-type');
                    if (contentType && contentType.includes('png')) format = 'PNG';
                    else if (contentType && contentType.includes('webp')) format = 'WEBP';

                    if (imgData) {
                        doc.addImage(imgData, format, x + 1, y + 1, w - 2, h - 2);
                    }
                } else {
                    doc.setFont('helvetica', 'italic');
                    doc.setTextColor(200, 200, 200);
                    doc.text('Image Not Found', x + 5, y + (h / 2));
                }
            } catch (remoteErr) {
                console.error('Remote fetch error:', remoteErr);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(200, 200, 200);
                doc.text('Fetch Error', x + 5, y + (h / 2));
            }
        }

    } catch (e) {
        console.error(`Error drawing image ${label}:`, e);
        doc.text('[Error]', x + 5, y + 10);
    }
};
