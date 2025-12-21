import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PDF from '@/models/PDF';

// PUT - Update PDF
export async function PUT(request, { params }) {
    try {
        await connectDB();

        const { id } = params;
        const body = await request.json();

        const pdf = await PDF.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true, runValidators: true }
        )
            .populate('category', 'name')
            .populate('subjects', 'name')
            .populate('uploadedBy', 'name email')
            .lean();

        if (!pdf) {
            return NextResponse.json({
                success: false,
                message: 'PDF not found'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: pdf,
            message: 'PDF updated successfully'
        });

    } catch (error) {
        console.error('Error updating PDF:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to update PDF',
            error: error.message
        }, { status: 500 });
    }
}

// GET - Get single PDF
export async function GET(request, { params }) {
    try {
        await connectDB();

        const { id } = params;

        const pdf = await PDF.findById(id)
            .populate('category', 'name')
            .populate('subjects', 'name')
            .populate('uploadedBy', 'name email')
            .lean();

        if (!pdf) {
            return NextResponse.json({
                success: false,
                message: 'PDF not found'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: pdf
        });

    } catch (error) {
        console.error('Error fetching PDF:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch PDF',
            error: error.message
        }, { status: 500 });
    }
}
