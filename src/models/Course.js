import mongoose from 'mongoose';

const lectureSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['video', 'image', 'pdf'],
        required: true,
    },
    content: {
        type: String, // URL to the file
        required: true,
    },
    isDemo: {
        type: Boolean,
        default: false,
    },
});

const topicSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    lectures: [lectureSchema],
});

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null, // Null means applies to all categories
    },
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
    }],
    duration: {
        value: {
            type: Number,
            required: true,
        },
        unit: {
            type: String,
            enum: ['days', 'months', 'years'],
            required: true,
        },
    },
    thumbnail: {
        type: String, // URL
        required: true,
    },
    demoVideo: {
        type: String, // URL
        default: '',
    },
    price: { // The actual selling price (e.g., 1000)
        type: Number,
        default: 0,
    },
    originalPrice: { // The higher crossed-out price (e.g., 1500)
        type: Number,
        default: 0,
    },
    isFree: {
        type: Boolean,
        default: false,
    },
    gstEnabled: {
        type: Boolean,
        default: false,
    },
    gstPercentage: {
        type: Number,
        default: 18, // Default 18% GST
        min: 0,
        max: 100,
    },
    description: {
        type: String,
        default: '',
    },
    hasCertificate: {
        type: Boolean,
        default: false,
    },
    curriculum: [topicSchema],
    exams: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam', // Assuming your Exam model is named 'Exam'
    }],
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    ratings: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, required: true, min: 1, max: 5 },
        review: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now }
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isActive: {
        type: Boolean,
        default: true,
    },
    language: {
        type: String,
        default: 'English',
    }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Virtual field to calculate total lectures from curriculum
courseSchema.virtual('totalLectures').get(function () {
    if (!this.curriculum || this.curriculum.length === 0) return 0;
    return this.curriculum.reduce((total, topic) => {
        return total + (topic.lectures ? topic.lectures.length : 0);
    }, 0);
});

// Virtual field for totalLessons (alias for totalLectures)
courseSchema.virtual('totalLessons').get(function () {
    return this.totalLectures;
});

// Virtual field to calculate average rating
courseSchema.virtual('rating').get(function () {
    if (!this.ratings || this.ratings.length === 0) return 0;
    const sum = this.ratings.reduce((acc, r) => acc + r.rating, 0);
    return (sum / this.ratings.length).toFixed(1);
});

// Force model rebuild in dev to handle schema changes (like adding 'subjects')
if (process.env.NODE_ENV !== 'production') {
    delete mongoose.models.Course;
}

export default mongoose.models.Course || mongoose.model('Course', courseSchema);
