import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import Course from '@/models/Course';

export const dynamic = 'force-dynamic';

// POST - Validate coupon for a course
export async function POST(request) {
    try {
        await dbConnect();

        const body = await request.json();
        const { code, courseId } = body;

        if (!code || !courseId) {
            return NextResponse.json(
                { success: false, message: 'Code and courseId are required' },
                { status: 400 }
            );
        }

        // Find coupon
        const coupon = await Coupon.findOne({ code: code.toUpperCase() })
            .populate('courses', '_id title price')
            .populate('categories', '_id');

        if (!coupon) {
            return NextResponse.json(
                { success: false, message: 'Invalid coupon code' },
                { status: 404 }
            );
        }

        // Check if active
        if (!coupon.isActive) {
            return NextResponse.json(
                { success: false, message: 'Coupon is inactive' },
                { status: 400 }
            );
        }

        // Check date validity
        const now = new Date();
        if (now < coupon.startDate) {
            return NextResponse.json(
                { success: false, message: 'Coupon not yet valid' },
                { status: 400 }
            );
        }
        if (now > coupon.endDate) {
            return NextResponse.json(
                { success: false, message: 'Coupon has expired' },
                { status: 400 }
            );
        }

        // Check max uses (global)
        if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) {
            return NextResponse.json(
                { success: false, message: 'Coupon usage limit reached' },
                { status: 400 }
            );
        }

        // Check per-user usage (if userId provided)
        const { userId } = body;
        if (userId && coupon.usedBy && Array.isArray(coupon.usedBy)) {
            const userUsageCount = coupon.usedBy.filter(
                entry => entry.user && entry.user.toString() === userId.toString()
            ).length;

            // Allow only one use per user
            if (userUsageCount > 0) {
                return NextResponse.json(
                    { success: false, message: 'You have already used this coupon' },
                    { status: 400 }
                );
            }
        }

        // Check applicability
        if (coupon.applicationType === 'specific') {
            const courseIds = coupon.courses.map(c => c._id.toString());
            if (!courseIds.includes(courseId)) {
                return NextResponse.json(
                    { success: false, message: 'Coupon not applicable to this course' },
                    { status: 400 }
                );
            }
        } else if (coupon.applicationType === 'category') {
            // Get course and check category
            const course = await Course.findById(courseId).select('category');
            if (!course) {
                return NextResponse.json(
                    { success: false, message: 'Course not found' },
                    { status: 404 }
                );
            }

            const categoryIds = coupon.categories.map(c => c._id.toString());
            if (!categoryIds.includes(course.category.toString())) {
                return NextResponse.json(
                    { success: false, message: 'Coupon not applicable to this course category' },
                    { status: 400 }
                );
            }
        }
        // 'all' type is always valid

        // Get course price for discount calculation
        const course = await Course.findById(courseId).select('price gstEnabled gstPercentage');
        if (!course) {
            return NextResponse.json(
                { success: false, message: 'Course not found' },
                { status: 404 }
            );
        }

        const basePrice = parseFloat(course.price) || 0;
        let discountAmount = 0;

        if (coupon.discountType === 'percentage') {
            discountAmount = (basePrice * coupon.discountValue) / 100;
        } else {
            discountAmount = coupon.discountValue;
        }

        // Ensure discount doesn't exceed price
        discountAmount = Math.min(discountAmount, basePrice);

        const finalPrice = basePrice - discountAmount;

        // Calculate GST on final price
        let gstAmount = 0;
        let totalPrice = finalPrice;

        if (course.gstEnabled) {
            gstAmount = (finalPrice * course.gstPercentage) / 100;
            totalPrice = finalPrice + gstAmount;
        }

        return NextResponse.json({
            success: true,
            valid: true,
            coupon: {
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                applicationType: coupon.applicationType
            },
            pricing: {
                originalPrice: basePrice,
                discountAmount: Math.round(discountAmount),
                priceAfterDiscount: Math.round(finalPrice),
                gstAmount: Math.round(gstAmount),
                totalPrice: Math.round(totalPrice),
                savings: Math.round(discountAmount)
            }
        });

    } catch (error) {
        console.error('Error validating coupon:', error);
        return NextResponse.json(
            { success: false, message: 'Error validating coupon' },
            { status: 500 }
        );
    }
}
