import { v2 as cloudinary } from 'cloudinary';
import Settings from '@/models/Settings';
import connectDB from '@/lib/mongodb';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

let isConfigured = false;

// File size constants
const MAX_STANDARD_SIZE = 8 * 1024 * 1024; // 8MB - threshold for using optimization
const IMAGE_COMPRESSION_QUALITY = 80;

/**
 * Initialize Cloudinary with settings from database
 */
export async function initCloudinary() {
    try {
        await connectDB();
        const settings = await Settings.findOne();
        
        console.log('=== Cloudinary Init Debug ===');
        console.log('Settings found:', !!settings);
        console.log('Has integrations:', !!settings?.integrations);
        console.log('Has cloudinary:', !!settings?.integrations?.cloudinary);
        console.log('Cloudinary enabled:', settings?.integrations?.cloudinary?.enabled);
        
        if (settings?.integrations?.cloudinary?.enabled) {
            const { cloudName, apiKey, apiSecret } = settings.integrations.cloudinary;
            
            console.log('Cloudinary credentials check:');
            console.log('- cloudName:', cloudName);
            console.log('- apiKey:', apiKey?.substring(0, 8) + '***');
            console.log('- apiSecret:', apiSecret?.substring(0, 8) + '***');
            
            if (cloudName && apiKey && apiSecret) {
                console.log('Configuring Cloudinary with:', {
                    cloud_name: cloudName,
                    api_key: apiKey?.substring(0, 8) + '***',
                    api_secret: apiSecret?.substring(0, 8) + '***'
                });
                
                cloudinary.config({
                    cloud_name: cloudName,
                    api_key: apiKey,
                    api_secret: apiSecret,
                    secure: true
                });
                isConfigured = true;
                console.log('✅ Cloudinary configured successfully');
                return true;
            } else {
                console.log('❌ Missing Cloudinary credentials');
            }
        } else {
            console.log('❌ Cloudinary not enabled in settings');
        }
        return false;
    } catch (error) {
        console.error('Error initializing Cloudinary:', error);
        return false;
    }
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
        '.mp4': 'video/mp4',
        '.avi': 'video/avi',
        '.mov': 'video/quicktime',
        '.txt': 'text/plain'
    };
    return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Check if file is an image
 */
function isImage(fileName) {
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'];
    const ext = path.extname(fileName).toLowerCase();
    return imageExts.includes(ext);
}

/**
 * Upload file to Cloudinary with automatic optimization for large files
 * @param {string} file - Base64 string or file path
 * @param {string} folder - Folder name in Cloudinary
 * @param {string} resourceType - Resource type (image, video, raw, auto)
 * @param {string} fileName - Original file name for optimization decisions
 */
export async function uploadToCloudinary(file, folder = '', resourceType = 'auto', fileName = '') {
    if (!isConfigured) {
        const initialized = await initCloudinary();
        if (!initialized) {
            throw new Error('Cloudinary not configured. Please configure in Settings.');
        }
    }

    try {
        const settings = await Settings.findOne();
        const uploadFolder = folder || settings?.integrations?.cloudinary?.folder || 'exam-portal';
        
        console.log('📤 Starting upload process for:', fileName);
        
        let fileToUpload = file;
        let uploadOptions = {
            folder: uploadFolder,
            resource_type: resourceType,
        };

        // Handle Base64 input for large files
        if (typeof file === 'string' && file.startsWith('data:')) {
            const base64Data = file.split(',')[1];
            const fileBuffer = Buffer.from(base64Data, 'base64');
            const fileSize = fileBuffer.length;
            
            console.log(`📊 File size: ${fileSize} bytes (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
            
            // If file is large and is an image, compress it
            if (fileSize > MAX_STANDARD_SIZE && isImage(fileName)) {
                console.log('🔄 Large image detected, applying compression...');
                const compressedBuffer = await compressImage(fileBuffer, fileName);
                
                // Convert compressed buffer back to base64
                const mimeType = getMimeType(fileName);
                fileToUpload = `data:${mimeType};base64,${compressedBuffer.toString('base64')}`;
                console.log('✅ Image optimized and ready for upload');
            }
            
            // For very large files, use chunked upload
            if (fileSize > 10 * 1024 * 1024) { // 10MB+
                console.log('📦 Using chunked upload for large file...');
                uploadOptions.chunk_size = 6000000; // 6MB chunks
            }
        }
        
        console.log('⬆️ Uploading to Cloudinary...');
        const result = await cloudinary.uploader.upload(fileToUpload, uploadOptions);

        console.log('🎉 Upload successful!');
        console.log('📝 Public ID:', result.public_id);
        console.log('🔗 URL:', result.secure_url);
        
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
        console.error('💥 Upload failed:', error);
        
        // Enhanced error handling with fallback strategies
        if (error.message?.includes('File size too large')) {
            console.log('🔄 Attempting fallback strategies for large file...');
            
            // Try with different upload approach
            try {
                return await uploadLargeFileWithFallback(file, folder, resourceType, fileName);
            } catch (fallbackError) {
                console.error('❌ All upload strategies failed:', fallbackError);
                throw new Error(`File too large for upload. Consider compressing the file. Original error: ${error.message}`);
            }
        }
        
        throw error;
    }
}

/**
 * Fallback strategy for very large files
 */
async function uploadLargeFileWithFallback(file, folder, resourceType, fileName) {
    console.log('🆘 Trying fallback upload strategy...');
    
    try {
        const settings = await Settings.findOne();
        const uploadFolder = folder || settings?.integrations?.cloudinary?.folder || 'exam-portal';
        
        // For base64 files, try aggressive compression first
        if (typeof file === 'string' && file.startsWith('data:') && isImage(fileName)) {
            const base64Data = file.split(',')[1];
            const fileBuffer = Buffer.from(base64Data, 'base64');
            
            console.log('🔧 Applying aggressive compression...');
            const aggressivelyCompressed = await sharp(fileBuffer)
                .resize(1024, 1024, { 
                    fit: 'inside',
                    withoutEnlargement: true 
                })
                .jpeg({ 
                    quality: 60, 
                    progressive: true 
                })
                .toBuffer();
            
            const mimeType = getMimeType(fileName);
            const compressedFile = `data:${mimeType};base64,${aggressivelyCompressed.toString('base64')}`;
            
            console.log(`📉 Aggressively compressed: ${fileBuffer.length} → ${aggressivelyCompressed.length} bytes`);
            
            const result = await cloudinary.uploader.upload(compressedFile, {
                folder: uploadFolder,
                resource_type: resourceType,
                chunk_size: 6000000
            });
            
            return {
                success: true,
                url: result.secure_url,
                publicId: result.public_id,
                resourceType: result.resource_type,
                format: result.format,
                width: result.width,
                height: result.height,
                bytes: result.bytes,
                compressed: true
            };
        }
        
        // If not an image or compression didn't work, try upload_large
        console.log('📦 Trying upload_large method...');
        const result = await cloudinary.uploader.upload_large(file, {
            folder: uploadFolder,
            resource_type: resourceType,
            chunk_size: 6000000
        });
        
        return {
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: result.resource_type,
            format: result.format,
            bytes: result.bytes,
            chunked: true
        };
        
    } catch (error) {
        console.error('🚫 Fallback strategy also failed:', error);
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
