import mongoose from 'mongoose';

const stepSchema = new mongoose.Schema({
    status: {
        type: String,
        default: 'Pending'
    },
    adminNote: {
        type: String,
        default: ''
    },
    paymentStatus: {
        type: String,
        enum: ['Not Started', 'Pending', 'Paid', 'Not Paid'],
        default: 'Not Started'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const studentProgressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    eligibilityCheck: {
        ...stepSchema.obj,
        status: {
            type: String,
            enum: ['Pending', 'In Review', 'Approved', 'Rejected'],
            default: 'Pending'
        }
    },
    dataFlow: {
        ...stepSchema.obj,
        status: {
            type: String,
            enum: ['Not Started', 'Submitted', 'Under Verification', 'Completed', 'Rejected', 'Additional Docs Required'],
            default: 'Not Started'
        }
    },
    psv: {
        ...stepSchema.obj,
        status: {
            type: String,
            enum: ['Not Started', 'Submitted', 'Under Verification', 'Completed', 'Rejected', 'Additional Docs Required'],
            default: 'Not Started'
        }
    },
    examBooking: {
        ...stepSchema.obj,
        status: {
            type: String,
            enum: ['Not Booked', 'Slot Available', 'Slot Not Available', 'Exam Pending', 'Booked', 'Rescheduled'],
            default: 'Not Booked'
        }
    },
    eligibilityLetter: {
        ...stepSchema.obj,
        status: {
            type: String,
            enum: ['Not Started', 'Submitted', 'Under Verification', 'Congratulations', 'Rejected', 'Additional Docs Required'],
            default: 'Not Started'
        }
    },
    examResult: {
        status: {
            type: String,
            enum: ['Awaiting Result', 'Passed', 'Failed', 'Result On Hold / Under Review', 'Re-Exam Required', 'Eligibility Letter Issued'],
            default: 'Awaiting Result'
        },
        adminNote: String,
        score: String,
        attemptNo: {
            type: Number,
            default: 1
        },
        resultScreenshot: String, // URL to image
        updatedAt: {
            type: Date,
            default: Date.now
        }
    },
    mcqCoursePayment: {
        status: {
            type: String,
            enum: ['Not Paid', 'Payment Pending', 'Paid'],
            default: 'Not Paid'
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    },
    bills: [{
        name: String,
        url: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        },
        downloadedAt: Date,
        status: {
            type: String,
            enum: ['Uploaded', 'Downloaded'],
            default: 'Uploaded'
        }
    }],
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

export default mongoose.models.StudentProgress || mongoose.model('StudentProgress', studentProgressSchema);
