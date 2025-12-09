import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Category from '@/models/Category'

// GET - Get all categories
export async function GET(request) {
    try {
        await connectDB()

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')

        let query = {}
        if (status && status !== 'all') {
            query.status = status
        }

        const categories = await Category.find(query).sort({ createdAt: -1 })

        return NextResponse.json({
            success: true,
            data: categories
        })
    } catch (error) {
        console.error('Error fetching categories:', error)
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch categories',
            error: error.message
        }, { status: 500 })
    }
}

// POST - Create new category
export async function POST(request) {
    try {
        await connectDB()

        const body = await request.json()
        const { name, description, status } = body

        // Validation
        if (!name) {
            return NextResponse.json({
                success: false,
                message: 'Category name is required'
            }, { status: 400 })
        }

        // Check if category already exists
        const existingCategory = await Category.findOne({ 
            name: { $regex: new RegExp(`^${name}$`, 'i') } 
        })

        if (existingCategory) {
            return NextResponse.json({
                success: false,
                message: 'Category with this name already exists'
            }, { status: 400 })
        }

        // Create new category
        const category = await Category.create({
            name,
            description: description || '',
            status: status || 'active'
        })

        return NextResponse.json({
            success: true,
            message: 'Category created successfully',
            data: category
        }, { status: 201 })
    } catch (error) {
        console.error('Error creating category:', error)
        return NextResponse.json({
            success: false,
            message: 'Failed to create category',
            error: error.message
        }, { status: 500 })
    }
}
