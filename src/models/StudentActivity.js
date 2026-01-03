
import mongoose from 'mongoose';

const StudentActivitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    activityType: {
        type: String,
        enum: ['pdf_view', 'course_view'],
        required: true
    },
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        // Dynamic ref based on type could be complex, keeping simple ID for now
        // or we can use refPath if needed, but manual population is often easier for mixed types
    },
    contentTitle: {
        type: String, // Store title snapshot for easier display
        required: true
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    duration: {
        type: Number, // In seconds
        default: 0
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed, // flexible for page number, percentage watched, etc.
        default: {}
    }
}, { timestamps: true });

// Prevent duplicate compile
export default mongoose.models.StudentActivity || mongoose.model('StudentActivity', StudentActivitySchema);
