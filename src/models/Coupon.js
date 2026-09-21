import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    discountType: {
        type: String,
        enum: ['percentage', 'flat'],
        required: true
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0,
        validate: {
            validator: function (value) {
                return this.discountType !== 'percentage' || value <= 100;
            },
            message: 'Percentage discount cannot exceed 100'
        }
    },
    applicationType: {
        type: String,
        enum: ['all', 'specific', 'category', 'students'],
        required: true,
        default: 'specific'
    },
    courses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }],
    categories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    maxUses: {
        type: Number,
        default: null // null = unlimited
    },
    // 🔒 Per-student redemption cap. Only the global `maxUses` was enforced,
    // so a single student could redeem the same coupon repeatedly (including a
    // 100%-off coupon on the free-enrollment path). 0 = unlimited per user.
    maxUsesPerUser: {
        type: Number,
        default: 1
    },
    currentUses: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    usedBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        usedAt: {
            type: Date,
            default: Date.now
        },
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        }
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Index for faster queries
couponSchema.index({ isActive: 1, endDate: 1 });

// Virtual for checking if coupon is valid
couponSchema.virtual('isValid').get(function () {
    const now = new Date();
    const isDateValid = now >= this.startDate && now <= this.endDate;
    const isUsesValid = this.maxUses === null || this.currentUses < this.maxUses;
    return this.isActive && isDateValid && isUsesValid;
});

const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);

export default Coupon;
