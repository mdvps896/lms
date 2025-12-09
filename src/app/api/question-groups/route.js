import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import QuestionGroup from '@/models/QuestionGroup';
import Question from '@/models/Question';

export async function GET(request) {
    try {
        await connectDB();
        
        // Get query parameters
        const { searchParams } = new URL(request.url);
        const subjectsParam = searchParams.get('subjects');
        const categoryParam = searchParams.get('category');
        
        // Build query filter
        let query = {};
        
        // Filter by subjects if provided
        if (subjectsParam) {
            const subjectIds = subjectsParam.split(',').filter(id => id.trim());
            if (subjectIds.length > 0) {
                query.subject = { $in: subjectIds };
            }
        }
        
        // Filter by category if provided
        if (categoryParam) {
            query.category = categoryParam;
        }
        
        console.log('Question Groups API - Query:', query);
        
        const questionGroups = await QuestionGroup.find(query)
            .populate('category', 'name')
            .populate('subject', 'name')
            .sort({ createdAt: -1 });
        
        console.log('Question Groups API - Found:', questionGroups.length, 'groups');
        
        // Count questions for each group
        const groupsWithCount = await Promise.all(questionGroups.map(async (group) => {
            const questionCount = await Question.countDocuments({ questionGroup: group._id });
            return {
                ...group.toObject(),
                questionCount
            };
        }));
        
        console.log('Question Groups API - With counts:', groupsWithCount.map(g => ({ name: g.name, count: g.questionCount })));
        
        return NextResponse.json({
            success: true,
            data: groupsWithCount
        });
    } catch (error) {
        console.error('Error fetching question groups:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch question groups' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        await connectDB();
        const body = await request.json();
        
        // Check if name already exists in the same subject
        const existingGroup = await QuestionGroup.findOne({ 
            name: { $regex: new RegExp(`^${body.name}$`, 'i') },
            subject: body.subject
        });
        
        if (existingGroup) {
            return NextResponse.json(
                { error: 'Question group name already exists in this subject' },
                { status: 400 }
            );
        }
        
        const questionGroup = await QuestionGroup.create(body);
        const populatedGroup = await QuestionGroup.findById(questionGroup._id)
            .populate('category', 'name')
            .populate('subject', 'name');
        
        return NextResponse.json(populatedGroup, { status: 201 });
    } catch (error) {
        console.error('Error creating question group:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create question group' },
            { status: 500 }
        );
    }
}
