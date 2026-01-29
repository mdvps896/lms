import mongoose from 'mongoose';

const ESignSubmissionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // Ensure one submission per user
    },
    personalDetails: {
        fullName: String,
        email: String,
        mobile: String,
        dob: String,
        nationality: String,
        passportNumber: String,
        aadhaarNumber: String,
        education: String,
        workExperience: String,
        currentAddress: String,
        rollNumber: String
    },
    documents: {
        passportFront: String,
        passportBack: String,
        passportPhoto: String,
        selfiePhoto: String
    },
    selections: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    signature: {
        clientName: String,
        date: String,
        place: String,
        digitalApproval: {
            type: Boolean,
            default: true
        }
    },
    adminStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    pdfGenerated: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export default mongoose.models.ESignSubmission || mongoose.model('ESignSubmission', ESignSubmissionSchema);
