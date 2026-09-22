import fs from 'fs';
import path from 'path';
import {
    UPLOAD_BASE_DIR,
    IMAGES_DIR,
    VIDEOS_DIR,
    DOCUMENTS_DIR,
    ASSETS_DIR,
} from './constants';
import {
    initializeDirectories,
    getMimeType,
    isImage,
    isVideo,
    isDocument,
    formatBytes,
} from './fileHelpers';

/**
 * Get file info from local storage
 * @param {string} filePath - Relative path from public directory
 */
export async function getFileInfo(filePath) {
    try {
        // Remove leading slash if present
        const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
        const absolutePath = path.join(process.cwd(), 'storage', cleanPath);

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
                const relativePath = path.relative(path.join(process.cwd(), 'storage'), filePath);
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
        const PUBLIC_DIR = path.join(process.cwd(), 'storage');
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

        // Scan the entire storage directory for total usage. Files uploaded
        // before the move to storage/uploads still sit in public/uploads and
        // are still being served — without also scanning that root, the
        // sidebar's "Total Files"/"Usage" only ever counted the new folder
        // (see the same dual-root fix in /api/storage/files and
        // /api/admin/media).
        const publicUploadsSize = getDirectorySize(path.join(process.cwd(), 'public', 'uploads'));
        const storageSize = getDirectorySize(PUBLIC_DIR);
        const total = {
            size: storageSize.size + publicUploadsSize.size,
            count: storageSize.count + publicUploadsSize.count
        };

        // Get specific stats for main categories for the UI
        const images = getDirectorySize(IMAGES_DIR);
        const videos = getDirectorySize(VIDEOS_DIR);
        const documents = getDirectorySize(DOCUMENTS_DIR);
        const assets = getDirectorySize(ASSETS_DIR);

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
