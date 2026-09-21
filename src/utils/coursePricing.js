import Coupon from '@/models/Coupon';

/**
 * Single source of truth for what a course actually costs a given user.
 *
 * 🔒 SECURITY: /payment/create-order and /payment/verify-payment previously
 * computed price and discount independently, so they could disagree — and
 * verify-payment skipped its amount check entirely for orders without a
 * courseId in their notes. Both now call this, so the amount charged and the
 * amount verified are derived the same way, server-side, every time.
 */

/** Is this coupon currently usable for the given course/user? */
export function evaluateCoupon(coupon, { courseId, userId, now = new Date() }) {
    if (!coupon) return { valid: false, reason: 'Coupon not found' };
    if (!coupon.isActive) return { valid: false, reason: 'Coupon is not active' };
    if (now < coupon.startDate || now > coupon.endDate) {
        return { valid: false, reason: 'Coupon has expired' };
    }
    if (coupon.maxUses !== null && coupon.maxUses !== undefined && coupon.currentUses >= coupon.maxUses) {
        return { valid: false, reason: 'Coupon usage limit reached' };
    }
    if (coupon.applicationType === 'specific' && !coupon.courses.map(String).includes(String(courseId))) {
        return { valid: false, reason: 'Coupon not applicable to this course' };
    }
    if (coupon.applicationType === 'students' && !coupon.students.map(String).includes(String(userId))) {
        return { valid: false, reason: 'Coupon not applicable to this student' };
    }

    // 🔒 Per-user cap. Only the global `maxUses` was checked before, so one
    // student could redeem the same coupon over and over.
    const perUserLimit = coupon.maxUsesPerUser ?? 1;
    if (perUserLimit > 0 && Array.isArray(coupon.usedBy)) {
        const usedByThisUser = coupon.usedBy.filter(
            (entry) => String(entry?.user) === String(userId)
        ).length;
        if (usedByThisUser >= perUserLimit) {
            return { valid: false, reason: 'You have already used this coupon' };
        }
    }

    return { valid: true };
}

/**
 * @returns {Promise<{ basePrice: number, discount: number, payable: number,
 *                     coupon: object|null, couponError: string|null }>}
 */
export async function computePayableAmount({ course, couponCode, userId, now = new Date() }) {
    const basePrice = parseFloat(course?.price) || 0;

    if (!couponCode) {
        return { basePrice, discount: 0, payable: basePrice, coupon: null, couponError: null };
    }

    const coupon = await Coupon.findOne({ code: String(couponCode).toUpperCase() });
    const check = evaluateCoupon(coupon, { courseId: course?._id, userId, now });

    if (!check.valid) {
        return { basePrice, discount: 0, payable: basePrice, coupon: null, couponError: check.reason };
    }

    const raw = coupon.discountType === 'percentage'
        ? (basePrice * coupon.discountValue) / 100
        : coupon.discountValue;

    const discount = Math.min(Math.max(raw, 0), basePrice);

    return {
        basePrice,
        discount,
        payable: basePrice - discount,
        coupon,
        couponError: null
    };
}

/** Rupees -> paisa, the unit Razorpay works in. */
export function toPaisa(rupees) {
    return Math.round((parseFloat(rupees) || 0) * 100);
}
