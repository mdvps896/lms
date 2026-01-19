import mongoose from 'mongoose';

const selfieCaptureSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
        index: true
    },
    lectureId: {
        type: String,
        required: true
    },
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PDFViewSession',
        index: true
    },
    captureType: {
        type: String,
        enum: ['enrollment', 'pdf_initial', 'pdf_periodic'],
        required: true
    },
    imagePath: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    currentPage: {
        type: Number,
        default: 1
    },
    metadata: {
        deviceInfo: String,
        appVersion: String,
        ipAddress: String
    }
}, {
    timestamps: true
});

// Indexes for faster queries
selfieCaptureSchema.index({ user: 1, course: 1, createdAt: -1 });
selfieCaptureSchema.index({ sessionId: 1, createdAt: 1 });
selfieCaptureSchema.index({ user: 1, captureType: 1 });

const SelfieCapture = mongoose.models.SelfieCapture || mongoose.model('SelfieCapture', selfieCaptureSchema);

export default SelfieCapture;
