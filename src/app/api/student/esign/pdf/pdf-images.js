import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Helper to handle image rendering (now async with compression)
export const drawImage = async (doc, label, imagePath, x, y, maxW, fixedH, colors, options = {}) => {
    let imgData = null;
    let format = 'JPEG';
    let finalW = maxW;
    let finalH = fixedH;

    if (imagePath) {
        try {
            let buffer = null;

            // 1. Get Buffer from Base64 or File or URL
            if (imagePath.startsWith('data:image')) {
                buffer = Buffer.from(imagePath.split(',')[1], 'base64');
            } else {
                let cleanPath = imagePath;
                if (cleanPath.startsWith('/api/storage/file/')) {
                    cleanPath = cleanPath.replace('/api/storage/file/', '');
                } else if (cleanPath.startsWith('/')) {
                    cleanPath = cleanPath.substring(1);
                }
                cleanPath = decodeURIComponent(cleanPath);

                const absolutePath = path.join(process.cwd(), 'public', cleanPath);

                if (fs.existsSync(absolutePath)) {
                    buffer = fs.readFileSync(absolutePath);
                } else {
                    const remoteUrl = imagePath.startsWith('http')
                        ? imagePath
                        : `https://app.mdconsultancy.in/api/storage/file/${cleanPath}`;

                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 8000);

                    const res = await fetch(remoteUrl, { signal: controller.signal });
                    clearTimeout(timeoutId);

                    if (res.ok) {
                        const arrayBuffer = await res.arrayBuffer();
                        buffer = Buffer.from(arrayBuffer);
                    }
                }
            }

            // 2. Compress & Resize using Sharp
            if (buffer) {
                try {
                    // Resize to a maximum width of 1000px and convert to JPEG with 80% quality
                    // This DRASTICALLY reduces file size while maintaining clarity for a PDF
                    const compressedBuffer = await sharp(buffer)
                        .resize({ width: 1000, withoutEnlargement: true })
                        .jpeg({ quality: 80 })
                        .toBuffer();

                    imgData = compressedBuffer.toString('base64');
                    format = 'JPEG';
                } catch (sharpErr) {
                    console.error("Sharp compression failed, using raw buffer:", sharpErr);
                    imgData = buffer.toString('base64');
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
    doc.rect(x, y, finalW, finalH);

    if (!imgData) {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(200, 200, 200);
        doc.text(imagePath ? 'Image Not Found' : 'Pending Upload', x + 5, y + (finalH / 2));
    } else {
        doc.addImage(imgData, format, x + 0.5, y + 0.5, finalW - 1, finalH - 1);
    }

    return finalW;
};
