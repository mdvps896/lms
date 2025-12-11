import { NextResponse } from 'next/server'
import { deleteFromLocalStorage } from '@/utils/localStorage'

export async function POST(request) {
    try {
        const { filePath, publicId, resourceType } = await request.json()

        console.log('🗑️ Delete API called:', {
            filePath,
            publicId,
            resourceType,
            env: process.env.NODE_ENV,
            cwd: process.cwd()
        })

        if (!filePath && !publicId) {
            return NextResponse.json(
                { success: false, message: 'File path is required' },
                { status: 400 }
            )
        }

        // Use filePath for local storage deletion
        const pathToDelete = filePath || publicId

        if (!pathToDelete) {
            return NextResponse.json(
                { success: false, message: 'File path is required for local storage' },
                { status: 400 }
            )
        }

        try {
            console.log(`🗑️ Deleting from local storage: ${pathToDelete}`)
            console.log(`   Resource type: ${resourceType}`)
            
            const result = await deleteFromLocalStorage(pathToDelete)
            
            console.log('Delete result:', result)
            
            if (!result.success) {
                return NextResponse.json({
                    success: false,
                    message: result.message || 'Failed to delete file',
                    details: result.details,
                    error: result.error,
                    debug: {
                        requestedPath: pathToDelete,
                        resourceType: resourceType,
                        env: process.env.NODE_ENV
                    }
                }, { status: result.error ? 500 : 404 })
            }
            
            // If it's a read-only filesystem, return success with warning
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
                deletedPath: result.deletedPath
            })
        } catch (error) {
            console.error('Local storage delete error:', error)
            console.error('Stack trace:', error.stack)
            return NextResponse.json(
                { 
                    success: false, 
                    message: `Error deleting file: ${error.message}`,
                    debug: {
                        error: error.message,
                        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
                        path: pathToDelete,
                        env: process.env.NODE_ENV
                    }
                },
                { status: 500 }
            )
        }
    } catch (error) {
        console.error('Error deleting file:', error)
        console.error('Stack trace:', error.stack)
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
