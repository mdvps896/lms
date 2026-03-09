import mongoose from 'mongoose';

const BlogSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        maxlength: [100, 'Name cannot be more than 100 characters']
    },
    title: {
        type: String,
        required: [true, 'Please provide a blog title'],
        trim: true,
        maxlength: [200, 'Title cannot be more than 200 characters']
    },
    content: {
        type: String,
        required: [true, 'Please provide blog content'],
    },
    image: {
        type: String,
        trim: true,
        default: ''
    },
    category: {
        type: String,
        trim: true,
        default: 'General'
    },
    status: {
        type: String,
        enum: ['published', 'draft'],
        default: 'draft'
    },
    downloadable: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// In Next.js dev mode, models can be cached in the global scope. 
// We explicitly delete the Blog model if it exists to ensure hooks are cleared.
if (process.env.NODE_ENV === 'development' && mongoose.models.Blog) {
    delete mongoose.models.Blog;
}

const Blog = mongoose.models.Blog || mongoose.model('Blog', BlogSchema);
export default Blog;
