import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Category from '@/models/Category'

export const dynamic = 'force-dynamic'

// GET - Get all categories
export async function GET(request) {
    try {
        await connectDB()

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const format = searchParams.get('format')
        const isPublished = searchParams.get('isPublished')

        let query = {}

        if (format === 'admin') {
            // Admin filtering
            if (status && status !== 'all') {
                query.status = status
            }
            if (isPublished !== null) {
                query.isPublished = isPublished === 'true'
            }
        } else {
            // Student filtering - only show live content
            // Be more lenient to handle legacy records where fields might be missing
            query.status = { $ne: 'inactive' }
            query.isPublished = { $ne: false }
        }

        const categories = await Category.find(query).sort({ name: 1 })

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
        const { name, description, status, isPublished } = body

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
            status: status || 'active',
            isPublished: isPublished !== undefined ? isPublished : true
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
