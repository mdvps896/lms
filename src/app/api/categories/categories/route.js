import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/models/Category';

export async function GET() {
    try {
        await dbConnect();

        // Fetch all categories
        const categories = await Category.find()
            .select('name')
            .sort({ name: 1 })
            .lean();

        console.log('Fetched categories:', categories.length);

        // Format categories for mobile app
        const formattedCategories = categories.map(category => ({
            id: category._id.toString(),
            name: category.name || 'Unnamed Category',
        }));

        return NextResponse.json({
            success: true,
            data: formattedCategories,
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch categories', error: error.message },
            { status: 500 }
        );
    }
}
