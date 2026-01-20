import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

// Local storage directory paths
const UPLOAD_BASE_DIR = path.join(process.cwd(), 'public', 'uploads');
const IMAGES_DIR = path.join(UPLOAD_BASE_DIR, 'images');
const VIDEOS_DIR = path.join(UPLOAD_BASE_DIR, 'videos');
const DOCUMENTS_DIR = path.join(UPLOAD_BASE_DIR, 'documents');
const ASSETS_DIR = path.join(UPLOAD_BASE_DIR, 'assets');

// File size constants - Effectively unlimited (5GB)
const MAX_IMAGE_SIZE = 5000 * 1024 * 1024; // 5GB
const MAX_VIDEO_SIZE = 5000 * 1024 * 1024; // 5GB
const MAX_DOCUMENT_SIZE = 5000 * 1024 * 1024; // 5GB
const IMAGE_COMPRESSION_QUALITY = 80;

/**
 * Initialize upload directories
 */
function initializeDirectories() {
    const directories = [UPLOAD_BASE_DIR, IMAGES_DIR, VIDEOS_DIR, DOCUMENTS_DIR, ASSETS_DIR];

    directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`📁 Created directory: ${dir}`);
        }
    });
}

/**
 * Get MIME type from file extension
 */
function getMimeType(fileName) {
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
function isImage(fileName) {
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg'];
    const ext = path.extname(fileName).toLowerCase();
    return imageExts.includes(ext);
}

/**
 * Check if file is a video
 */
function isVideo(fileName) {
    const videoExts = ['.mp4', '.avi', '.mov', '.webm', '.mkv', '.flv', '.wmv'];
    const ext = path.extname(fileName).toLowerCase();
    return videoExts.includes(ext);
}

/**
 * Check if file is a document
 */
function isDocument(fileName) {
    const docExts = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'];
    const ext = path.extname(fileName).toLowerCase();
    return docExts.includes(ext);
}

/**
 * Determine target directory based on file type
 */
function getTargetDirectory(fileName) {
    if (isImage(fileName)) return IMAGES_DIR;
    if (isVideo(fileName)) return VIDEOS_DIR;
    if (isDocument(fileName)) return DOCUMENTS_DIR;
    return ASSETS_DIR;
}

/**
 * Generate unique filename to avoid conflicts
 */
function generateUniqueFileName(originalName) {
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const uniqueId = uuidv4();
    return `${baseName}_${uniqueId}${ext}`;
}

/**
 * Compress image files to reduce size
 */
async function compressImage(inputBuffer, fileName) {
    try {
        console.log('🗜️ Compressing image:', fileName);

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

        console.log(`✅ Image compressed: ${inputBuffer.length} → ${compressedBuffer.length} bytes`);
        return compressedBuffer;
    } catch (error) {
        console.error('❌ Error compressing image:', error);
        return inputBuffer; // Return original if compression fails
    }
}

/**
 * Validate file size based on type
 */
function validateFileSize(fileSize, fileName) {
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
        initializeDirectories();

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
        console.log(`📊 File size: ${fileSize} bytes (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);

        // Validate file size
        validateFileSize(fileSize, originalFileName);

        // Compress image if needed and file is large
        if (isImage(originalFileName) && fileSize > 2 * 1024 * 1024) { // 2MB threshold
            console.log('🔄 Large image detected, applying compression...');
            fileBuffer = await compressImage(fileBuffer, originalFileName);
        }

        // Determine target directory
        const targetDir = getTargetDirectory(originalFileName);

        // Create subfolder if specified, but avoid redundant folder names
        let finalDir = targetDir;
        if (folder) {
            // Avoid creating redundant folders (e.g., images/images)
            const targetDirName = path.basename(targetDir);
            if (folder !== targetDirName) {
                finalDir = path.join(targetDir, folder);
            }
        }
        if (!fs.existsSync(finalDir)) {
            fs.mkdirSync(finalDir, { recursive: true });
        }

        // Generate unique filename
        const uniqueFileName = generateUniqueFileName(originalFileName);
        const filePath = path.join(finalDir, uniqueFileName);

        // Save file
        fs.writeFileSync(filePath, fileBuffer);

        // Generate public URL (relative to public directory)
        const relativePath = path.relative(path.join(process.cwd(), 'public'), filePath);
        // Use the API route to serve files to ensure they work in production/runtime
        const publicUrl = `/api/storage/file/${relativePath.replace(/\\/g, '/')}`; // Ensure forward slashes for URLs

        console.log('✅ File saved successfully to local storage');
        console.log('📁 Path:', filePath);
        console.log('🔗 Public URL:', publicUrl);

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

/**
 * Delete file from local storage
 * @param {string} filePath - Relative path from public directory or absolute path
 */
export async function deleteFromLocalStorage(filePath) {
    try {
        console.log('🗑️ Delete request for:', filePath);

        const pathsToTry = [];

        // Normalize the path to use forward slashes
        const normalizedFilePath = filePath.replace(/\\/g, '/');

        // Check if it's a true absolute path (has drive letter on Windows or starts with / on Unix)
        // Exclude paths that start with /uploads, /images, /sounds, /sound, /videos, /assets as these are relative to public
        const isTrueAbsolute = path.isAbsolute(normalizedFilePath) &&
            !normalizedFilePath.startsWith('/uploads') &&
            !normalizedFilePath.startsWith('/images') &&
            !normalizedFilePath.startsWith('/sounds') &&
            !normalizedFilePath.startsWith('/sound') &&
            !normalizedFilePath.startsWith('/videos') &&
            !normalizedFilePath.startsWith('/assets');

        if (isTrueAbsolute) {
            // It's a true absolute path (e.g., C:/path/to/file)
            pathsToTry.push(normalizedFilePath);
        } else {
            // It's a relative path from public directory
            // Remove leading slash if present
            let cleanPath = normalizedFilePath.startsWith('/') ? normalizedFilePath.slice(1) : normalizedFilePath;

            // If path doesn't start with 'uploads' or 'images', it might be missing
            // Common cases: '/images/logo.png' should be 'public/images/logo.png'
            // '/uploads/videos/...' should be 'public/uploads/videos/...'

            // Primary path - direct join
            const absolutePath = path.join(process.cwd(), 'public', cleanPath);
            pathsToTry.push(absolutePath);

            // Try normalized version with proper separators
            const normalizedPath = path.normalize(path.join(process.cwd(), 'public', cleanPath));
            if (normalizedPath !== absolutePath && !pathsToTry.includes(normalizedPath)) {
                pathsToTry.push(normalizedPath);
            }

            // Try to fix duplicate directory paths (e.g., /uploads/images/images/ -> /uploads/images/)
            const legacyPath = normalizedFilePath.replace(/\/([^\/]+)\/\1\//, '/$1/');
            if (legacyPath !== normalizedFilePath) {
                const legacyCleanPath = legacyPath.startsWith('/') ? legacyPath.slice(1) : legacyPath;
                const legacyAbsolutePath = path.join(process.cwd(), 'public', legacyCleanPath);
                if (!pathsToTry.includes(legacyAbsolutePath)) {
                    pathsToTry.push(legacyAbsolutePath);
                }
            }

            // Try without the 'images' subdirectory (direct in uploads)
            if (cleanPath.includes('images/images/')) {
                const directPath = cleanPath.replace('images/images/', 'images/');
                const tryPath = path.join(process.cwd(), 'public', directPath);
                if (!pathsToTry.includes(tryPath)) {
                    pathsToTry.push(tryPath);
                }
            }

            // Try videos subdirectory variants
            if (cleanPath.includes('videos/') && !cleanPath.includes('uploads/videos/')) {
                const videosPath = 'uploads/' + cleanPath;
                const tryPath = path.join(process.cwd(), 'public', videosPath);
                if (!pathsToTry.includes(tryPath)) {
                    pathsToTry.push(tryPath);
                }
            }

            // Try sounds directory (directly in public) - both plural and singular
            if (cleanPath.includes('sounds/') || cleanPath.startsWith('sounds/') ||
                cleanPath.includes('sound/') || cleanPath.startsWith('sound/')) {
                const soundsPath = path.join(process.cwd(), 'public', cleanPath);
                if (!pathsToTry.includes(soundsPath)) {
                    pathsToTry.push(soundsPath);
                }
            }

            // Try assets directory
            if (cleanPath.includes('assets/') && !cleanPath.includes('uploads/assets/')) {
                const assetsPath = 'uploads/' + cleanPath;
                const tryPath = path.join(process.cwd(), 'public', assetsPath);
                if (!pathsToTry.includes(tryPath)) {
                    pathsToTry.push(tryPath);
                }
            }
        }

        console.log('🔍 Will try these paths:', pathsToTry);

        // Try each path until we find the file
        for (const tryPath of pathsToTry) {
            const exists = fs.existsSync(tryPath);
            console.log('   Checking:', tryPath, 'Exists?', exists);

            if (exists) {
                // Check if it's a file or directory
                const stats = fs.statSync(tryPath);

                if (stats.isDirectory()) {
                    console.log('   ⚠️ Path is a directory, skipping');
                    continue;
                }

                try {
                    fs.unlinkSync(tryPath);
                    console.log('✅ File deleted successfully at:', tryPath);

                    return {
                        success: true,
                        message: 'File deleted successfully',
                        deletedPath: tryPath
                    };
                } catch (unlinkError) {
                    console.error('   ❌ Failed to delete:', unlinkError.message);

                    // Check if it's a permission error
                    if (unlinkError.code === 'EACCES' || unlinkError.code === 'EPERM') {
                        console.warn('⚠️ Permission denied. File exists but cannot be deleted:', tryPath);
                        return {
                            success: false,
                            message: 'Permission denied - cannot delete file',
                            error: unlinkError.message,
                            path: tryPath
                        };
                    }

                    // Check if it's a read-only file system error
                    if (unlinkError.code === 'EROFS') {
                        console.warn('⚠️ Read-only file system detected. File exists but cannot be deleted:', tryPath);
                        return {
                            success: true, // Return success so DB cleanup continues
                            message: 'File marked for deletion (read-only filesystem)',
                            warning: 'Running on read-only filesystem - file cannot be physically deleted',
                            readOnlyFS: true
                        };
                    }
                    throw unlinkError; // Re-throw if it's a different error
                }
            }
        }

        console.log('⚠️ File not found at any of these paths');
        console.log('   Current working directory:', process.cwd());
        console.log('   Public directory check:', fs.existsSync(path.join(process.cwd(), 'public')));

        return {
            success: false,
            message: 'File not found',
            details: {
                requestedPath: filePath,
                triedPaths: pathsToTry,
                cwd: process.cwd()
            }
        };

    } catch (error) {
        console.error('❌ Error deleting file:', error);
        return {
            success: false,
            message: `Error deleting file: ${error.message}`,
            error: error.message
        };
    }
}

/**
 * Get file info from local storage
 * @param {string} filePath - Relative path from public directory
 */
export async function getFileInfo(filePath) {
    try {
        // Remove leading slash if present
        const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
        const absolutePath = path.join(process.cwd(), 'public', cleanPath);

        if (!fs.existsSync(absolutePath)) {
            throw new Error('File not found');
        }

        const stats = fs.statSync(absolutePath);
        const fileName = path.basename(absolutePath);

        return {
            fileName,
            size: stats.size,
            mimeType: getMimeType(fileName),
            created: stats.birthtime,
            modified: stats.mtime,
            isImage: isImage(fileName),
            isVideo: isVideo(fileName),
            isDocument: isDocument(fileName)
        };

    } catch (error) {
        console.error('❌ Error getting file info:', error);
        throw error;
    }
}

/**
 * List files in a directory
 * @param {string} folder - Folder name within uploads directory
 * @param {string} type - File type filter ('images', 'videos', 'documents', 'assets')
 */
export async function listFiles(folder = '', type = 'all') {
    try {
        initializeDirectories();

        let searchDir;
        switch (type) {
            case 'images':
                searchDir = folder ? path.join(IMAGES_DIR, folder) : IMAGES_DIR;
                break;
            case 'videos':
                searchDir = folder ? path.join(VIDEOS_DIR, folder) : VIDEOS_DIR;
                break;
            case 'documents':
                searchDir = folder ? path.join(DOCUMENTS_DIR, folder) : DOCUMENTS_DIR;
                break;
            case 'assets':
                searchDir = folder ? path.join(ASSETS_DIR, folder) : ASSETS_DIR;
                break;
            default:
                searchDir = folder ? path.join(UPLOAD_BASE_DIR, folder) : UPLOAD_BASE_DIR;
        }

        if (!fs.existsSync(searchDir)) {
            return [];
        }

        const files = fs.readdirSync(searchDir, { withFileTypes: true });
        const fileList = [];

        for (const file of files) {
            if (file.isFile()) {
                const filePath = path.join(searchDir, file.name);
                const relativePath = path.relative(path.join(process.cwd(), 'public'), filePath);
                const publicUrl = `/${relativePath.replace(/\\/g, '/')}`;
                const stats = fs.statSync(filePath);

                fileList.push({
                    name: file.name,
                    url: publicUrl,
                    size: stats.size,
                    mimeType: getMimeType(file.name),
                    created: stats.birthtime,
                    modified: stats.mtime,
                    isImage: isImage(file.name),
                    isVideo: isVideo(file.name),
                    isDocument: isDocument(file.name)
                });
            }
        }

        return fileList;

    } catch (error) {
        console.error('❌ Error listing files:', error);
        throw error;
    }
}

/**
 * Get storage status and usage
 */
export async function getStorageStatus() {
    try {
        initializeDirectories();

        const getDirectorySize = (dirPath) => {
            let totalSize = 0;
            let fileCount = 0;

            if (fs.existsSync(dirPath)) {
                const files = fs.readdirSync(dirPath, { withFileTypes: true });
                for (const file of files) {
                    const filePath = path.join(dirPath, file.name);
                    if (file.isFile()) {
                        const stats = fs.statSync(filePath);
                        totalSize += stats.size;
                        fileCount++;
                    } else if (file.isDirectory()) {
                        const subDirInfo = getDirectorySize(filePath);
                        totalSize += subDirInfo.size;
                        fileCount += subDirInfo.count;
                    }
                }
            }

            return { size: totalSize, count: fileCount };
        };

        const images = getDirectorySize(IMAGES_DIR);
        const videos = getDirectorySize(VIDEOS_DIR);
        const documents = getDirectorySize(DOCUMENTS_DIR);
        const assets = getDirectorySize(ASSETS_DIR);

        const total = {
            size: images.size + videos.size + documents.size + assets.size,
            count: images.count + videos.count + documents.count + assets.count
        };

        return {
            total: {
                size: total.size,
                sizeFormatted: formatBytes(total.size),
                count: total.count
            },
            images: {
                size: images.size,
                sizeFormatted: formatBytes(images.size),
                count: images.count
            },
            videos: {
                size: videos.size,
                sizeFormatted: formatBytes(videos.size),
                count: videos.count
            },
            documents: {
                size: documents.size,
                sizeFormatted: formatBytes(documents.size),
                count: documents.count
            },
            assets: {
                size: assets.size,
                sizeFormatted: formatBytes(assets.size),
                count: assets.count
            },
            enabled: true,
            configured: true
        };

    } catch (error) {
        console.error('❌ Error getting storage status:', error);
        throw error;
    }
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}