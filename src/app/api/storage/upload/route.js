import { NextResponse } from 'next/server'
import path from 'path'
import { saveToLocalStorage } from '@/utils/localStorage'

export async function POST(request) {
    try {
        const formData = await request.formData()
        const file = formData.get('file')
        const folder = formData.get('folder') || ''
        const fileUrl = formData.get('fileUrl')

        let fileData;
        let fileName;

        if (fileUrl) {
            // Handle URL upload
            try {
                const response = await fetch(fileUrl)
                const blob = await response.blob()
                const buffer = Buffer.from(await blob.arrayBuffer())
                const base64 = buffer.toString('base64')
                const mimeType = blob.type || 'image/jpeg'
                fileData = `data:${mimeType};base64,${base64}`
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
            const base64 = buffer.toString('base64')
            const mimeType = file.type || 'application/octet-stream'
            fileData = `data:${mimeType};base64,${base64}`
            fileName = file.name
        } else {
            return NextResponse.json(
                { success: false, message: 'No file provided' },
                { status: 400 }
            )
        }

        try {
            console.log('Uploading to local storage...')
            console.log('File name:', fileName)
            console.log('Folder:', folder)
            
            const result = await saveToLocalStorage(fileData, folder, fileName)
            console.log('Local storage upload successful:', result)
            
            return NextResponse.json({
                success: true,
                message: 'File uploaded successfully',
                path: result.url,
                fileName: result.fileName,
                originalName: result.originalName,
                size: result.size,
                mimeType: result.mimeType,
                local: true
            })
        } catch (error) {
            console.error('Local storage upload error:', {
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
