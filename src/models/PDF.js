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
    description: {
        type: String
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

const PDF = mongoose.models.PDF || mongoose.model('PDF', pdfSchema);

export default PDF;
