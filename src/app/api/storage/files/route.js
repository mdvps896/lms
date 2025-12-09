import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

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
                const relativePath = filePath.replace(path.join(process.cwd(), 'public'), '')
                arrayOfFiles.push({
                    name: file,
                    path: relativePath.replace(/\\/g, '/'),
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
        const publicDir = path.join(process.cwd(), 'public')
        
        // Get all files from public directory
        const allFiles = getAllFiles(publicDir)

        return NextResponse.json({
            success: true,
            files: allFiles,
            count: allFiles.length
        })
    } catch (error) {
        console.error('Error fetching files:', error)
        return NextResponse.json(
            { success: false, message: 'Error fetching files' },
            { status: 500 }
        )
    }
}
