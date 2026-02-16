import fs from 'fs';
import path from 'path';

// Helper to handle image rendering (now async)
export const drawImage = async (doc, label, imagePath, x, y, maxW, fixedH, colors, options = {}) => {
    let imgData = null;
    let format = 'JPEG';
    let finalW = maxW;
    let finalH = fixedH;

    // 1. Fetch/Read Image First if it exists
    if (imagePath) {
        try {
            let cleanPath = imagePath;
            if (cleanPath.startsWith('/api/storage/file/')) {
                cleanPath = cleanPath.replace('/api/storage/file/', '');
            } else if (cleanPath.startsWith('/')) {
                cleanPath = cleanPath.substring(1);
            }
            cleanPath = decodeURIComponent(cleanPath);

            const absolutePath = path.join(process.cwd(), 'public', cleanPath);

            if (fs.existsSync(absolutePath)) {
                const imgBuffer = fs.readFileSync(absolutePath);
                imgData = imgBuffer.toString('base64');
                const ext = path.extname(absolutePath).substring(1).toUpperCase();
                if (ext === 'PNG') format = 'PNG';
                if (ext === 'JPG' || ext === 'JPEG') format = 'JPEG';
                if (ext === 'WEBP') format = 'WEBP';
            } else {
                try {
                    let remoteUrl = imagePath.startsWith('http')
                        ? imagePath
                        : `https://app.mdconsultancy.in/api/storage/file/${cleanPath}`;

                    const res = await fetch(remoteUrl);
                    if (res.ok) {
                        const arrayBuffer = await res.arrayBuffer();
                        const buffer = Buffer.from(arrayBuffer);
                        imgData = buffer.toString('base64');
                        const contentType = res.headers.get('content-type');
                        if (contentType && contentType.includes('png')) format = 'PNG';
                        else if (contentType && contentType.includes('webp')) format = 'WEBP';
                    }
                } catch (remoteErr) {
                    // Silently fail
                }
            }

            // 2. Calculate Auto Width if requested
            if (imgData && options.autoWidth) {
                try {
                    const props = doc.getImageProperties(imgData);
                    const aspect = props.width / props.height;
                    // Keep height fixed, adjust width
                    finalW = Math.min(maxW, fixedH * aspect);
                } catch (propsErr) {
                    // Silently fail
                }
            }
        } catch (e) {
            // Silently fail
        }
    }

    // 3. Draw Label and Border (with final width)
    doc.setFontSize(10);
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(label.toUpperCase(), x, y - 2);

    doc.setDrawColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
    doc.setLineWidth(0.1);
    doc.rect(x, y, finalW, finalH); // Draw border with final calculated width

    if (!imgData) {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(200, 200, 200);
        doc.text(imagePath ? 'Image Not Found' : 'Pending Upload', x + 5, y + (finalH / 2));
    } else {
        doc.addImage(imgData, format, x + 0.5, y + 0.5, finalW - 1, finalH - 1);
    }

    return finalW; // Return final width for potential repositioning of other elements
};
