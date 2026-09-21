import fs from 'fs';
import path from 'path';
import {
    initializeDirectories,
    isImage,
    compressImage,
    validateFileSize,
    getTargetDirectory,
    generateUniqueFileName,
    getMimeType,
} from './fileHelpers';

/**
 * Save file to local storage
 * @param {string} file - Base64 string or Buffer
 * @param {string} folder - Optional subfolder within the type-specific directory
 * @param {string} fileName - Original file name
 */
export async function saveToLocalStorage(file, folder = '', fileName = '') {
    try {
        // Check if we're on a read-only filesystem (serverless/Vercel)
        const isReadOnlyFS = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || !fs.existsSync(process.cwd());

        if (isReadOnlyFS) {
            console.warn('⚠️ Running on read-only filesystem - file cannot be saved locally');
            console.warn('💡 Please configure a cloud storage service (AWS S3, Cloudinary, etc.) for production');

            return {
                success: false,
                error: 'Read-only filesystem',
                message: 'Cannot save files on serverless platform. Please configure cloud storage.',
                readOnlyFS: true,
                url: null,
                fileName: fileName,
                originalName: fileName
            };
        }

        // Initialize directories if they don't exist
        await initializeDirectories();

        let fileBuffer;
        let originalFileName = fileName;

        // Handle Base64 input
        if (typeof file === 'string' && file.startsWith('data:')) {
            const base64Data = file.split(',')[1];
            fileBuffer = Buffer.from(base64Data, 'base64');

            // Extract filename from data URL if not provided
            if (!originalFileName) {
                const mimeMatch = file.match(/data:([^;]+)/);
                if (mimeMatch) {
                    const mimeType = mimeMatch[1];
                    const ext = mimeType.split('/')[1];
                    originalFileName = `file.${ext}`;
                }
            }
        } else if (Buffer.isBuffer(file)) {
            fileBuffer = file;
        } else {
            throw new Error('Invalid file format. Expected Base64 string or Buffer.');
        }

        if (!originalFileName) {
            originalFileName = `file_${Date.now()}`;
        }

        const fileSize = fileBuffer.length;

        // Validate file size
        validateFileSize(fileSize, originalFileName);

        // Compress image if needed and file is large
        if (isImage(originalFileName) && fileSize > 2 * 1024 * 1024) { // 2MB threshold
            fileBuffer = await compressImage(fileBuffer, originalFileName);
        }

        // Determine target directory
        const targetDir = getTargetDirectory(originalFileName);

        // Create subfolder if specified
        let finalDir = targetDir;
        if (folder) {
            finalDir = path.join(targetDir, folder);
        }

        if (!fs.existsSync(finalDir)) {
            await fs.promises.mkdir(finalDir, { recursive: true });
        }

        // Generate unique filename
        const uniqueFileName = generateUniqueFileName(originalFileName);
        const mimeType = getMimeType(originalFileName);

        // Every file is stored as a single, normal file on disk (a PDF stays a
        // real .pdf) — no chunk directories, no manifests.
        const filePath = path.join(finalDir, uniqueFileName);
        await fs.promises.writeFile(filePath, fileBuffer);

        // Generate public URL (relative to the private storage root, so it
        // still comes out as "uploads/..." — everything downstream (DB
        // records, normalizePdfPath, the mobile app) assumes that prefix).
        const relativePath = path.relative(path.join(process.cwd(), 'storage'), filePath);
        // Use the API route to serve files to ensure they work in production/runtime
        const publicUrl = `/api/storage/file/${relativePath.replace(/\\/g, '/')}`; // Ensure forward slashes for URLs

        return {
            success: true,
            url: publicUrl,
            fileName: uniqueFileName,
            originalName: originalFileName,
            size: fileBuffer.length,
            mimeType: getMimeType(originalFileName),
            localPath: filePath,
            relativePath: relativePath.replace(/\\/g, '/'),
            folder: folder,
            publicId: relativePath.replace(/\\/g, '/') // Alias for compatibility with code expecting Cloudinary-like response
        };

    } catch (error) {
        console.error('💥 Save to local storage failed:', error);
        throw error;
    }
}
