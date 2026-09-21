import mongoose from 'mongoose';
import crypto from 'crypto';

const ESignSubmissionSchema = new mongoose.Schema({
    // Optional: a submission from the mobile/web app by a logged-in student
    // links to their account. Public web submissions (see `source` below)
    // have no account at all, so this is intentionally NOT required.
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // 'app'        — submitted by a logged-in student (mobile app or an
    //                authenticated web session); unchanged existing flow.
    // 'public_web' — submitted anonymously via the public /esign web form,
    //                for people who don't have/want the mobile app.
    source: {
        type: String,
        enum: ['app', 'public_web'],
        default: 'app'
    },
    // Unguessable per-submission secret for the public flow. There is no
    // login to authorize a guest's later "check status" / "download PDF"
    // calls, so this token (returned once, at submit time, and kept by the
    // guest's own browser) stands in for a session. Never set for 'app'
    // submissions, which use the normal JWT instead.
    publicAccessToken: {
        type: String,
        select: false
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
        selfiePhoto: String,
        // Was previously only ever readable via the User.esign_images
        // side-channel (see submit/route.js), which only exists for
        // logged-in accounts. Storing it directly on the submission — as
        // both flows already SEND it here — means the PDF generator no
        // longer depends on there being a User document at all.
        signatureImage: String
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

// One submission per registered user — but only enforced where `user` is
// actually set. `sparse: true` means the many documents with no `user`
// (every public submission) don't collide with each other on a `null` value.
ESignSubmissionSchema.index({ user: 1 }, { unique: true, sparse: true });
ESignSubmissionSchema.index({ source: 1, createdAt: -1 });

/** Generate an unguessable per-submission access token for the public flow. */
ESignSubmissionSchema.statics.generatePublicAccessToken = function () {
    return crypto.randomBytes(32).toString('hex');
};

export default mongoose.models.ESignSubmission || mongoose.model('ESignSubmission', ESignSubmissionSchema);
