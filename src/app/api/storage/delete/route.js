import { NextResponse } from 'next/server'
import { deleteFromLocalStorage } from '@/utils/localStorage'

export async function POST(request) {
    try {
        const { filePath, publicId, resourceType } = await request.json()

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
                    debug: {
                        requestedPath: pathToDelete,
                        resourceType: resourceType
                    }
                }, { status: 404 })
            }
            
            return NextResponse.json({
                success: true,
                message: 'File deleted successfully'
            })
        } catch (error) {
            console.error('Local storage delete error:', error)
            return NextResponse.json(
                { 
                    success: false, 
                    message: `Error deleting file: ${error.message}`,
                    debug: {
                        error: error.message,
                        stack: error.stack,
                        path: pathToDelete
                    }
                },
                { status: 500 }
            )
        }
    } catch (error) {
        console.error('Error deleting file:', error)
        return NextResponse.json(
            { success: false, message: error.message || 'Error deleting file' },
            { status: 500 }
        )
    }
}
