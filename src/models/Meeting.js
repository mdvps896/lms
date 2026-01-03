
import mongoose from "mongoose";

const MeetingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Meeting title is required"],
        trim: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: [true, "Category is required"],
    },
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
    }],
    assignedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    startTime: {
        type: Date,
        required: [true, "Start time is required"],
    },
    endTime: {
        type: Date,
        required: [true, "End time is required"],
    },
    links: [{
        title: {
            type: String,
            default: "Meeting Link"
        },
        url: {
            type: String,
            required: [true, "URL is required"]
        }
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
});

// Prevent duplicate model compilation
export default mongoose.models.Meeting || mongoose.model("Meeting", MeetingSchema);
