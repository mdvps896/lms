import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import fs from 'fs'
import { uploadToCloudinary, getCloudinaryStatus } from '@/utils/cloudinary'

export async function POST(request) {
    try {
        const formData = await request.formData()
        const file = formData.get('file')
        const folder = formData.get('folder') || ''
        const fileUrl = formData.get('fileUrl')

        // Check if Cloudinary is enabled
        const cloudinaryStatus = await getCloudinaryStatus()

        if (cloudinaryStatus.enabled && cloudinaryStatus.configured) {
            // Use Cloudinary
            let base64File;
            let fileName;

            if (fileUrl) {
                // Handle URL upload
                try {
                    const response = await fetch(fileUrl)
                    const blob = await response.blob()
                    const buffer = Buffer.from(await blob.arrayBuffer())
                    const base64 = buffer.toString('base64')
                    const mimeType = blob.type || 'image/jpeg'
                    base64File = `data:${mimeType};base64,${base64}`
                    fileName = path.basename(new URL(fileUrl).pathname)
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
                const mimeType = file.type || 'image/jpeg'
                base64File = `data:${mimeType};base64,${base64}`
                fileName = file.name
            } else {
                return NextResponse.json(
                    { success: false, message: 'No file provided' },
                    { status: 400 }
                )
            }

            try {
                const result = await uploadToCloudinary(base64File, folder)
                return NextResponse.json({
                    success: true,
                    message: 'File uploaded to Cloudinary successfully',
                    path: result.url,
                    publicId: result.publicId,
                    cloudinary: true
                })
            } catch (error) {
                console.error('Cloudinary upload error:', error)
                return NextResponse.json(
                    { success: false, message: 'Failed to upload to Cloudinary' },
                    { status: 500 }
                )
            }
        }

        // Fallback to local storage (for development)
        if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
            return NextResponse.json(
                { success: false, message: 'Local file storage not supported in production. Please enable Cloudinary in Settings.' },
                { status: 400 }
            )
        }

        // Handle URL upload (local)
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
