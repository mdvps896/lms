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
        currentAddress: String
    },
    documents: {
        passportFront: String,
        passportBack: String,
        passportPhoto: String,
        selfiePhoto: String
    },
    selections: {
        gulfLicenseCourse: [String], // Array of selected courses/exams
        coursePackageType: [String], // Array of selected package types
        servicesSelected: [String], // Multi-select services
        otherService: String, // Text for "Other (Write)"
        paymentTermsAccepted: Boolean,
        paymentMethod: String,
        legalDisclaimerAccepted: Boolean,
        finalConfirmationAccepted: Boolean
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
