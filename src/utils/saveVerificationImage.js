import fs from 'fs'
import path from 'path'

/**
 * Save verification image (face or ID card) to public folder
 * @param {string} base64Image - Base64 encoded image data
 * @param {string} type - Type of verification ('face' or 'identity')
 * @param {string} userId - User ID
 * @param {string} examId - Exam ID
 * @returns {string} - Relative path to saved image
 */
export const saveVerificationImage = (base64Image, type, userId, examId) => {
    try {
        if (!base64Image || !base64Image.includes('base64,')) {
            throw new Error('Invalid base64 image data')
        }

        // Extract base64 data
        const base64Data = base64Image.split('base64,')[1]
        const buffer = Buffer.from(base64Data, 'base64')

        // Create directory structure: public/verification/{type}/{examId}/
        const uploadDir = path.join(process.cwd(), 'public', 'verification', type, examId)
        
        // Create directories if they don't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true })
        }

        // Generate unique filename: userId_timestamp.jpg
        const timestamp = Date.now()
        const filename = `${userId}_${timestamp}.jpg`
        const filePath = path.join(uploadDir, filename)

        // Save file
        fs.writeFileSync(filePath, buffer)

        // Return relative path from public folder
        return `/verification/${type}/${examId}/${filename}`

    } catch (error) {
        console.error('Error saving verification image:', error)
        throw error
    }
}

/**
 * Delete verification image from public folder
 * @param {string} imagePath - Relative path to image
 */
export const deleteVerificationImage = (imagePath) => {
    try {
        if (!imagePath) return

        const fullPath = path.join(process.cwd(), 'public', imagePath)
        
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath)
        }
    } catch (error) {
        console.error('Error deleting verification image:', error)
    }
}
