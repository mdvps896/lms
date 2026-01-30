import mongoose from 'mongoose'

if (process.env.NODE_ENV !== 'production') {
    delete mongoose.models.Category;
}

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true,
        unique: true
    },
    description: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    isPublished: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
})

export default mongoose.models.Category || mongoose.model('Category', CategorySchema)
