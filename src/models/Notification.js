import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['exam_created', 'exam_started', 'exam_ended', 'exam_updated', 'general'],
        required: true,
    },
    data: {
        examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
        examName: String,
        startTime: Date,
        endTime: Date,
        status: String,
    },
    recipients: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        read: { type: Boolean, default: false },
        readAt: Date,
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    },
}, {
    timestamps: true,
});

// Index for performance
notificationSchema.index({ 'recipients.userId': 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema);