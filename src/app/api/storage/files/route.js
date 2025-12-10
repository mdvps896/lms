import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import connectDB from '@/lib/mongodb'
import Settings from '@/models/Settings'
// Local storage only - no cloud dependencies needed

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

        // No cloud files - local storage only
        const cloudinaryFiles = []
        
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
                local: localFiles.length,
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
                recordings.push({
                    name: `📹 Camera Recording - ${exam.name} (${user.name})`,
                    originalName: `Camera-${exam.name}-${user.name}-${attempt._id}.webm`,
                    path: attempt.recordings.cameraVideo,
                    fullPath: attempt.recordings.cameraVideo,
                    size: 0, // Size not available from URL
                    createdAt: attempt.createdAt || new Date(),
                    modifiedAt: attempt.updatedAt || new Date(),
                    type: 'video',
                    resourceType: 'video',
                    source: 'local',
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
                recordings.push({
                    name: `🖥️ Screen Recording - ${exam.name} (${user.name})`,
                    originalName: `Screen-${exam.name}-${user.name}-${attempt._id}.webm`,
                    path: attempt.recordings.screenVideo,
                    fullPath: attempt.recordings.screenVideo,
                    size: 0, // Size not available from URL
                    createdAt: attempt.createdAt || new Date(),
                    modifiedAt: attempt.updatedAt || new Date(),
                    type: 'video',
                    resourceType: 'video',
                    source: 'local',
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
                                    source: 'local',
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
                                    source: 'local',
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
 * Local storage only - no cloud dependencies
 */
// No cloud functions needed - using local storage only
