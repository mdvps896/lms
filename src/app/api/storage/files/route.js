import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import connectDB from '@/lib/mongodb'
import Settings from '@/models/Settings'
import { v2 as cloudinary } from 'cloudinary'

// Helper function to get all files recursively
function getAllFiles(dirPath, arrayOfFiles = []) {
    try {
        const files = fs.readdirSync(dirPath)

        files.forEach((file) => {
            const filePath = path.join(dirPath, file)
            
            if (fs.statSync(filePath).isDirectory()) {
                arrayOfFiles = getAllFiles(filePath, arrayOfFiles)
            } else {
                const stats = fs.statSync(filePath)
                let relativePath = filePath.replace(path.join(process.cwd(), 'public'), '')
                relativePath = relativePath.replace(/\\/g, '/')
                // Ensure path starts with /
                if (!relativePath.startsWith('/')) {
                    relativePath = '/' + relativePath
                }
                arrayOfFiles.push({
                    name: file,
                    path: relativePath,
                    fullPath: filePath,
                    size: stats.size,
                    createdAt: stats.birthtime,
                    modifiedAt: stats.mtime,
                    type: getFileType(file)
                })
            }
        })

        return arrayOfFiles
    } catch (error) {
        console.error('Error reading directory:', error)
        return arrayOfFiles
    }
}

function getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico'].includes(ext)) return 'image'
    if (['mp4', 'webm', 'avi', 'mov', 'mkv'].includes(ext)) return 'video'
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return 'audio'
    if (['pdf'].includes(ext)) return 'pdf'
    if (['doc', 'docx', 'txt', 'md'].includes(ext)) return 'document'
    return 'other'
}

export async function GET() {
    try {
        await connectDB()
        
        // Get local files
        const publicDir = path.join(process.cwd(), 'public')
        const localFiles = getAllFiles(publicDir)

        // Get Cloudinary files
        const cloudinaryFiles = await getCloudinaryFiles()

        // Merge both sources
        const allFiles = [...localFiles, ...cloudinaryFiles]

        return NextResponse.json({
            success: true,
            files: allFiles,
            count: allFiles.length,
            sources: {
                local: localFiles.length,
                cloudinary: cloudinaryFiles.length
            }
        })
    } catch (error) {
        console.error('Error fetching files:', error)
        return NextResponse.json(
            { success: false, message: 'Error fetching files' },
            { status: 500 }
        )
    }
}

/**
 * Get all files from Cloudinary
 */
async function getCloudinaryFiles() {
    try {
        // Check if Cloudinary is configured
        const settings = await Settings.findOne()
        
        if (!settings?.integrations?.cloudinary?.enabled) {
            console.log('Cloudinary not enabled')
            return []
        }

        const { cloudName, apiKey, apiSecret } = settings.integrations.cloudinary

        if (!cloudName || !apiKey || !apiSecret) {
            console.log('Cloudinary credentials missing')
            return []
        }

        // Configure Cloudinary
        cloudinary.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
            secure: true
        })

        const cloudinaryFiles = []

        // Get all resources from Cloudinary (images, videos, raw files)
        const resourceTypes = ['image', 'video', 'raw']
        
        for (const resourceType of resourceTypes) {
            try {
                let hasMore = true
                let nextCursor = null

                while (hasMore) {
                    const result = await cloudinary.api.resources({
                        resource_type: resourceType,
                        type: 'upload',
                        max_results: 500,
                        next_cursor: nextCursor
                    })

                    result.resources.forEach(resource => {
                        const fileName = resource.public_id.split('/').pop()
                        const ext = resource.format
                        
                        cloudinaryFiles.push({
                            name: `${fileName}.${ext}`,
                            path: resource.secure_url,
                            publicId: resource.public_id,
                            fullPath: resource.secure_url,
                            size: resource.bytes,
                            createdAt: new Date(resource.created_at),
                            modifiedAt: new Date(resource.created_at),
                            type: getFileType(`${fileName}.${ext}`),
                            source: 'cloudinary',
                            resourceType: resource.resource_type,
                            format: resource.format,
                            width: resource.width,
                            height: resource.height,
                            folder: resource.public_id.includes('/') ? 
                                   resource.public_id.substring(0, resource.public_id.lastIndexOf('/')) : 
                                   'root'
                        })
                    })

                    nextCursor = result.next_cursor
                    hasMore = !!nextCursor
                }
            } catch (typeError) {
                console.log(`No resources found for type: ${resourceType}`)
            }
        }

        console.log(`Found ${cloudinaryFiles.length} files in Cloudinary`)
        return cloudinaryFiles

    } catch (error) {
        console.error('Error fetching Cloudinary files:', error)
        return []
    }
}
