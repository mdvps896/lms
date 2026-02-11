import { NextResponse } from 'next/server';
import { deleteFromLocalStorage } from '@/utils/localStorage';
import { getAuthenticatedUser, requirePermission } from '@/utils/apiAuth';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request) {
    try {
        const body = await request.json();
        const { filePath, publicId, items } = body; // items: [{ path, publicId, isCloudinary }]

        // Security Check
        const authError = await requirePermission(request, 'manage_storage');
        if (authError) return authError;

        const user = await getAuthenticatedUser(request);
        if (user && user.role === 'teacher' && (user.accessScope || 'own') === 'own') {
            return NextResponse.json({ success: false, message: 'Access Denied: Teachers with "Manage Own" scope cannot delete general files.' }, { status: 403 });
        }

        // Handle bulk deletion (New 'items' array or legacy 'filePaths')
        const itemsToDelete = items || (body.filePaths ? body.filePaths.map(p => ({ path: p })) : []);

        if (itemsToDelete.length > 0) {
            const results = [];
            for (const item of itemsToDelete) {
                let success = false;
                let msg = '';

                try {
                    if (item.isCloudinary && item.publicId) {
                        // Delete from Cloudinary
                        await new Promise((resolve, reject) => {
                            cloudinary.uploader.destroy(item.publicId, (error, result) => {
                                if (error) reject(error);
                                else resolve(result);
                            });
                        });
                        success = true;
                        msg = 'Deleted from Cloudinary';
                    } else if (item.path) {
                        // Delete from Local Storage
                        const result = await deleteFromLocalStorage(item.path);
                        success = result.success;
                        msg = result.message;
                    }
                } catch (e) {
                    msg = e.message;
                }

                results.push({ path: item.path, publicId: item.publicId, success, message: msg });
            }

            const successCount = results.filter(r => r.success).length;
            return NextResponse.json({
                success: successCount > 0,
                message: `Deleted ${successCount} of ${results.length} files`,
                results
            });
        }

        // Single file delete (Legacy support)
        if (!filePath && !publicId) {
            return NextResponse.json(
                { success: false, message: 'File path, Public ID, or items array is required' },
                { status: 400 }
            );
        }

        const pathToDelete = filePath || publicId;
        const result = await deleteFromLocalStorage(pathToDelete);

        if (!result.success) {
            // Check if it's a "File not found" error
            // If the file is missing, we consider the delete intent "successful" (idempotency)
            // so the UI cleans up the entry.
            if (result.message === 'File not found' || (result.error && result.error.includes('ENOENT'))) {
                return NextResponse.json({
                    success: true,
                    message: 'File not found (considered deleted)',
                    deletedPath: pathToDelete,
                    warning: 'File was already missing'
                })
            }

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
