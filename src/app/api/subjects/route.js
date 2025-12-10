import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Subject from '@/models/Subject'

export const dynamic = 'force-dynamic'

// GET - Get all subjects
export async function GET(request) {
    try {
        await connectDB()

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const category = searchParams.get('category')

        let query = {}
        if (status && status !== 'all') {
            query.status = status
        }
        if (category && category !== 'all') {
            query.category = category
        }

        const subjects = await Subject.find(query)
            .populate('category', 'name')
            .sort({ createdAt: -1 })

        return NextResponse.json({
            success: true,
            data: subjects
        })
    } catch (error) {
        console.error('Error fetching subjects:', error)
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch subjects',
            error: error.message
        }, { status: 500 })
    }
}

// POST - Create new subject
export async function POST(request) {
    try {
        await connectDB()

        const body = await request.json()
        const { name, category, description, status } = body

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

        // Create new subject
        const subject = await Subject.create({
            name,
            category,
            description: description || '',
            status: status || 'active'
        })

        const populatedSubject = await Subject.findById(subject._id).populate('category', 'name')

        return NextResponse.json({
            success: true,
            message: 'Subject created successfully',
            data: populatedSubject
        }, { status: 201 })
    } catch (error) {
        console.error('Error creating subject:', error)
        return NextResponse.json({
            success: false,
            message: 'Failed to create subject',
            error: error.message
        }, { status: 500 })
    }
}
