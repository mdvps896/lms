import {
    saveToLocalStorage,
    deleteFromLocalStorage,
    listFiles
} from './localStorage';

// Mocking the cloudinary config just in case some legacy code tries to access it
// though we removed the import, so this object is just a dummy.
export const v2 = {
    config: () => { },
    uploader: {
        upload: () => Promise.reject(new Error('Cloudinary is disabled. Using Local Storage.')),
        destroy: () => Promise.reject(new Error('Cloudinary is disabled. Using Local Storage.'))
    }
};

/**
 * Save file to Local Storage (Switching away from Cloudinary)
 * Wrapper function to maintain compatibility with existing API calls
 * @param {string} file - Base64 string (Data URI) or Buffer
 * @param {string} folder - Optional subfolder
 * @param {string} fileName - Original file name
 */
export async function saveToCloudinary(file, folder = '', fileName = '') {
    try {
        console.log('🔄 Redirecting Cloudinary upload to Local Storage...');

        const result = await saveToLocalStorage(file, folder, fileName);

        if (!result.success) {
            throw new Error(result.error || 'Local storage upload failed');
        }

        // Return object compatible with Cloudinary result structure expected by the app
        return {
            success: true,
            url: result.url,
            fileName: result.relativePath, // Use relative path as the identifier (public_id)
            originalName: result.originalName,
            size: result.size,
            mimeType: result.mimeType,
            publicId: result.relativePath, // Map relative path to publicId for deletion reference
            folder: result.folder,
            format: result.fileName.split('.').pop(),
            width: 0, // Metadata not extracted by default in local storage
            height: 0,
            local: true // Flag to indicate local storage usage
        };

    } catch (error) {
        console.error('Error in saveToCloudinary (Local Shim):', error);
        throw new Error(`Upload Failed: ${error.message}`);
    }
}

/**
 * Delete file from Local Storage (Wrapper for Cloudinary delete)
 * @param {string} publicId - In this context, it's the relative path or URL
 */
export async function deleteFromCloudinary(publicId) {
    try {
        console.log('🔄 Redirecting Cloudinary delete to Local Storage for:', publicId);

        if (!publicId) {
            throw new Error('Public ID (File Path) is required');
        }

        // publicId in our local shim *is* the relative path (e.g. "uploads/images/file.jpg")
        const result = await deleteFromLocalStorage(publicId);

        return {
            success: result.success,
            message: result.message || (result.success ? 'ok' : 'failed')
        };

    } catch (error) {
        console.error('Error in deleteFromCloudinary (Local Shim):', error);
        return {
            success: false,
            message: error.message
        };
    }
}

/**
 * List resources (Wrapper for Local Storage list)
 */
export async function listCloudinaryResources(folder = '') {
    try {
        console.log('🔄 Listing Local Storage resources for:', folder);

        // Map the type based on folder name or default to 'all'
        let type = 'all';
        if (folder.includes('images')) type = 'images';
        if (folder.includes('videos')) type = 'videos';
        if (folder.includes('documents')) type = 'documents';

        const files = await listFiles(folder, type);

        // Map to Cloudinary resource structure
        return files.map(file => ({
            public_id: file.url.startsWith('/') ? file.url.slice(1) : file.url, // remove leading slash for consistency
            secure_url: file.url,
            url: file.url,
            format: file.mimeType.split('/')[1],
            resource_type: file.mimeType.split('/')[0],
            created_at: file.created,
            bytes: file.size
        }));

    } catch (error) {
        console.error('Error listing resources:', error);
        throw error;
    }
}
