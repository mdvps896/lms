import mongoose from 'mongoose';
import Category from './Category.js';

const questionGroupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Group name is required'],
        trim: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required']
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: [true, 'Subject is required']
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    questionLimit: {
        type: Number,
        default: null, // null or 0 means unlimited
        min: 0
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true
});

export default mongoose.models.QuestionGroup || mongoose.model('QuestionGroup', questionGroupSchema);
