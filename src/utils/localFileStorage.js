
import fs from 'fs';
import path from 'path';

/**
 * Save file locally to public directory
 * @param {string} fileData - Base64 data URI
 * @param {string} folder - Subfolder in public
 * @param {string} fileName - Original filename
 */
export async function saveFileLocally(fileData, folder = 'uploads', fileName = '') {
    try {
        // Handle data:image/png;base64,.....
        // Handle data:image/png;base64,.....
        // Using string methods instead of regex to avoid "Maximum call stack size exceeded" on large files
        if (!fileData.startsWith('data:')) {
            throw new Error('Invalid file format. Expected data URI.');
        }

        const semiColonIndex = fileData.indexOf(';');
        if (semiColonIndex === -1 || !fileData.includes('base64,')) {
            throw new Error('Invalid file format. Missing mime type or base64 encoding.');
        }

        const mimeType = fileData.substring(5, semiColonIndex);
        const base64Data = fileData.split('base64,')[1];

        if (!base64Data) {
            throw new Error('Invalid file format. Empty data.');
        }
        const buffer = Buffer.from(base64Data, 'base64');

        // Determine extension
        // fileName might already have extension
        let extension = '';
        if (fileName && fileName.includes('.')) {
            extension = path.extname(fileName);
        } else {
            // Fallback usually not perfect but works for common types
            extension = '.' + (mimeType.split('/')[1] || 'bin');
        }

        // Clean filename
        const safeName = fileName ? path.parse(fileName).name.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'file';
        const timestamp = Date.now();
        const finalFileName = `${safeName}_${timestamp}${extension}`;

        // 🔒 SECURITY: stored OUTSIDE public/ — see localStorage/constants.js.
        // Files here are only ever reachable through the token-gated
        // /api/storage/secure-file or the public /api/storage/file route.
        const storageDir = path.join(process.cwd(), 'storage');
        const uploadDir = path.join(storageDir, folder);

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, finalFileName);

        // Always a single, normal file on disk — no chunk directories.
        fs.writeFileSync(filePath, buffer);

        return {
            success: true,
            url: `/api/storage/file/${folder}/${finalFileName}`, // Served through the API, never a bare static path
            fileName: finalFileName,
            originalName: fileName,
            size: buffer.length,
            mimeType: mimeType,
            local: true
        };

    } catch (error) {
        console.error('Error saving file locally:', error);
        throw new Error(`Local File Save Failed: ${error.message}`);
    }
}

/**
 * Delete local file
 * @param {string} fileUrl - Relative URL like /uploads/file.png
 */
export async function deleteFileLocally(fileUrl) {
    try {
        if (!fileUrl) return { success: false };

        const storageDir = path.join(process.cwd(), 'storage');
        // Accepts old bare "/uploads/..." records and new
        // "/api/storage/file/uploads/..." ones alike.
        let relativePath = fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl;
        const apiPrefix = 'api/storage/file/';
        if (relativePath.startsWith(apiPrefix)) relativePath = relativePath.slice(apiPrefix.length);
        const filePath = path.join(storageDir, relativePath);

        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                // Chunked content lives in a directory
                fs.rmSync(filePath, { recursive: true, force: true });
            } else {
                fs.unlinkSync(filePath);
            }
            return { success: true };
        }
        return { success: false, message: 'File not found' };

    } catch (error) {
        console.error('Error deleting local file:', error);
        return { success: false, message: error.message };
    }
}
