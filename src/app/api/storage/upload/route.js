import { NextResponse } from 'next/server'
import path from 'path'
import { saveToLocalStorage } from '@/utils/localStorage'
import { getAuthenticatedUser } from '@/utils/apiAuth'

export const dynamic = 'force-dynamic'
export const maxDuration = 300; // Increase timeout to 5 minutes

export async function POST(request) {
    try {
        const currentUser = await getAuthenticatedUser(request)
        if (!currentUser) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get('file')
        const folder = formData.get('folder') || ''
        const fileUrl = formData.get('fileUrl')

        // 🔒 SECURITY: Server-side fetch of an arbitrary client-supplied URL is an
        // SSRF primitive — restrict it to admins only.
        if (fileUrl && currentUser.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
        }

        let fileData;
        let fileName;

        if (fileUrl) {
            // Handle URL upload
            try {
                const response = await fetch(fileUrl)
                const blob = await response.blob()
                const buffer = Buffer.from(await blob.arrayBuffer())
                fileData = buffer
                fileName = path.basename(new URL(fileUrl).pathname) || `file_${Date.now()}`
            } catch (error) {
                return NextResponse.json(
                    { success: false, message: 'Failed to download file from URL' },
                    { status: 400 }
                )
            }
        } else if (file) {
            // Handle file upload
            const bytes = await file.arrayBuffer()
            const buffer = Buffer.from(bytes)
            fileData = buffer
            fileName = file.name
        } else {
            return NextResponse.json(
                { success: false, message: 'No file provided' },
                { status: 400 }
            )
        }
        try {
            const result = await saveToLocalStorage(fileData, folder, fileName)

            if (!result.success) {
                return NextResponse.json(
                    { success: false, message: result.message || 'Storage failed' },
                    { status: 500 }
                )
            }

            return NextResponse.json({
                success: true,
                message: 'File uploaded successfully',
                path: result.url, // Return full URL
                url: result.url, // Alias for mobile app compatibility
                fileName: result.fileName, // This is the public_id
                originalName: result.originalName,
                size: result.size,
                mimeType: result.mimeType,
                local: true,
                publicId: result.publicId
            })
        } catch (error) {
            console.error('Local upload error:', {
                message: error.message,
                stack: error.stack,
                fileName: fileName,
                folder: folder
            })
            return NextResponse.json(
                { success: false, message: `Failed to upload: ${error.message}` },
                { status: 500 }
            )
        }
    } catch (error) {
        console.error('Error uploading file:', error)
        return NextResponse.json(
            { success: false, message: 'Error uploading file' },
            { status: 500 }
        )
    }
}
