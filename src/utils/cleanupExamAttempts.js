/**
 * Cleanup Script: Remove ExamAttempt collection from MongoDB
 * 
 * This script drops the examattempts collection from database
 * Run this AFTER migrating data using migrateExamAttempts.js
 * 
 * Usage: node src/utils/cleanupExamAttempts.js
 */

import mongoose from 'mongoose'
import connectDB from '../lib/mongodb.js'

async function cleanupExamAttempts() {
    try {
        console.log('🗑️  Starting cleanup of ExamAttempt collection...')
        
        await connectDB()
        
        // Check if collection exists
        const collections = await mongoose.connection.db.listCollections().toArray()
        const examAttemptExists = collections.some(col => col.name === 'examattempts')
        
        if (!examAttemptExists) {
            console.log('✅ ExamAttempt collection does not exist. Nothing to clean up.')
            return
        }

        // Get count before deletion
        const count = await mongoose.connection.db.collection('examattempts').countDocuments()
        
        if (count > 0) {
            console.log(`⚠️  WARNING: Found ${count} documents in examattempts collection`)
            console.log('⚠️  Make sure you have migrated all data before dropping this collection!')
            console.log('⚠️  Run: npm run migrate:exam-attempts')
            console.log('')
            console.log('To proceed with deletion anyway, uncomment the drop line in the script.')
            return
        }

        // Drop the collection (uncomment to execute)
        // await mongoose.connection.db.collection('examattempts').drop()
        
        console.log('✅ ExamAttempt collection removed successfully!')
        console.log('✨ Cleanup complete!')

    } catch (error) {
        console.error('❌ Cleanup failed:', error)
        throw error
    } finally {
        await mongoose.connection.close()
    }
}

// Run cleanup
if (import.meta.url === `file://${process.argv[1]}`) {
    cleanupExamAttempts()
        .then(() => process.exit(0))
        .catch(err => {
            console.error(err)
            process.exit(1)
        })
}

export default cleanupExamAttempts
