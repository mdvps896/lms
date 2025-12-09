import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Subject from '@/models/Subject'
import mongoose from 'mongoose'

// GET - Get single subject
export async function GET(request, { params }) {
    try {
        await connectDB()

        const { id } = params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid subject ID'
            }, { status: 400 })
        }

        const subject = await Subject.findById(id).populate('category', 'name')

        if (!subject) {
            return NextResponse.json({
                success: false,
                message: 'Subject not found'
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            data: subject
        })
    } catch (error) {
        console.error('Error fetching subject:', error)
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch subject',
            error: error.message
        }, { status: 500 })
    }
}

// PUT - Update subject
export async function PUT(request, { params }) {
    try {
        await connectDB()

        const { id } = params
        const body = await request.json()
        const { name, category, description, status } = body

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid subject ID'
            }, { status: 400 })
        }

        // Validation
        if (!name) {
            return NextResponse.json({
                success: false,
                message: 'Subject name is required'
            }, { status: 400 })
        }

        if (!category) {
            return NextResponse.json({
                success: false,
                message: 'Category is required'
            }, { status: 400 })
        }

        const subject = await Subject.findByIdAndUpdate(
            id,
            {
                name,
                category,
                description: description || '',
                status: status || 'active'
            },
            { new: true, runValidators: true }
        ).populate('category', 'name')

        if (!subject) {
            return NextResponse.json({
                success: false,
                message: 'Subject not found'
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            message: 'Subject updated successfully',
            data: subject
        })
    } catch (error) {
        console.error('Error updating subject:', error)
        return NextResponse.json({
            success: false,
            message: 'Failed to update subject',
            error: error.message
        }, { status: 500 })
    }
}

// DELETE - Delete subject
export async function DELETE(request, { params }) {
    try {
        await connectDB()

        const { id } = params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid subject ID'
            }, { status: 400 })
        }

        const subject = await Subject.findByIdAndDelete(id)

        if (!subject) {
            return NextResponse.json({
                success: false,
                message: 'Subject not found'
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            message: 'Subject deleted successfully',
            data: subject
        })
    } catch (error) {
        console.error('Error deleting subject:', error)
        return NextResponse.json({
            success: false,
            message: 'Failed to delete subject',
            error: error.message
        }, { status: 500 })
    }
}
