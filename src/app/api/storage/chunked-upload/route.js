import { NextResponse } from 'next/server';
import { uploadToCloudinary, getCloudinaryStatus } from '@/utils/cloudinary';

// Configure this route to handle large uploads
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes timeout for large uploads

export async function POST(request) {
    try {
        console.log('🚀 Starting chunked upload process...');
        
        // Check if Cloudinary is enabled
        const cloudinaryStatus = await getCloudinaryStatus();
        if (!cloudinaryStatus.enabled || !cloudinaryStatus.configured) {
            return NextResponse.json(
                { success: false, message: 'Cloudinary not configured' },
                { status: 500 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file');
        const folder = formData.get('folder') || 'large-files';
        const chunkIndex = parseInt(formData.get('chunkIndex') || '0');
        const totalChunks = parseInt(formData.get('totalChunks') || '1');
        const fileName = formData.get('fileName');
        const fileId = formData.get('fileId'); // Unique identifier for multi-chunk uploads

        console.log(`📦 Processing chunk ${chunkIndex + 1}/${totalChunks} for ${fileName}`)

        if (!file || !fileName) {
            return NextResponse.json(
                { success: false, message: 'No file or filename provided' },
                { status: 400 }
            )
        }
        
        // Validate chunk size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json(
                { success: false, message: 'Chunk size too large (max 2MB)' },
                { status: 413 }
            )
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        console.log(`📊 Chunk size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

        if (totalChunks === 1) {
            // Single file upload (smaller files)
            const base64File = `data:${file.type};base64,${buffer.toString('base64')}`;
            
            console.log('📤 Single file upload to Cloudinary...');
            const result = await uploadToCloudinary(base64File, folder, 'auto', fileName);
            
            if (result.success) {
                console.log('✅ Single file upload successful!');
                return NextResponse.json({
                    success: true,
                    url: result.url,
                    publicId: result.publicId,
                    message: 'File uploaded successfully',
                    chunked: false
                });
            } else {
                console.error('❌ Single file upload failed:', result.error);
                return NextResponse.json(
                    { success: false, message: result.error },
                    { status: 500 }
                );
            }
        } else {
            // Multi-chunk upload for very large files
            console.log('🔄 Multi-chunk upload mode...');
            
            // Store chunks temporarily (in production, use Redis or similar)
            if (!global.uploadChunks) {
                global.uploadChunks = new Map();
            }
            
            const chunkKey = `${fileId}_${chunkIndex}`;
            global.uploadChunks.set(chunkKey, buffer);
            
            console.log(`💾 Stored chunk ${chunkIndex + 1}/${totalChunks}`);
            
            // Check if this is the last chunk
            if (chunkIndex === totalChunks - 1) {
                console.log('🔗 Reassembling all chunks...');
                
                // Combine all chunks
                const chunks = [];
                let totalSize = 0;
                
                for (let i = 0; i < totalChunks; i++) {
                    const chunk = global.uploadChunks.get(`${fileId}_${i}`);
                    if (chunk) {
                        chunks.push(chunk);
                        totalSize += chunk.length;
                        // Clean up chunk from memory
                        global.uploadChunks.delete(`${fileId}_${i}`);
                    }
                }
                
                const completeBuffer = Buffer.concat(chunks);
                console.log(`📏 Complete file size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
                
                // Determine MIME type
                const mimeType = getMimeTypeFromFileName(fileName);
                const base64File = `data:${mimeType};base64,${completeBuffer.toString('base64')}`;
                
                console.log('⬆️ Uploading complete file to Cloudinary...');
                const result = await uploadToCloudinary(base64File, folder, 'auto', fileName);
                
                if (result.success) {
                    console.log('🎉 Chunked upload completed successfully!');
                    return NextResponse.json({
                        success: true,
                        url: result.url,
                        publicId: result.publicId,
                        message: 'Large file uploaded successfully',
                        chunked: true,
                        totalSize: totalSize,
                        chunks: totalChunks
                    });
                } else {
                    console.error('❌ Final upload failed:', result.error);
                    return NextResponse.json(
                        { success: false, message: result.error },
                        { status: 500 }
                    );
                }
            } else {
                // Not the last chunk, just acknowledge receipt
                return NextResponse.json({
                    success: true,
                    message: `Chunk ${chunkIndex + 1}/${totalChunks} received`,
                    chunkIndex: chunkIndex,
                    totalChunks: totalChunks
                });
            }
        }
    } catch (error) {
        console.error('💥 Chunked upload error:', error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}

// Helper function to determine MIME type from filename
function getMimeTypeFromFileName(fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes = {
        'zip': 'application/zip',
        'rar': 'application/x-rar-compressed',
        '7z': 'application/x-7z-compressed',
        'tar': 'application/x-tar',
        'gz': 'application/gzip',
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'avi': 'video/x-msvideo',
        'mov': 'video/quicktime',
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'txt': 'text/plain'
    };
    return mimeTypes[ext] || 'application/octet-stream';
}