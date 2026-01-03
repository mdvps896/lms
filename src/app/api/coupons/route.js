import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import Course from '@/models/Course';
import Category from '@/models/Category';

export const dynamic = 'force-dynamic';

// Helper function to generate random coupon code
function generateCouponCode(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// GET - List all coupons
export async function GET(request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format'); // 'admin' or 'mobile'

        let coupons;

        if (format === 'mobile') {
            // Mobile: Only active and valid coupons
            const now = new Date();
            coupons = await Coupon.find({
                isActive: true,
                startDate: { $lte: now },
                endDate: { $gte: now },
                $or: [
                    { maxUses: null },
                    { $expr: { $lt: ['$currentUses', '$maxUses'] } }
                ]
            })
                .populate('courses', 'title thumbnail')
                .populate('categories', 'name')
                .select('-usedBy -createdBy')
                .sort({ createdAt: -1 });

            return NextResponse.json({
                success: true,
                data: coupons
            });
        } else {
            // Admin: All coupons with full details
            coupons = await Coupon.find()
                .populate('courses', 'title')
                .populate('categories', 'name')
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 });

            return NextResponse.json({
                success: true,
                data: coupons
            });
        }
    } catch (error) {
        console.error('Error fetching coupons:', error);
        return NextResponse.json(
            { success: false, message: 'Error fetching coupons' },
            { status: 500 }
        );
    }
}

// POST - Create new coupon
export async function POST(request) {
    try {
        await dbConnect();

        const body = await request.json();
        const {
            code,
            discountType,
            discountValue,
            applicationType,
            courses,
            categories,
            students,
            startDate,
            endDate,
            maxUses,
            generateCode
        } = body;

        // Generate code if requested
        let finalCode = code;
        if (generateCode) {
            let isUnique = false;
            while (!isUnique) {
                finalCode = generateCouponCode();
                const existing = await Coupon.findOne({ code: finalCode });
                if (!existing) isUnique = true;
            }
        }

        // Validate required fields
        if (!finalCode || !discountType || !discountValue || !applicationType || !startDate || !endDate) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate discount value
        if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
            return NextResponse.json(
                { success: false, message: 'Percentage must be between 0 and 100' },
                { status: 400 }
            );
        }

        // Prepare data with safe defaults
        const couponData = {
            code: finalCode.toUpperCase(),
            discountType,
            discountValue,
            applicationType,
            courses: applicationType === 'specific' && Array.isArray(courses) ? courses : [],
            categories: applicationType === 'category' && Array.isArray(categories) ? categories : [],
            students: applicationType === 'students' && Array.isArray(students) ? students : [],
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            maxUses: maxUses || null,
            isActive: true
        };

        console.log('Creating coupon with data:', couponData);

        // Create coupon
        const coupon = await Coupon.create(couponData);

        await coupon.populate('courses', 'title');
        await coupon.populate('categories', 'name');
        if (coupon.students && coupon.students.length > 0) {
            await coupon.populate('students', 'name email');
        }

        return NextResponse.json({
            success: true,
            data: coupon,
            message: 'Coupon created successfully'
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating coupon:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);

        if (error.code === 11000) {
            return NextResponse.json(
                { success: false, message: 'Coupon code already exists' },
                { status: 400 }
            );
        }

        if (error.name === 'ValidationError') {
            return NextResponse.json(
                { success: false, message: `Validation error: ${error.message}` },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, message: `Error creating coupon: ${error.message}` },
            { status: 500 }
        );
    }
}
