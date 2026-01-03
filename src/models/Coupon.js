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
        min: 0
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
couponSchema.index({ code: 1 });
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
