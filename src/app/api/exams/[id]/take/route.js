import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Exam from '@/models/Exam'
import ExamAttempt from '@/models/ExamAttempt'
import Question from '@/models/Question'
import QuestionGroup from '@/models/QuestionGroup'
import Subject from '@/models/Subject'
import User from '@/models/User'
import mongoose from 'mongoose'

export async function GET(request, { params }) {
    try {
        await connectDB()

        const { id } = params
        const { searchParams } = new URL(request.url)
        const attemptId = searchParams.get('attemptId')
        const sessionToken = searchParams.get('sessionToken')
        const userId = searchParams.get('userId') // Get userId from request

        // 🔒 SECURITY: Validate required parameters
        if (!id || !attemptId || !userId) {
            return NextResponse.json(
                { message: 'Missing required parameters' },
                { status: 400 }
            )
        }

        // 🔒 SECURITY: Validate MongoDB ObjectId format to prevent injection
        if (!mongoose.Types.ObjectId.isValid(id) ||
            !mongoose.Types.ObjectId.isValid(attemptId) ||
            !mongoose.Types.ObjectId.isValid(userId)) {
            return NextResponse.json(
                { message: 'Invalid ID format' },
                { status: 400 }
            )
        }

        // 🔒 SECURITY: Verify user exists and is active
        const user = await User.findById(userId);
        if (!user || user.status !== 'active') {
            return NextResponse.json(
                { message: 'Unauthorized access' },
                { status: 403 }
            )
        }

        // Find the ExamAttempt
        const attempt = await ExamAttempt.findById(attemptId);

        if (!attempt || attempt.status !== 'active' || !attempt.isActive) {
            return NextResponse.json(
                { message: 'Invalid or expired exam session' },
                { status: 403 }
            )
        }

        // 🔒 SECURITY: Verify attempt belongs to the requesting user
        if (attempt.userId.toString() !== userId) {
            return NextResponse.json(
                { message: 'Unauthorized: This exam attempt does not belong to you' },
                { status: 403 }
            )
        }

        // Validate session token if provided
        if (sessionToken && attempt.sessionToken !== sessionToken) {
            return NextResponse.json(
                { message: 'Invalid session token' },
                { status: 403 }
            )
        }

        // Get exam details
        const exam = await Exam.findById(id)
            .populate('category', 'name')
            .populate('subjects', 'name')
            .populate('questionGroups')

        if (!exam) {
            return NextResponse.json(
                { message: 'Exam not found' },
                { status: 404 }
            )
        }

        // Get questions from question groups
        let questions = []

        if (exam.questionGroups && exam.questionGroups.length > 0) {
            console.log('Fetching questions for question groups:', exam.questionGroups.map(g => g._id));

            // Get all questions that belong to these question groups
            questions = await Question.find({
                questionGroup: { $in: exam.questionGroups.map(g => g._id) },
                status: 'active'
            })
                .populate('subject', 'name _id')
                .lean();

            console.log(`Found ${questions.length} questions from ${exam.questionGroups.length} question groups`);

            // Attach group info to each question
            questions = questions.map(q => {
                const group = exam.questionGroups.find(g => g._id.toString() === q.questionGroup.toString());
                return {
                    ...q,
                    groupInfo: group ? { _id: group._id, name: group.name } : null,
                    questionGroup: group ? { _id: group._id, name: group.name } : null
                };
            });
        } else {
            // Fallback: Get questions by subject if no groups
            const questionIds = []
            for (const subject of exam.subjects) {
                const subjectQuestions = await Question.find({
                    subject: subject._id,
                    status: 'active'
                }).limit(10) // Limit questions per subject

                questionIds.push(...subjectQuestions.map(q => q._id))
            }

            questions = await Question.find({
                _id: { $in: questionIds }
            }).populate('subject', 'name')
        }

        // Shuffle questions if needed
        if (exam.shuffleQuestions) {
            questions = questions.sort(() => Math.random() - 0.5)
        }

        // Remove correct answers from questions (security)
        const sanitizedQuestions = questions.map(question => ({
            _id: question._id,
            questionText: question.questionText || question.text,  // Support both field names
            type: question.type,
            options: question.options,
            marks: question.marks,
            description: question.description,
            image: question.image,
            subject: question.subject,
            questionGroup: question.questionGroup,
            groupInfo: question.groupInfo
            // correctAnswer intentionally omitted
        }))

        // Calculate time remaining
        const now2 = new Date()
        const endTime = new Date(attempt.startedAt.getTime() + exam.duration * 60 * 1000);
        const timeRemaining = Math.max(0, Math.floor((endTime - now2) / 1000))

        // Get existing answers from Map
        const existingAnswers = attempt.answers ? Object.fromEntries(attempt.answers) : {};

        return NextResponse.json({
            success: true,
            exam: {
                _id: exam._id,
                name: exam.name,
                description: exam.description,
                duration: exam.duration,
                totalMarks: exam.totalMarks,
                subjects: exam.subjects,
                category: exam.category,
                settings: exam.settings,
                instructions: exam.instructions
            },
            questions: sanitizedQuestions,
            timeRemaining,
            answers: existingAnswers,
            attempt: {
                _id: attempt._id,
                startTime: attempt.startedAt,
                endTime: endTime,
                sessionToken: attempt.sessionToken,
                status: attempt.status,
                isActive: attempt.isActive
            },
            attemptInfo: {
                startTime: attempt.startedAt,
                endTime: endTime,
                sessionToken: attempt.sessionToken
            }
        })

    } catch (error) {
        console.error('Error loading exam:', error)
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}