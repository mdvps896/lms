import mongoose from 'mongoose';

// Delete any cached model to ensure fresh schema is used
delete mongoose.models.ExamAttempt;

const examAttemptSchema = new mongoose.Schema({
    exam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sessionToken: {
        type: String,
        required: true,
        unique: true
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    submittedAt: {
        type: Date
    },
    status: {
        type: String,
        enum: ['active', 'submitted', 'expired', 'terminated'],
        default: 'active'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    answers: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    },
    score: {
        type: Number
    },
    totalMarks: {
        type: Number
    },
    percentage: {
        type: Number
    },
    // Recording information
    recordings: {
        cameraVideo: {
            type: String
        },
        screenVideo: {
            type: String
        },
        recordedAt: {
            type: Date
        }
    },
    // Verification data
    verification: {
        faceVerification: {
            enabled: { type: Boolean, default: false },
            verified: { type: Boolean, default: false },
            selfieImage: { type: String }, // Base64 or URL
            capturedAt: { type: Date },
            verificationScore: { type: Number }, // Similarity score
            periodicChecks: [{
                capturedAt: { type: Date },
                selfieImage: { type: String },
                verificationScore: { type: Number },
                warning: { type: Boolean, default: false },
                warningReason: { type: String }
            }]
        },
        identityVerification: {
            enabled: { type: Boolean, default: false },
            verified: { type: Boolean, default: false },
            identityImage: { type: String }, // Profile image or uploaded ID
            verifiedAt: { type: Date },
            documentType: { type: String } // 'profile' or 'uploaded'
        }
    },
    // Proctoring data
    warnings: [{
        message: String,
        type: {
            type: String,
            enum: ['tab-switch', 'screenshot', 'admin', 'system']
        },
        sentAt: {
            type: Date,
            default: Date.now
        }
    }],
    tabSwitchCount: {
        type: Number,
        default: 0
    },
    screenshotAttempts: {
        type: Number,
        default: 0
    },
    // Chat functionality
    chatMessages: [{
        sender: {
            type: String,
            enum: ['admin', 'student'],
            required: true
        },
        message: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        read: {
            type: Boolean,
            default: false
        }
    }],
    chatBlocked: {
        type: Boolean,
        default: false
    },
    // Submission details
    forceSubmitted: {
        type: Boolean,
        default: false
    },
    forceSubmittedBy: {
        type: String
    },
    autoSubmitted: {
        type: Boolean,
        default: false
    },
    autoSubmitReason: {
        type: String
    },
    // Browser and device info
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    browserInfo: {
        name: String,
        version: String,
        os: String
    },
    // Admin modifications
    modifiedBy: {
        type: String // Email of admin/teacher who modified
    },
    modifiedAt: {
        type: Date
    },
    // Manual marks assigned by admin (answer._id => marks)
    manualMarks: {
        type: Map,
        of: Number,
        default: {}
    },
    // Result status for subjective questions
    resultStatus: {
        type: String,
        enum: ['published', 'draft'],
        default: 'published'
    },
    hasSubjectiveQuestions: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for better query performance
examAttemptSchema.index({ exam: 1, user: 1 });
examAttemptSchema.index({ status: 1, isActive: 1 });
// sessionToken index already created by unique:true in schema field definition

// Export fresh model
export default mongoose.model('ExamAttempt', examAttemptSchema);
