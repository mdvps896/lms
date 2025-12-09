import mongoose from 'mongoose';
import Category from './Category.js';

// Delete any cached model to ensure fresh schema is used
delete mongoose.models.Exam;

const examSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Exam name is required'] },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: [true, 'Category is required'] },
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
    questionGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'QuestionGroup' }],
    type: { type: String, enum: ['live', 'regular'], required: true },
    startDate: { type: Date, required: [true, 'Start date is required'] },
    duration: { type: Number, required: [true, 'Duration is required'] }, // in minutes
    endDate: { type: Date, required: [true, 'End date is required'] },
    description: { type: String, default: '' },
    instructions: { type: String, default: '' },
    totalMarks: { type: Number, required: [true, 'Total marks are required'] },
    passingPercentage: { type: Number, required: [true, 'Passing percentage is required'] },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', trim: true },
    maxAttempts: { type: Number, default: -1 }, // -1 means unlimited attempts, any positive number for limited attempts
    shuffleQuestions: { type: Boolean, default: false },
    settings: {
        allowMic: { type: Boolean, default: false },
        allowCam: { type: Boolean, default: false },
        allowScreenShare: { type: Boolean, default: false },
        allowTabSwitch: { type: Boolean, default: false },
        maxTabSwitches: { type: Number, default: 3 },
        allowCopyPaste: { type: Boolean, default: false },
        watermark: {
            enabled: { type: Boolean, default: true },
            text: { type: String, default: '' }, // Empty means use student name
            quantity: { type: Number, default: 20 },
            fontSize: { type: Number, default: 24 }
        },
        faceVerification: {
            enabled: { type: Boolean, default: false },
            required: { type: Boolean, default: false },
            intervalCheck: { type: Number, default: 0 } // 0 means only at start, otherwise interval in minutes
        },
        identityVerification: {
            enabled: { type: Boolean, default: false },
            required: { type: Boolean, default: false },
            useProfileImage: { type: Boolean, default: true } // If true, use profile image instead of selfie
        }
    },
    assignedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // Exam Attempts stored within exam document
    attempts: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        sessionToken: { type: String, required: true },
        startTime: { type: Date, default: Date.now },
        endTime: { type: Date },
        status: {
            type: String,
            enum: ['active', 'submitted', 'expired'],
            default: 'active',
            trim: true
        },
        answers: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
        submittedAt: { type: Date },
        ipAddress: { type: String },
        userAgent: { type: String },
        recordings: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        chatMessages: [{
            sender: { type: String, enum: ['admin', 'student'], required: true },
            message: { type: String, required: true },
            timestamp: { type: Date, default: Date.now },
            read: { type: Boolean, default: false }
        }],
        chatBlocked: { type: Boolean, default: false },
        score: { type: Number },
        totalMarks: { type: Number },
        isActive: { type: Boolean, default: true }
    }]
}, { timestamps: true });

// Export fresh model
export default mongoose.model('Exam', examSchema);
