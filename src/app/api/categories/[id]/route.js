import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Category from '@/models/Category'
import mongoose from 'mongoose'

// GET - Get single category
export async function GET(request, { params }) {
    try {
        await connectDB()

        const { id } = params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid category ID'
            }, { status: 400 })
        }

        const category = await Category.findById(id)

        if (!category) {
            return NextResponse.json({
                success: false,
                message: 'Category not found'
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            data: category
        })
    } catch (error) {
        console.error('Error fetching category:', error)
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch category',
            error: error.message
        }, { status: 500 })
    }
}

// PUT - Update category
export async function PUT(request, { params }) {
    try {
        await connectDB()

        const { id } = params
        const body = await request.json()
        const { name, description, status, isPublished } = body

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid category ID'
            }, { status: 400 })
        }

        // Validation
        if (!name) {
            return NextResponse.json({
                success: false,
                message: 'Category name is required'
            }, { status: 400 })
        }

        // Check if another category with same name exists
        const existingCategory = await Category.findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') },
            _id: { $ne: id }
        })

        if (existingCategory) {
            return NextResponse.json({
                success: false,
                message: 'Category with this name already exists'
            }, { status: 400 })
        }

        const category = await Category.findByIdAndUpdate(
            id,
            {
                name,
                description: description || '',
                status: status || 'active',
                isPublished: isPublished !== undefined ? isPublished : true
            },
            { new: true, runValidators: true }
        )

        if (!category) {
            return NextResponse.json({
                success: false,
                message: 'Category not found'
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            message: 'Category updated successfully',
            data: category
        })
    } catch (error) {
        console.error('Error updating category:', error)
        return NextResponse.json({
            success: false,
            message: 'Failed to update category',
            error: error.message
        }, { status: 500 })
    }
}

// DELETE - Delete category
export async function DELETE(request, { params }) {
    try {
        await connectDB()

        const { id } = params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid category ID'
            }, { status: 400 })
        }

        const category = await Category.findByIdAndDelete(id)

        if (!category) {
            return NextResponse.json({
                success: false,
                message: 'Category not found'
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            message: 'Category deleted successfully',
            data: category
        })
    } catch (error) {
        console.error('Error deleting category:', error)
        return NextResponse.json({
            success: false,
            message: 'Failed to delete category',
            error: error.message
        }, { status: 500 })
    }
}
