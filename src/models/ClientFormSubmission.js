import mongoose from 'mongoose';

const clientFormSubmissionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    formData: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    filledCount: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true
});

export default mongoose.models.ClientFormSubmission || mongoose.model('ClientFormSubmission', clientFormSubmissionSchema);
