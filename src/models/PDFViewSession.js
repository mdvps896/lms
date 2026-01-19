import mongoose from 'mongoose';

const pdfViewSessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
        index: true
    },
    lectureId: {
        type: String,
        required: true
    },
    lectureName: {
        type: String,
        required: true
    },
    pdfUrl: {
        type: String,
        required: true
    },
    pdfName: {
        type: String,
        required: true
    },
    startTime: {
        type: Date,
        required: true,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    duration: {
        type: Number, // in seconds
        default: 0
    },
    lastActiveTime: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Track page views within the PDF
    pagesViewed: [{
        pageNumber: Number,
        viewedAt: Date,
        timeSpent: Number // seconds on this page
    }],
    totalPages: {
        type: Number,
        default: 0
    },
    currentPage: {
        type: Number,
        default: 1
    },
    // Selfie tracking
    selfies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SelfieCapture'
    }],
    selfieCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for faster queries
pdfViewSessionSchema.index({ user: 1, course: 1, createdAt: -1 });
pdfViewSessionSchema.index({ user: 1, isActive: 1 });

// Method to calculate total time spent
pdfViewSessionSchema.methods.calculateDuration = function () {
    if (this.endTime) {
        this.duration = Math.floor((this.endTime - this.startTime) / 1000);
    } else if (this.lastActiveTime) {
        this.duration = Math.floor((this.lastActiveTime - this.startTime) / 1000);
    }
    return this.duration;
};

// Static method to get user's total time on a course
pdfViewSessionSchema.statics.getTotalCourseTime = async function (userId, courseId) {
    const result = await this.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId),
                course: new mongoose.Types.ObjectId(courseId)
            }
        },
        {
            $group: {
                _id: null,
                totalSeconds: { $sum: '$duration' },
                totalSessions: { $sum: 1 }
            }
        }
    ]);

    if (result.length > 0) {
        const totalSeconds = result[0].totalSeconds;
        return {
            totalSeconds,
            totalMinutes: Math.floor(totalSeconds / 60),
            totalHours: Math.floor(totalSeconds / 3600),
            formattedTime: formatDuration(totalSeconds),
            totalSessions: result[0].totalSessions
        };
    }

    return {
        totalSeconds: 0,
        totalMinutes: 0,
        totalHours: 0,
        formattedTime: '0m 0s',
        totalSessions: 0
    };
};

// Static method to get user's total time on a specific PDF
pdfViewSessionSchema.statics.getTotalPdfTime = async function (userId, courseId, lectureId) {
    const result = await this.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId),
                course: new mongoose.Types.ObjectId(courseId),
                lectureId: lectureId
            }
        },
        {
            $group: {
                _id: null,
                totalSeconds: { $sum: '$duration' },
                totalSessions: { $sum: 1 }
            }
        }
    ]);

    if (result.length > 0) {
        const totalSeconds = result[0].totalSeconds;
        return {
            totalSeconds,
            totalMinutes: Math.floor(totalSeconds / 60),
            formattedTime: formatDuration(totalSeconds),
            totalSessions: result[0].totalSessions
        };
    }

    return {
        totalSeconds: 0,
        totalMinutes: 0,
        formattedTime: '0m 0s',
        totalSessions: 0
    };
};

// Helper function to format duration
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

const PDFViewSession = mongoose.models.PDFViewSession || mongoose.model('PDFViewSession', pdfViewSessionSchema);

export default PDFViewSession;
