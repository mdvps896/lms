import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Question from '@/models/Question';

export const dynamic = 'force-dynamic'

export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const subject = searchParams.get('subject');
        const questionGroup = searchParams.get('questionGroup');
        const type = searchParams.get('type');
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        
        // Pagination parameters
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const skip = (page - 1) * limit;

        let query = {};
        if (category && category !== 'all') query.category = category;
        if (subject && subject !== 'all') {
            if (subject.includes(',')) {
                query.subject = { $in: subject.split(',') };
            } else {
                query.subject = subject;
            }
        }
        if (questionGroup && questionGroup !== 'all') query.questionGroup = questionGroup;
        if (type && type !== 'all') query.type = type;
        if (status && status !== 'all') query.status = status;

        // Add search functionality
        if (search && search.trim()) {
            query.$or = [
                { questionText: { $regex: search.trim(), $options: 'i' } },
                { question: { $regex: search.trim(), $options: 'i' } }
            ];
        }

        // Get total count for pagination
        const total = await Question.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        // Get paginated results
        const questions = await Question.find(query)
            .populate('category', 'name')
            .populate('subject', 'name')
            .populate('questionGroup', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return NextResponse.json({ 
            success: true, 
            data: questions,
            pagination: {
                currentPage: page,
                totalPages,
                totalQuestions: total,
                questionsPerPage: limit,
                hasNext: page < totalPages,
                hasPrev: page > 1
            },
            total,
            totalPages
        });
    } catch (error) {
        console.error('Error fetching questions:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch questions', error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        await connectDB();
        const body = await request.json();
        
        const question = await Question.create(body);
        const populatedQuestion = await Question.findById(question._id)
            .populate('category', 'name')
            .populate('subject', 'name')
            .populate('questionGroup', 'name');

        return NextResponse.json({ success: true, message: 'Question created successfully', data: populatedQuestion }, { status: 201 });
    } catch (error) {
        console.error('Error creating question:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to create question', error: error.message },
            { status: 500 }
        );
    }
}
