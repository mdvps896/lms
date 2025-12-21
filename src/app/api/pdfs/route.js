import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PDF from '@/models/PDF';
import Category from '@/models/Category';
import Subject from '@/models/Subject';

export const dynamic = 'force-dynamic';

// GET - Fetch all PDFs
export async function GET(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');

        let query = {};
        if (category) {
            query.category = category;
        }

        const pdfs = await PDF.find(query)
            .populate('category', 'name')
            .populate('subjects', 'name')
            .populate('uploadedBy', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({
            success: true,
            data: pdfs
        });

    } catch (error) {
        console.error('Error fetching PDFs:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch PDFs',
            error: error.message
        }, { status: 500 });
    }
}

// POST - Create new PDF
export async function POST(request) {
    try {
        await connectDB();

        const body = await request.json();
        const { name, category, subjects, fileUrl, fileName, fileSize, totalPages, thumbnailUrl, isPremium, description, uploadedBy } = body;

        // Validation
        if (!name || !category || !fileUrl || !fileName) {
            return NextResponse.json({
                success: false,
                message: 'Name, category, file URL and file name are required'
            }, { status: 400 });
        }

        // Create PDF
        const pdf = await PDF.create({
            name,
            category,
            subjects: subjects || [],
            fileUrl,
            fileName,
            fileSize: fileSize || 0,
            totalPages: totalPages || 0,
            thumbnailUrl,
            isPremium: isPremium || false,
            description,
            uploadedBy
        });

        // Populate references
        const populatedPDF = await PDF.findById(pdf._id)
            .populate('category', 'name')
            .populate('subjects', 'name')
            .populate('uploadedBy', 'name email')
            .lean();

        return NextResponse.json({
            success: true,
            data: populatedPDF,
            message: 'PDF uploaded successfully'
        });

    } catch (error) {
        console.error('Error creating PDF:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to create PDF',
            error: error.message
        }, { status: 500 });
    }
}

// DELETE - Delete PDF
export async function DELETE(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({
                success: false,
                message: 'PDF ID is required'
            }, { status: 400 });
        }

        const pdf = await PDF.findByIdAndDelete(id);

        if (!pdf) {
            return NextResponse.json({
                success: false,
                message: 'PDF not found'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'PDF deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting PDF:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to delete PDF',
            error: error.message
        }, { status: 500 });
    }
}
