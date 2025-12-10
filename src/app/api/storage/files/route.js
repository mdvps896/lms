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
        
        // Get exam recordings
        const examRecordings = await getExamRecordings()

        // Merge all sources
        const allFiles = [...localFiles, ...cloudinaryFiles, ...examRecordings]

        return NextResponse.json({
            success: true,
            files: allFiles,
            count: allFiles.length,
            sources: {
                local: localFiles.length,
                cloudinary: cloudinaryFiles.length,
                examRecordings: examRecordings.length
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
 * Get exam recordings from database
 */
async function getExamRecordings() {
    try {
        // Import models
        const ExamAttempt = (await import('@/models/ExamAttempt')).default
        const Exam = (await import('@/models/Exam')).default
        const User = (await import('@/models/User')).default
        
        const recordings = []
        
        // Get recordings from ExamAttempt collection
        const attempts = await ExamAttempt.find({
            $or: [
                { 'recordings.cameraVideo': { $exists: true, $ne: null, $ne: '' } },
                { 'recordings.screenVideo': { $exists: true, $ne: null, $ne: '' } }
            ]
        })
        .populate('user', 'name email')
        .populate('exam', 'name')
        .lean()
        
        for (const attempt of attempts) {
            const user = attempt.user || { name: 'Unknown User', email: 'N/A' }
            const exam = attempt.exam || { name: 'Unknown Exam' }
            
            if (attempt.recordings?.cameraVideo) {
                // Extract publicId from Cloudinary URL for deletion
                let cameraPublicId = null
                if (attempt.recordings.cameraVideo.includes('cloudinary')) {
                    const urlParts = attempt.recordings.cameraVideo.split('/')
                    const filenamePart = urlParts[urlParts.length - 1]
                    cameraPublicId = filenamePart.split('.')[0]
                    // If it includes folder, get the full path
                    const folderIndex = urlParts.indexOf('exam-recordings')
                    if (folderIndex !== -1 && folderIndex < urlParts.length - 1) {
                        cameraPublicId = urlParts.slice(folderIndex).join('/').split('.')[0]
                    }
                }
                
                recordings.push({
                    name: `📹 Camera Recording - ${exam.name} (${user.name})`,
                    originalName: `Camera-${exam.name}-${user.name}-${attempt._id}.webm`,
                    path: attempt.recordings.cameraVideo,
                    fullPath: attempt.recordings.cameraVideo,
                    publicId: cameraPublicId,
                    cloudinaryId: cameraPublicId,
                    size: 0, // Size not available from URL
                    createdAt: attempt.createdAt || new Date(),
                    modifiedAt: attempt.updatedAt || new Date(),
                    type: 'video',
                    resourceType: 'video',
                    source: attempt.recordings.cameraVideo.includes('cloudinary') ? 'cloudinary' : 'local',
                    category: 'exam-recording',
                    recordingType: 'camera',
                    examName: exam.name,
                    studentName: user.name,
                    attemptId: attempt._id,
                    recordingId: attempt.recordings.cameraRecordingId,
                    cameraRecordingId: attempt.recordings.cameraRecordingId,
                    folder: 'exam-recordings'
                })
            }
            
            if (attempt.recordings?.screenVideo) {
                // Extract publicId from Cloudinary URL for deletion
                let screenPublicId = null
                if (attempt.recordings.screenVideo.includes('cloudinary')) {
                    const urlParts = attempt.recordings.screenVideo.split('/')
                    const filenamePart = urlParts[urlParts.length - 1]
                    screenPublicId = filenamePart.split('.')[0]
                    // If it includes folder, get the full path
                    const folderIndex = urlParts.indexOf('exam-recordings')
                    if (folderIndex !== -1 && folderIndex < urlParts.length - 1) {
                        screenPublicId = urlParts.slice(folderIndex).join('/').split('.')[0]
                    }
                }
                
                recordings.push({
                    name: `🖥️ Screen Recording - ${exam.name} (${user.name})`,
                    originalName: `Screen-${exam.name}-${user.name}-${attempt._id}.webm`,
                    path: attempt.recordings.screenVideo,
                    fullPath: attempt.recordings.screenVideo,
                    publicId: screenPublicId,
                    cloudinaryId: screenPublicId,
                    size: 0, // Size not available from URL
                    createdAt: attempt.createdAt || new Date(),
                    modifiedAt: attempt.updatedAt || new Date(),
                    type: 'video',
                    resourceType: 'video',
                    source: attempt.recordings.screenVideo.includes('cloudinary') ? 'cloudinary' : 'local',
                    category: 'exam-recording',
                    recordingType: 'screen',
                    examName: exam.name,
                    studentName: user.name,
                    attemptId: attempt._id,
                    recordingId: attempt.recordings.screenRecordingId,
                    screenRecordingId: attempt.recordings.screenRecordingId,
                    folder: 'exam-recordings'
                })
            }
        }
        
        // Also check embedded attempts in Exam collection
        const examsWithAttempts = await Exam.find({
            'attempts.recordings': { $exists: true }
        }).lean()
        
        for (const exam of examsWithAttempts) {
            if (exam.attempts) {
                for (const attempt of exam.attempts) {
                    if (attempt.recordings?.cameraVideo || attempt.recordings?.screenVideo) {
                        // Get user info
                        const user = await User.findById(attempt.userId).select('name email').lean()
                        const userName = user?.name || 'Unknown User'
                        
                        if (attempt.recordings.cameraVideo) {
                            const existingCamera = recordings.find(r => 
                                r.attemptId === attempt._id.toString() && r.recordingType === 'camera'
                            )
                            
                            if (!existingCamera) {
                                recordings.push({
                                    name: `Camera-${exam.name}-${userName}-${attempt._id}.webm`,
                                    path: attempt.recordings.cameraVideo,
                                    fullPath: attempt.recordings.cameraVideo,
                                    size: 0,
                                    createdAt: attempt.submittedAt || attempt.startTime || new Date(),
                                    modifiedAt: attempt.submittedAt || attempt.startTime || new Date(),
                                    type: 'video',
                                    source: attempt.recordings.cameraVideo.includes('cloudinary') ? 'cloudinary' : 'local',
                                    category: 'exam-recording',
                                    recordingType: 'camera',
                                    examName: exam.name,
                                    studentName: userName,
                                    attemptId: attempt._id.toString(),
                                    recordingId: attempt.recordings.cameraRecordingId,
                                    cameraRecordingId: attempt.recordings.cameraRecordingId,
                                    folder: 'exam-recordings'
                                })
                            }
                        }
                        
                        if (attempt.recordings.screenVideo) {
                            const existingScreen = recordings.find(r => 
                                r.attemptId === attempt._id.toString() && r.recordingType === 'screen'
                            )
                            
                            if (!existingScreen) {
                                recordings.push({
                                    name: `Screen-${exam.name}-${userName}-${attempt._id}.webm`,
                                    path: attempt.recordings.screenVideo,
                                    fullPath: attempt.recordings.screenVideo,
                                    size: 0,
                                    createdAt: attempt.submittedAt || attempt.startTime || new Date(),
                                    modifiedAt: attempt.submittedAt || attempt.startTime || new Date(),
                                    type: 'video',
                                    source: attempt.recordings.screenVideo.includes('cloudinary') ? 'cloudinary' : 'local',
                                    category: 'exam-recording',
                                    recordingType: 'screen',
                                    examName: exam.name,
                                    studentName: userName,
                                    attemptId: attempt._id.toString(),
                                    recordingId: attempt.recordings.screenRecordingId,
                                    screenRecordingId: attempt.recordings.screenRecordingId,
                                    folder: 'exam-recordings'
                                })
                            }
                        }
                    }
                }
            }
        }
        
        console.log(`Found ${recordings.length} exam recordings`)
        return recordings
        
    } catch (error) {
        console.error('Error fetching exam recordings:', error)
        return []
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
                        let displayName = `${fileName}.${ext}`
                        let category = 'file'
                        
                        // Better labeling for exam recordings
                        if (fileName.includes('camera-')) {
                            displayName = `📹 Camera Recording - ${fileName.replace('camera-', '').replace(/\d{13}-\d+/g, 'Exam').replace('.webm', '')}.${ext}`
                            category = 'exam-camera'
                        } else if (fileName.includes('screen-')) {
                            displayName = `🖥️ Screen Recording - ${fileName.replace('screen-', '').replace(/\d{13}-\d+/g, 'Exam').replace('.webm', '')}.${ext}`
                            category = 'exam-screen'
                        } else if (resource.public_id.includes('exam-recordings/')) {
                            displayName = `🎥 Exam Recording - ${fileName}.${ext}`
                            category = 'exam-recording'
                        }
                        
                        cloudinaryFiles.push({
                            name: displayName,
                            originalName: `${fileName}.${ext}`,
                            path: resource.secure_url,
                            publicId: resource.public_id,
                            fullPath: resource.secure_url,
                            size: resource.bytes,
                            createdAt: new Date(resource.created_at),
                            modifiedAt: new Date(resource.created_at),
                            type: getFileType(`${fileName}.${ext}`),
                            category: category,
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
