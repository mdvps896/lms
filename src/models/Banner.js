import mongoose from 'mongoose';

const BannerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a banner name'],
        trim: true,
        maxlength: [100, 'Name cannot be more than 100 characters']
    },
    image: {
        type: String,
        required: [true, 'Please provide a banner image URL'],
        trim: true
    },
    linkType: {
        type: String,
        enum: ['course', 'external', 'none'],
        default: 'none'
    },
    link: {
        type: String,
        trim: true,
        default: ''
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// In Next.js dev mode, models can be cached in the global scope.
if (process.env.NODE_ENV === 'development' && mongoose.models.Banner) {
    delete mongoose.models.Banner;
}

const Banner = mongoose.models.Banner || mongoose.model('Banner', BannerSchema);
export default Banner;
