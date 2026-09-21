import fs from 'fs';
import path from 'path';

/**
 * Delete file from local storage
 * @param {string} filePath - Relative path from public directory or absolute path
 */
export async function deleteFromLocalStorage(filePath) {
    try {
        const pathsToTry = [];

        if (!filePath || typeof filePath !== 'string') {
            return {
                success: false,
                message: 'Invalid file path provided',
                error: 'FilePath must be a non-empty string'
            };
        }

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
            const absolutePath = path.join(process.cwd(), 'storage', cleanPath);
            pathsToTry.push(absolutePath);

            // Try normalized version with proper separators
            const normalizedPath = path.normalize(path.join(process.cwd(), 'storage', cleanPath));
            if (normalizedPath !== absolutePath && !pathsToTry.includes(normalizedPath)) {
                pathsToTry.push(normalizedPath);
            }

            // Try to fix duplicate directory paths (e.g., /uploads/images/images/ -> /uploads/images/)
            const legacyPath = normalizedFilePath.replace(/\/([^\/]+)\/\1\//, '/$1/');
            if (legacyPath !== normalizedFilePath) {
                const legacyCleanPath = legacyPath.startsWith('/') ? legacyPath.slice(1) : legacyPath;
                const legacyAbsolutePath = path.join(process.cwd(), 'storage', legacyCleanPath);
                if (!pathsToTry.includes(legacyAbsolutePath)) {
                    pathsToTry.push(legacyAbsolutePath);
                }
            }

            // Try without the 'images' subdirectory (direct in uploads)
            if (cleanPath.includes('images/images/')) {
                const directPath = cleanPath.replace('images/images/', 'images/');
                const tryPath = path.join(process.cwd(), 'storage', directPath);
                if (!pathsToTry.includes(tryPath)) {
                    pathsToTry.push(tryPath);
                }
            }

            // Try videos subdirectory variants
            if (cleanPath.includes('videos/') && !cleanPath.includes('uploads/videos/')) {
                const videosPath = 'uploads/' + cleanPath;
                const tryPath = path.join(process.cwd(), 'storage', videosPath);
                if (!pathsToTry.includes(tryPath)) {
                    pathsToTry.push(tryPath);
                }
            }

            // Try sounds directory (directly in public) - both plural and singular
            if (cleanPath.includes('sounds/') || cleanPath.startsWith('sounds/') ||
                cleanPath.includes('sound/') || cleanPath.startsWith('sound/')) {
                const soundsPath = path.join(process.cwd(), 'storage', cleanPath);
                if (!pathsToTry.includes(soundsPath)) {
                    pathsToTry.push(soundsPath);
                }
            }

            // Try assets directory
            if (cleanPath.includes('assets/') && !cleanPath.includes('uploads/assets/')) {
                const assetsPath = 'uploads/' + cleanPath;
                const tryPath = path.join(process.cwd(), 'storage', assetsPath);
                if (!pathsToTry.includes(tryPath)) {
                    pathsToTry.push(tryPath);
                }
            }
        }

        // Try each path until we find the file
        for (const tryPath of pathsToTry) {
            const exists = fs.existsSync(tryPath);
            if (exists) {
                // Check if it's a file or directory
                const stats = fs.statSync(tryPath);

                if (stats.isDirectory()) {
                    // Files are always stored as single files now — never delete
                    // a directory from here.
                    continue;
                }

                try {
                    fs.unlinkSync(tryPath);
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
