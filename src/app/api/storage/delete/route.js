import { NextResponse } from 'next/server'
import { deleteFromLocalStorage } from '@/utils/localStorage'
import { deleteFromCloudinary } from '@/utils/cloudinary'

export async function POST(request) {
    try {
        const { filePath, publicId, resourceType, local } = await request.json()

        console.log('🗑️ Delete API called:', {
            filePath,
            publicId,
            resourceType,
            local,
            env: process.env.NODE_ENV
        })

        if (!filePath && !publicId) {
            return NextResponse.json(
                { success: false, message: 'File path or Public ID is required' },
                { status: 400 }
            )
        }

        let result;

        // Strategy to determine deletion method:
        // 1. If 'local' is explicitly false, use Cloudinary.
        // 2. If 'publicId' is provided and 'filePath' is not (or matches publicId), use Cloudinary.
        // 3. If 'filePath' looks like a local path (starts with / or has extension likely), use Local.

        // Improve detection: Cloudinary public_ids usually don't have extensions, or if they do, we handle it.
        // But our upload implementation sets 'local: false'.

        const useCloudinary = (local === false) || (publicId && !filePath) || (publicId && !publicId.startsWith('/') && !publicId.includes('\\'));

        if (useCloudinary) {
            let actualPublicId = publicId;

            // If publicId is actually a URL, extract the real public_id
            if (publicId && (publicId.startsWith('http://') || publicId.startsWith('https://'))) {
                const parts = publicId.split('/upload/');
                if (parts.length > 1) {
                    let pathPart = parts[1];
                    // Remove version prefix if exists (e.g., v123456/)
                    if (pathPart.match(/^v\d+\//)) {
                        pathPart = pathPart.replace(/^v\d+\//, '');
                    }
                    // Remove extension to get public_id
                    actualPublicId = pathPart.replace(/\.[^/.]+$/, "");
                }
            }

            console.log(`🗑️ Deleting from Cloudinary: ${actualPublicId} (Original: ${publicId})`);
            try {
                result = await deleteFromCloudinary(actualPublicId);
                console.log('Cloudinary delete result:', result);
            } catch (error) {
                // Fallback? No, just report error.
                result = { success: false, message: error.message, error: error };
            }
        } else {
            // Local Storage
            const pathToDelete = filePath || publicId;
            console.log(`🗑️ Deleting from local storage: ${pathToDelete}`);
            result = await deleteFromLocalStorage(pathToDelete);
        }

        if (!result.success) {
            return NextResponse.json({
                success: false,
                message: result.message || 'Failed to delete file',
                details: result.details,
                error: result.error
            }, { status: result.error ? 500 : 404 })
        }

        // Handle read-only FS warning from local storage
        if (result.readOnlyFS) {
            return NextResponse.json({
                success: true,
                message: result.message,
                warning: result.warning,
                readOnlyFS: true
            })
        }

        return NextResponse.json({
            success: true,
            message: 'File deleted successfully',
            deletedPath: result.deletedPath || publicId
        })

    } catch (error) {
        console.error('Error deleting file:', error)
        return NextResponse.json(
            {
                success: false,
                message: error.message || 'Error deleting file',
                debug: process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
            },
            { status: 500 }
        )
    }
}
