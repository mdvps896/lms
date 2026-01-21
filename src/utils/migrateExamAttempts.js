/**
 * Migration Script: Move ExamAttempt data to Exam.attempts
 * 
 * This script migrates all exam attempts from the separate ExamAttempt collection
 * to the attempts array within the Exam model.
 * 
 * Usage: node src/utils/migrateExamAttempts.js
 */

const mongoose = require('mongoose')
const connectDB = require('../lib/mongodb.js').default

// Define old ExamAttempt schema for migration
const ExamAttemptSchema = new mongoose.Schema({
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sessionToken: { type: String, required: true },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    status: { 
        type: String, 
        enum: ['active', 'submitted', 'expired'], 
        default: 'active' 
    },
    answers: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
    submittedAt: { type: Date },
    ipAddress: { type: String },
    userAgent: { type: String },
    recordings: [{
        filename: String,
        type: { type: String, enum: ['video', 'audio', 'screen'] },
        timestamp: { type: Date, default: Date.now },
        size: Number
    }],
    score: { type: Number },
    totalMarks: { type: Number },
    isActive: { type: Boolean, default: true }
}, { timestamps: true })

const ExamAttempt = mongoose.models.ExamAttempt || mongoose.model('ExamAttempt', ExamAttemptSchema)

async function migrateExamAttempts() {
    try {
        await connectDB()
        
        // Get all exam attempts
        const allAttempts = await ExamAttempt.find({})
        if (allAttempts.length === 0) {
            return
        }

        // Group attempts by examId
        const attemptsByExam = {}
        allAttempts.forEach(attempt => {
            const examId = attempt.examId.toString()
            if (!attemptsByExam[examId]) {
                attemptsByExam[examId] = []
            }
            attemptsByExam[examId].push(attempt)
        })

        let successCount = 0
        let errorCount = 0
        const errors = []

        // Process each exam
        for (const [examId, attempts] of Object.entries(attemptsByExam)) {
            try {
                const exam = await Exam.findById(examId)
                
                if (!exam) {
                    errorCount += attempts.length
                    errors.push({ examId, reason: 'Exam not found', attemptsCount: attempts.length })
                    continue
                }

                // Add each attempt to exam
                attempts.forEach(attempt => {
                    exam.attempts.push({
                        userId: attempt.userId,
                        sessionToken: attempt.sessionToken,
                        startTime: attempt.startTime,
                        endTime: attempt.endTime,
                        status: attempt.status,
                        answers: attempt.answers,
                        submittedAt: attempt.submittedAt,
                        ipAddress: attempt.ipAddress,
                        userAgent: attempt.userAgent,
                        recordings: attempt.recordings || [],
                        score: attempt.score,
                        totalMarks: attempt.totalMarks,
                        isActive: attempt.isActive
                    })
                })

                await exam.save()
                successCount += attempts.length
                } catch (error) {
                console.error(`❌ Error migrating attempts for exam ${examId}:`, error.message)
                errorCount += attempts.length
                errors.push({ examId, reason: error.message, attemptsCount: attempts.length })
            }
        }

        if (errors.length > 0) {
            errors.forEach(err => {
                `)
            })
        }

        if (successCount > 0) {
            in MongoDB')
        }

        } catch (error) {
        console.error('❌ Migration failed:', error)
        throw error
    } finally {
        await mongoose.connection.close()
    }
}

// Run migration
if (import.meta.url === `file://${process.argv[1]}`) {
    migrateExamAttempts()
        .then(() => process.exit(0))
        .catch(err => {
            console.error(err)
            process.exit(1)
        })
}

export default migrateExamAttempts
