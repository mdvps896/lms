import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import fs from 'fs'

export async function POST(request) {
    try {
        const formData = await request.formData()
        const file = formData.get('file')
        const folder = formData.get('folder') || ''
        const fileUrl = formData.get('fileUrl')

        // Handle URL upload
        if (fileUrl) {
            try {
                const response = await fetch(fileUrl)
                const blob = await response.blob()
                const buffer = Buffer.from(await blob.arrayBuffer())
                
                const fileName = path.basename(new URL(fileUrl).pathname)
                const uploadDir = path.join(process.cwd(), 'public', folder)
                
                // Ensure directory exists
                if (!fs.existsSync(uploadDir)) {
                    await mkdir(uploadDir, { recursive: true })
                }

                const filePath = path.join(uploadDir, fileName)
                await writeFile(filePath, buffer)

                return NextResponse.json({
                    success: true,
                    message: 'File uploaded from URL successfully',
                    path: `/${folder}/${fileName}`.replace(/\/\//g, '/')
                })
            } catch (error) {
                return NextResponse.json(
                    { success: false, message: 'Failed to download file from URL' },
                    { status: 400 }
                )
            }
        }

        // Handle file upload
        if (!file) {
            return NextResponse.json(
                { success: false, message: 'No file provided' },
                { status: 400 }
            )
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Define upload directory
        const uploadDir = path.join(process.cwd(), 'public', folder)
        
        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true })
        }

        const filePath = path.join(uploadDir, file.name)
        await writeFile(filePath, buffer)

        return NextResponse.json({
            success: true,
            message: 'File uploaded successfully',
            path: `/${folder}/${file.name}`.replace(/\/\//g, '/')
        })
    } catch (error) {
        console.error('Error uploading file:', error)
        return NextResponse.json(
            { success: false, message: 'Error uploading file' },
            { status: 500 }
        )
    }
}
