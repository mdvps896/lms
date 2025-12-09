import mongoose from 'mongoose';
import Category from './Category.js';

const questionSchema = new mongoose.Schema(
    text: { type: String, default: '' },
    image: { type: String, default: '' }, // URL or path to image
    isCorrect: { type: Boolean, default: false },
    order: { type: Number, default: 0 }
});

const questionSchema = new mongoose.Schema({
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
    questionGroup: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuestionGroup',
        required: [true, 'Question Group is required']
    },
    type: {
        type: String,
        enum: ['mcq', 'multiple_choice', 'true_false', 'short_answer', 'long_answer'],
        required: [true, 'Question type is required']
    },
    questionText: {
        type: String,
        required: [true, 'Question text is required']
    },
    marks: {
        type: Number,
        required: [true, 'Marks are required'],
        min: 0
    },
    tips: {
        type: String,
        default: ''
    },
    wordLimit: {
        type: Number,
        default: 0
    },
    hasImageOptions: {
        type: Boolean,
        default: false
    },
    options: [optionSchema],
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true
});

export default mongoose.models.Question || mongoose.model('Question', questionSchema);
