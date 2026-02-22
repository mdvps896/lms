import mongoose from 'mongoose';

if (process.env.NODE_ENV !== 'production') {
    delete mongoose.models.Notification;
}

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
        enum: ['exam_created', 'exam_started', 'exam_ended', 'exam_updated', 'course_purchase', 'general', 'new_user_registration', 'new_blog'],
        required: true,
    },
    targetRole: { // 'admin', 'student' etc. - useful for broadcasting
        type: String,
        default: null
    },
    data: {
        type: mongoose.Schema.Types.Mixed, // Changed from Map to Mixed to support any object structure
        default: {}
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