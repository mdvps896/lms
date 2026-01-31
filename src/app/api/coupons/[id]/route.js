import Coupon from '@/models/Coupon';
import { requireAdmin } from '@/utils/apiAuth';

export const dynamic = 'force-dynamic';

// GET - Get single coupon
export async function GET(request, { params }) {
    const authError = await requireAdmin(request);
    if (authError) return authError;
    try {
        await dbConnect();
        const { id } = params;

        const coupon = await Coupon.findById(id)
            .populate('courses', 'title thumbnail price')
            .populate('categories', 'name')
            .populate('students', 'name email')
            .populate('usedBy.user', 'name email')
            .populate('usedBy.courseId', 'title');

        if (!coupon) {
            return NextResponse.json(
                { success: false, message: 'Coupon not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: coupon
        });
    } catch (error) {
        console.error('Error fetching coupon:', error);
        return NextResponse.json(
            { success: false, message: 'Error fetching coupon' },
            { status: 500 }
        );
    }
}

// PUT - Update coupon
export async function PUT(request, { params }) {
    const authError = await requireAdmin(request);
    if (authError) return authError;
    try {
        await dbConnect();
        const { id } = params;
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
            isActive
        } = body;

        // Validate discount value
        if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
            return NextResponse.json(
                { success: false, message: 'Percentage must be between 0 and 100' },
                { status: 400 }
            );
        }

        const updateData = {
            code: code?.toUpperCase(),
            discountType,
            discountValue,
            applicationType,
            courses: applicationType === 'specific' ? courses : [],
            categories: applicationType === 'category' ? categories : [],
            students: applicationType === 'students' ? students : [],
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            maxUses: maxUses || null,
            isActive
        };

        // Remove undefined fields
        Object.keys(updateData).forEach(key =>
            updateData[key] === undefined && delete updateData[key]
        );

        const coupon = await Coupon.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        )
            .populate('courses', 'title')
            .populate('categories', 'name')
            .populate('students', 'name email');

        if (!coupon) {
            return NextResponse.json(
                { success: false, message: 'Coupon not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: coupon,
            message: 'Coupon updated successfully'
        });

    } catch (error) {
        console.error('Error updating coupon:', error);

        if (error.code === 11000) {
            return NextResponse.json(
                { success: false, message: 'Coupon code already exists' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, message: 'Error updating coupon' },
            { status: 500 }
        );
    }
}

// DELETE - Delete coupon
export async function DELETE(request, { params }) {
    const authError = await requireAdmin(request);
    if (authError) return authError;
    try {
        await dbConnect();
        const { id } = params;

        const coupon = await Coupon.findByIdAndDelete(id);

        if (!coupon) {
            return NextResponse.json(
                { success: false, message: 'Coupon not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Coupon deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting coupon:', error);
        return NextResponse.json(
            { success: false, message: 'Error deleting coupon' },
            { status: 500 }
        );
    }
}
