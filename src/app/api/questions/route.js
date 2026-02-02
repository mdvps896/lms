import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Question from '@/models/Question';
import { getAuthenticatedUser, requirePermission } from '@/utils/apiAuth';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic'

export async function GET(request) {
    try {
        await connectDB();

        const authError = await requirePermission(request, 'manage_questions');
        if (authError) return authError;

        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const subject = searchParams.get('subject');
        const questionGroup = searchParams.get('questionGroup');
        const type = searchParams.get('type');
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const createdBy = searchParams.get('createdBy'); // Teacher filter
        const isTrash = searchParams.get('trash') === 'true';

        // Pagination parameters
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const skip = (page - 1) * limit;

        const user = await getAuthenticatedUser(request);

        let query = {};

        if (isTrash) {
            query.isDeleted = true;
        } else {
            query.isDeleted = { $ne: true };
        }

        if (user && user.role === 'teacher') {
            // Check access scope
            const accessScope = user.accessScope || 'own';
            if (accessScope === 'own') {
                try {
                    query.createdBy = new mongoose.Types.ObjectId(user.id);
                } catch (e) {
                    console.error('Error casting user ID to ObjectId:', e);
                    query.createdBy = user.id; // Fallback
                }
            }
        }


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

        // Add teacher filter (admin only)
        if (createdBy && createdBy !== 'all') {
            try {
                query.createdBy = new mongoose.Types.ObjectId(createdBy);
            } catch (e) {
                console.error('Error casting createdBy to ObjectId:', e);
                query.createdBy = createdBy;
            }
        }

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

        // Check permission
        const authError = await requirePermission(request, 'manage_questions');
        if (authError) return authError;

        const user = await getAuthenticatedUser(request);
        const body = await request.json();

        if (user) {
            body.createdBy = user.id;

            // Check if user is a teacher with question limit
            if (user.role === 'teacher' && user.questionLimit && user.questionLimit > 0) {
                const User = (await import('@/models/User')).default;
                const teacher = await User.findById(user.id);

                if (teacher && teacher.questionLimit) {
                    // Count existing questions by this teacher
                    const questionCount = await Question.countDocuments({
                        createdBy: user.id,
                        isDeleted: { $ne: true }
                    });

                    if (questionCount >= teacher.questionLimit) {
                        return NextResponse.json(
                            {
                                success: false,
                                message: `You have reached your question limit of ${teacher.questionLimit} questions. Please contact admin to increase your limit.`
                            },
                            { status: 403 }
                        );
                    }
                }
            }

            // Check question group limit
            if (body.questionGroup) {
                const QuestionGroup = (await import('@/models/QuestionGroup')).default;
                const group = await QuestionGroup.findById(body.questionGroup);

                if (group && group.questionLimit && group.questionLimit > 0) {
                    const groupQuestionCount = await Question.countDocuments({
                        questionGroup: body.questionGroup,
                        isDeleted: { $ne: true }
                    });

                    if (groupQuestionCount >= group.questionLimit) {
                        return NextResponse.json(
                            {
                                success: false,
                                message: `This question group has reached its limit of ${group.questionLimit} questions.`
                            },
                            { status: 403 }
                        );
                    }
                }
            }
        } else {
            console.warn('Creating Question without authenticated user (Public?)');
        }

        const question = await Question.create(body);


        // FORCE UPDATE to ensure createdBy is saved even if schema is stale
        if (body.createdBy) {
            await Question.collection.updateOne(
                { _id: question._id },
                { $set: { createdBy: new mongoose.Types.ObjectId(body.createdBy) } }
            );
        }

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
