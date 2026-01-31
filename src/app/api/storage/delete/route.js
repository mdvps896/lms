import { NextResponse } from 'next/server'
import { deleteFromLocalStorage } from '@/utils/localStorage'
import { getAuthenticatedUser, requirePermission } from '@/utils/apiAuth'

export async function POST(request) {
    try {
        const { filePath, publicId } = await request.json()

        // Security Check
        const authError = await requirePermission(request, 'manage_storage');
        if (authError) return authError;

        const user = await getAuthenticatedUser(request);
        // If teacher has 'own' scope, they cannot delete files as we don't track file ownership explicitly yet.
        // This prevents them from deleting other people's files.
        if (user && user.role === 'teacher' && (user.accessScope || 'own') === 'own') {
            return NextResponse.json({ success: false, message: 'Access Denied: Teachers with "Manage Own" scope cannot delete general files.' }, { status: 403 });
        }

        if (!filePath && !publicId && (!Array.isArray(body?.filePaths) || body.filePaths.length === 0)) {
            return NextResponse.json(
                { success: false, message: 'File path, Public ID, or filePaths array is required' },
                { status: 400 }
            )
        }

        // Handle bulk deletion if filePaths array is provided
        if (Array.isArray(body?.filePaths)) {
            const results = [];
            for (const path of body.filePaths) {
                const result = await deleteFromLocalStorage(path);
                results.push({ path, success: result.success, message: result.message });
            }

            const successCount = results.filter(r => r.success).length;
            return NextResponse.json({
                success: successCount > 0,
                message: `Deleted ${successCount} of ${results.length} files`,
                results
            });
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
