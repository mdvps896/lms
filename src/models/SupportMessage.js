import mongoose from 'mongoose';

const supportMessageSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        default: ''
    },
    images: [{
        type: String // URLs to images
    }],
    isAdmin: {
        type: Boolean,
        default: false
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for performance
supportMessageSchema.index({ user: 1, createdAt: -1 });

export default mongoose.models.SupportMessage || mongoose.model('SupportMessage', supportMessageSchema);
