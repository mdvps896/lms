import JSZip from 'jszip';

/**
 * Exports multiple files as a single ZIP archive.
 * @param {Array} files - Array of file objects with 'path'/'imageUrl' and 'name'.
 * @param {string} zipName - Name of the output ZIP file.
 */
export const exportFilesAsZip = async (files, zipName = 'media-export.zip') => {
    const zip = new JSZip();
    const folder = zip.folder("files");

    const getFileUrl = (file) => {
        const path = file.path || file.imageUrl;
        if (!path) return null;

        // Use secure-file API for everything to ensure server-side proxying and admin check
        const normalizedPath = (path.startsWith('http://') || path.startsWith('https://'))
            ? path
            : (path.startsWith('/') ? path : '/' + path);

        return `/api/storage/secure-file?path=${encodeURIComponent(normalizedPath)}`;
    };

    const fetchPromises = files.map(async (file) => {
        try {
            const url = getFileUrl(file);
            if (!url) return;

            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch ${url}`);

            const blob = await response.blob();

            // Clean filename: use file.name or derive from path
            let fileName = file.name || file.originalName || url.split('/').pop() || 'file';
            // Remove icons/emojis from name for safer ZIP filenames
            fileName = fileName.replace(/[^\x00-\x7F]/g, "").trim();

            // Ensure correct extension based on MIME type
            const mimeToExt = {
                'image/jpeg': '.jpg',
                'image/png': '.png',
                'image/gif': '.gif',
                'image/webp': '.webp',
                'video/mp4': '.mp4',
                'video/webm': '.webm',
                'application/pdf': '.pdf'
            };

            const extFromMime = mimeToExt[blob.type];
            if (extFromMime && !fileName.toLowerCase().endsWith(extFromMime)) {
                fileName += extFromMime;
            }

            // Add to zip
            folder.file(fileName, blob);
        } catch (error) {
            console.error(`Error adding file to ZIP: ${file.name || 'unknown'}`, error);
        }
    });

    await Promise.all(fetchPromises);

    const content = await zip.generateAsync({ type: "blob" });

    // Trigger download
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = zipName.endsWith('.zip') ? zipName : `${zipName}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    setTimeout(() => URL.revokeObjectURL(link.href), 100);
};
