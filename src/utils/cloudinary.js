
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary will automatically pick up CLOUDINARY_URL from process.env
cloudinary.config({
    secure: true
});

/**
 * Save file to Cloudinary
 * @param {string} file - Base64 string (Data URI) or Buffer
 * @param {string} folder - Optional subfolder
 * @param {string} fileName - Original file name
 */
export async function saveToCloudinary(file, folder = '', fileName = '') {
    try {
        let fileData = file;

        // If buffer, convert to base64 data uri if possible, or just pass buffer if allowed?
        // Cloudinary uploader.upload supports file path, url, or creating a stream.
        // For Base64 data URI, it works directly.
        if (Buffer.isBuffer(file)) {
            // We need a mime type to create a proper data URI, or we can try to upload using a stream.
            // But let's see how localStorage did it. It converted to Buffer. 
            // The route passes a data URI string mostly.
            // But if it is a buffer, we might need to handle it.
            // Simplified: Assume it handles Data URI strings well. 
            // If it's a buffer, we can try to upload it via stream, but let's just convert to base64 for simplicity if small enough.
            const b64 = file.toString('base64');
            fileData = `data:application/octet-stream;base64,${b64}`;
        }

        const options = {
            folder: folder || 'uploads',
            use_filename: true,
            unique_filename: true,
            resource_type: 'auto'
        };

        if (fileName) {
            // Remove extension for public_id
            options.public_id = fileName.replace(/\.[^/.]+$/, "").replace(/\s+/g, '_');
        }

        const result = await cloudinary.uploader.upload(fileData, options);

        return {
            success: true,
            url: result.secure_url, // HTTPS url
            fileName: result.public_id, // This is key for deletion
            originalName: fileName || result.original_filename,
            size: result.bytes,
            mimeType: `${result.resource_type}/${result.format}`,
            publicId: result.public_id,
            folder: folder,
            format: result.format,
            width: result.width,
            height: result.height,
            local: false
        };

    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        throw new Error(`Cloudinary Upload Failed: ${error.message}`);
    }
}

/**
 * Delete file from Cloudinary
 * @param {string} publicId - The public ID of the asset on Cloudinary
 */
export async function deleteFromCloudinary(publicId) {
    try {
        if (!publicId) {
            throw new Error('Public ID is required');
        }

        // Try deleting as image first (default)
        let result = await cloudinary.uploader.destroy(publicId);

        // If not found, it might be a video or raw file
        if (result.result === 'not found') {
            result = await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
        }

        if (result.result === 'not found') {
            result = await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
        }

        return {
            success: result.result === 'ok',
            message: result.result
        };

    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

/**
 * List resources from Cloudinary (optional helper)
 */
export async function listCloudinaryResources(folder = '') {
    try {
        const result = await cloudinary.api.resources({
            type: 'upload',
            prefix: folder,
            max_results: 500
        });
        return result.resources;
    } catch (error) {
        console.error('Error listing Cloudinary resources:', error);
        throw error;
    }
}
