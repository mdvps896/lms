import { v2 as cloudinary } from 'cloudinary';
import Settings from '@/models/Settings';
import connectDB from '@/lib/mongodb';

let isConfigured = false;

/**
 * Initialize Cloudinary with settings from database
 */
export async function initCloudinary() {
    try {
        await connectDB();
        const settings = await Settings.findOne();
        
        if (settings?.integrations?.cloudinary?.enabled) {
            const { cloudName, apiKey, apiSecret } = settings.integrations.cloudinary;
            
            if (cloudName && apiKey && apiSecret) {
                cloudinary.config({
                    cloud_name: cloudName,
                    api_key: apiKey,
                    api_secret: apiSecret,
                    secure: true
                });
                isConfigured = true;
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Error initializing Cloudinary:', error);
        return false;
    }
}

/**
 * Upload file to Cloudinary
 * @param {string} file - Base64 string or file path
 * @param {string} folder - Folder name in Cloudinary
 * @param {string} resourceType - Resource type (image, video, raw, auto)
 */
export async function uploadToCloudinary(file, folder = '', resourceType = 'auto') {
    if (!isConfigured) {
        const initialized = await initCloudinary();
        if (!initialized) {
            throw new Error('Cloudinary not configured. Please configure in Settings.');
        }
    }

    try {
        const settings = await Settings.findOne();
        const uploadFolder = folder || settings?.integrations?.cloudinary?.folder || 'exam-portal';
        
        const result = await cloudinary.uploader.upload(file, {
            folder: uploadFolder,
            resource_type: resourceType,
        });

        return {
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: result.resource_type,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes
        };
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        throw error;
    }
}

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Public ID of the file
 * @param {string} resourceType - Resource type (image, video, raw)
 */
export async function deleteFromCloudinary(publicId, resourceType = 'image') {
    if (!isConfigured) {
        const initialized = await initCloudinary();
        if (!initialized) {
            throw new Error('Cloudinary not configured. Please configure in Settings.');
        }
    }

    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });

        return {
            success: result.result === 'ok',
            result: result.result
        };
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        throw error;
    }
}

/**
 * Get Cloudinary configuration status
 */
export async function getCloudinaryStatus() {
    try {
        await connectDB();
        const settings = await Settings.findOne();
        
        return {
            enabled: settings?.integrations?.cloudinary?.enabled || false,
            configured: !!(settings?.integrations?.cloudinary?.cloudName && 
                          settings?.integrations?.cloudinary?.apiKey && 
                          settings?.integrations?.cloudinary?.apiSecret)
        };
    } catch (error) {
        console.error('Error getting Cloudinary status:', error);
        return { enabled: false, configured: false };
    }
}
