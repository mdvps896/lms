import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import {
    UPLOAD_BASE_DIR,
    IMAGES_DIR,
    VIDEOS_DIR,
    DOCUMENTS_DIR,
    ASSETS_DIR,
    MAX_IMAGE_SIZE,
    MAX_VIDEO_SIZE,
    MAX_DOCUMENT_SIZE,
    IMAGE_COMPRESSION_QUALITY,
} from './constants';

/**
 * Initialize upload directories
 */
export async function initializeDirectories() {
    const directories = [UPLOAD_BASE_DIR, IMAGES_DIR, VIDEOS_DIR, DOCUMENTS_DIR, ASSETS_DIR];

    for (const dir of directories) {
        if (!fs.existsSync(dir)) {
            await fs.promises.mkdir(dir, { recursive: true });
        }
    }
}

/**
 * Get MIME type from file extension
 */
export function getMimeType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.txt': 'text/plain',
        '.mp4': 'video/mp4',
        '.avi': 'video/avi',
        '.mov': 'video/quicktime',
        '.webm': 'video/webm',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg'
    };
    return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Check if file is an image
 */
export function isImage(fileName) {
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg'];
    const ext = path.extname(fileName).toLowerCase();
    return imageExts.includes(ext);
}

/**
 * Check if file is a video
 */
export function isVideo(fileName) {
    const videoExts = ['.mp4', '.avi', '.mov', '.webm', '.mkv', '.flv', '.wmv'];
    const ext = path.extname(fileName).toLowerCase();
    return videoExts.includes(ext);
}

/**
 * Check if file is a document
 */
export function isDocument(fileName) {
    const docExts = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'];
    const ext = path.extname(fileName).toLowerCase();
    return docExts.includes(ext);
}

/**
 * Determine target directory based on file type
 */
export function getTargetDirectory(fileName) {
    if (isImage(fileName)) return IMAGES_DIR;
    if (isVideo(fileName)) return VIDEOS_DIR;
    if (isDocument(fileName)) return DOCUMENTS_DIR;
    return ASSETS_DIR;
}

/**
 * Generate unique filename to avoid conflicts
 */
export function generateUniqueFileName(originalName) {
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const uniqueId = uuidv4();
    return `${baseName}_${uniqueId}${ext}`;
}

/**
 * Compress image files to reduce size
 */
export async function compressImage(inputBuffer, fileName) {
    try {
        const compressedBuffer = await sharp(inputBuffer)
            .resize(2048, 2048, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({
                quality: IMAGE_COMPRESSION_QUALITY,
                progressive: true
            })
            .toBuffer();

        return compressedBuffer;
    } catch (error) {
        console.error('❌ Error compressing image:', error);
        return inputBuffer; // Return original if compression fails
    }
}

/**
 * Validate file size based on type
 */
export function validateFileSize(fileSize, fileName) {
    let maxSize;

    if (isImage(fileName)) {
        maxSize = MAX_IMAGE_SIZE;
    } else if (isVideo(fileName)) {
        maxSize = MAX_VIDEO_SIZE;
    } else if (isDocument(fileName)) {
        maxSize = MAX_DOCUMENT_SIZE;
    } else {
        maxSize = MAX_DOCUMENT_SIZE; // Default for other files
    }

    if (fileSize > maxSize) {
        const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1);
        throw new Error(`File size exceeds ${maxSizeMB}MB limit for ${fileName}`);
    }

    return true;
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
