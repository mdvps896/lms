import mongoose from 'mongoose';

const FreeMaterialSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    type: {
        type: String,
        enum: ['document', 'video', 'test'],
        default: 'document'
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Please select a category']
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        default: null // null implies "All subjects within the category"
    },
    files: [{
        title: { type: String, required: true },
        url: { type: String, required: true },
        publicId: { type: String }, // For Cloudinary
        type: { type: String, default: 'file' }, // 'pdf', 'video', 'image', 'other'
        size: { type: Number }
    }],
    testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        default: null // Only for type='test'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.models.FreeMaterial || mongoose.model('FreeMaterial', FreeMaterialSchema);
