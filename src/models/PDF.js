import mongoose from 'mongoose';

const pdfSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    }],
    fileUrl: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    totalPages: {
        type: Number,
        default: 0
    },
    thumbnailUrl: {
        type: String
    },
    isPremium: {
        type: Boolean,
        default: false
    },
    price: {
        type: Number,
        default: 0 // Price in rupees (0 for free)
    },
    description: {
        type: String
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // New fields for access control
    accessType: {
        type: String,
        enum: ['global', 'course', 'user'],
        default: 'global',
        required: true
    },
    assignedCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }],
    assignedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    purchasedBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        purchasedAt: {
            type: Date,
            default: Date.now
        },
        amount: {
            type: Number,
            default: 0
        }
    }]
}, {
    timestamps: true
});

// Index for faster queries
pdfSchema.index({ accessType: 1, isPremium: 1 });
pdfSchema.index({ assignedCourses: 1 });
pdfSchema.index({ assignedUsers: 1 });
pdfSchema.index({ 'purchasedBy.user': 1 });

const PDF = mongoose.models.PDF || mongoose.model('PDF', pdfSchema);

export default PDF;
