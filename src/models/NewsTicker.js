import mongoose from 'mongoose';

const NewsTickerSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, 'Please provide ticker content'],
        trim: true,
        maxlength: [300, 'Content cannot be more than 300 characters']
    },
    link: {
        type: String,
        trim: true,
        default: ''
    },
    linkType: {
        type: String,
        enum: ['course', 'blog', 'external'],
        default: 'external'
    },
    // For course/blog, store the reference ID
    referenceId: {
        type: String,
        default: ''
    },
    order: {
        type: Number,
        default: 0
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Index for ordering
NewsTickerSchema.index({ order: 1, active: 1 });

// Clear cached model in dev mode
if (process.env.NODE_ENV === 'development' && mongoose.models.NewsTicker) {
    delete mongoose.models.NewsTicker;
}

const NewsTicker = mongoose.models.NewsTicker || mongoose.model('NewsTicker', NewsTickerSchema);
export default NewsTicker;
