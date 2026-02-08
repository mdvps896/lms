import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Exam from '@/models/Exam'
import ExamAttempt from '@/models/ExamAttempt'

export async function POST(request) {
    try {
        await connectDB()

        const { attemptId, sessionToken, answers, examId } = await request.json()

        if (!attemptId || !sessionToken || !examId) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Find the ExamAttempt
        const attempt = await ExamAttempt.findById(attemptId);

        if (!attempt) {
            return NextResponse.json(
                { message: 'Attempt not found' },
                { status: 404 }
            )
        }

        // Check if already submitted
        if (attempt.status === 'submitted') {
            return NextResponse.json(
                {
                    message: 'Exam already submitted',
                    score: attempt.score,
                    totalMarks: attempt.totalMarks,
                    percentage: attempt.percentage,
                    submittedAt: attempt.submittedAt,
                    attemptId
                },
                { status: 200 }
            )
        }

        if (attempt.sessionToken !== sessionToken) {
            return NextResponse.json(
                { message: 'Invalid session token' },
                { status: 403 }
            )
        }

        // Get exam details
        const exam = await Exam.findById(examId)
            .populate('questionGroups')

        if (!exam) {
            return NextResponse.json(
                { message: 'Exam not found' },
                { status: 404 }
            )
        }

        // Get all questions for scoring
        const Question = require('@/models/Question').default
        let questions = []
        if (exam.questionGroups && exam.questionGroups.length > 0) {
            questions = await Question.find({
                questionGroup: { $in: exam.questionGroups.map(g => g._id) },
                status: 'active'
            }).lean()
        } else {
            // FALLBACK: If no questionGroups, fetch questions by subject
            if (exam.subjects && exam.subjects.length > 0) {
                questions = await Question.find({
                    subject: { $in: exam.subjects },
                    status: 'active'
                }).lean()
            }
        }

        // Calculate score
        let totalScore = 0
        let maxPossibleScore = 0

        // Normalize helper for string comparison
        const normalize = (val) => {
            if (val === null || val === undefined) return '';
            // Convert to string, strip HTML tags, trim, and lowercase
            return String(val)
                .replace(/<[^>]*>/g, '') // Strip HTML tags
                .trim()
                .toLowerCase();
        };

        const scoreResults = questions.map((question) => {
            const questionId = question._id.toString();
            const userAnswer = answers[questionId];
            const marks = question.marks || 1;
            maxPossibleScore += marks;

            const correctOptions = (question.options || [])
                .filter(opt => opt.isCorrect);

            const correctTexts = correctOptions.map(opt => opt.text);
            const correctIds = correctOptions.map(opt => opt._id?.toString()).filter(id => id);

            let isCorrect = false;

            const checkMatch = (userAns, targetTexts, targetIds) => {
                const normUser = normalize(userAns);
                if (normUser === '') return false;

                // Match by text
                if (targetTexts.some(t => normalize(t) === normUser)) return true;

                // Match by ID
                if (targetIds.some(id => id === String(userAns))) return true;

                return false;
            };

            // Only attempt to score if there's a user answer
            if (userAnswer !== undefined && userAnswer !== null && userAnswer !== '') {
                if (Array.isArray(userAnswer)) {
                    if (correctOptions.length > 0) {
                        // For multiple select: all user answers must be correct, and all correct answers must be covered
                        const matchedCorrectly = userAnswer.every(ua => checkMatch(ua, correctTexts, correctIds));
                        const allCorrectMatched = correctTexts.every((ct, idx) =>
                            userAnswer.some(ua => normalize(ua) === normalize(ct)) ||
                            userAnswer.includes(correctIds[idx])
                        );
                        isCorrect = matchedCorrectly && allCorrectMatched;
                    }
                } else {
                    // Single choice or text answer
                    isCorrect = checkMatch(userAnswer, correctTexts, correctIds);
                }

                if (isCorrect) {
                    totalScore += marks;
                }
            }

            return {
                questionId,
                isCorrect,
                marksObtained: isCorrect ? marks : 0,
                marks
            };
        });

        // Check if exam has subjective questions
        const hasSubjectiveQuestions = questions.some(q =>
            ['short_answer', 'long_answer', 'subjective', 'essay', 'descriptive'].includes(q.type?.toLowerCase().replace(/ /g, '_'))
        );

        // Calculate percentage
        const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0

        // Update ExamAttempt with final submission
        const submittedAt = new Date()
        attempt.status = 'submitted'
        attempt.isActive = false
        attempt.submittedAt = submittedAt
        attempt.answers = new Map(Object.entries(answers || {}))
        attempt.score = totalScore
        attempt.totalMarks = maxPossibleScore
        attempt.percentage = Math.round(percentage * 100) / 100
        attempt.hasSubjectiveQuestions = hasSubjectiveQuestions
        attempt.resultStatus = hasSubjectiveQuestions ? 'draft' : 'published'

        await attempt.save()

        return NextResponse.json({
            message: 'Exam submitted successfully',
            score: totalScore,
            totalMarks: maxPossibleScore,
            percentage: Math.round(percentage * 100) / 100,
            submittedAt,
            attemptId
        })

    } catch (error) {
        console.error('Error submitting exam:', error)
        return NextResponse.json(
            { message: 'Internal server error', error: error.message },
            { status: 500 }
        )
    }
}