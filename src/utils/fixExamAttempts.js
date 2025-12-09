/**
 * Fix Script: Remove maxAttempts validation from existing exams
 * 
 * This script updates all exams to ensure maxAttempts values are valid
 * 
 * Usage: node src/utils/fixExamAttempts.js
 */

import mongoose from 'mongoose'
import connectDB from '../lib/mongodb.js'
import Exam from '../models/Exam.js'

async function fixExamAttempts() {
    try {
        console.log('🔧 Starting fix for exam maxAttempts...')
        
        await connectDB()
        
        // Get all exams
        const exams = await Exam.find({})
        console.log(`📊 Found ${exams.length} exams`)
        
        let fixedCount = 0
        
        for (const exam of exams) {
            let needsUpdate = false
            
            // Fix maxAttempts if it's null or undefined
            if (exam.maxAttempts === null || exam.maxAttempts === undefined) {
                exam.maxAttempts = -1 // Set to unlimited
                needsUpdate = true
            }
            
            // If maxAttempts is 0, change to unlimited
            if (exam.maxAttempts === 0) {
                exam.maxAttempts = -1
                needsUpdate = true
            }
            
            if (needsUpdate) {
                await exam.save({ validateBeforeSave: false })
                fixedCount++
                console.log(`✅ Fixed exam: ${exam.name} - maxAttempts: ${exam.maxAttempts}`)
            }
        }
        
        console.log(`\n✨ Fixed ${fixedCount} exam(s)`)
        console.log('✅ All exams are now compatible with new schema!')

    } catch (error) {
        console.error('❌ Fix failed:', error)
        throw error
    } finally {
        await mongoose.connection.close()
    }
}

// Run fix
if (import.meta.url === `file://${process.argv[1]}`) {
    fixExamAttempts()
        .then(() => process.exit(0))
        .catch(err => {
            console.error(err)
            process.exit(1)
        })
}

export default fixExamAttempts
