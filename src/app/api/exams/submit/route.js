import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Exam from '@/models/Exam'
import ExamAttempt from '@/models/ExamAttempt'
import Question from '@/models/Question'

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
        let questions = []
        if (exam.questionGroups && exam.questionGroups.length > 0) {
            const Question = require('@/models/Question').default
            questions = await Question.find({
                questionGroup: { $in: exam.questionGroups.map(g => g._id) },
                status: 'active'
            }).lean()
        } else {
            // FALLBACK: If no questionGroups, fetch questions by subject
            const Question = require('@/models/Question').default
            if (exam.subjects && exam.subjects.length > 0) {
                const fetchedQuestions = await Question.find({
                    subject: { $in: exam.subjects },
                    status: 'active'
                }).lean()
                questions = fetchedQuestions
            }
        }

        // Calculate score
        let totalScore = 0
        let maxPossibleScore = 0

        console.log('=== SCORE CALCULATION ===');
        console.log('Total questions:', questions.length);

        for (const question of questions) {
            maxPossibleScore += question.marks || 1

            const userAnswer = answers[question._id.toString()]

            // Get correct answer(s) from options
            let correctAnswers = [];
            if (question.options && question.options.length > 0) {
                correctAnswers = question.options
                    .filter(opt => opt.isCorrect === true)
                    .map(opt => opt.text);
            }

            console.log(`Question ${question._id} (${question.type}):`, {
                userAnswer,
                correctAnswers,
                isMultipleChoice: question.type === 'multiple_choice',
                optionsCount: question.options?.length
            });

            if (userAnswer !== undefined && userAnswer !== null && userAnswer !== '') {
                let isCorrect = false;

                // Handle multiple choice (single answer)
                if (question.type === 'mcq' || question.type === 'multiple_choice') {
                    if (Array.isArray(userAnswer)) {
                        // If user selected multiple options, check if all are correct
                        isCorrect = userAnswer.length === correctAnswers.length &&
                                  userAnswer.every(ans => correctAnswers.includes(ans));
                    } else {
                        // Single selection
                        isCorrect = correctAnswers.includes(userAnswer);
                    }
                }
                // Handle true/false
                else if (question.type === 'true_false') {
                    isCorrect = correctAnswers.includes(userAnswer) || 
                               correctAnswers.includes(String(userAnswer));
                }
                // Handle short answer (case-insensitive match)
                else if (question.type === 'short_answer') {
                    const userAnswerLower = String(userAnswer).toLowerCase().trim();
                    isCorrect = correctAnswers.some(ans => 
                        String(ans).toLowerCase().trim() === userAnswerLower
                    );
                }

                if (isCorrect) {
                    totalScore += question.marks || 1
                    console.log('  ✓ Correct!');
                } else {
                    console.log('  ✗ Incorrect');
                    console.log('    User:', userAnswer);
                    console.log('    Correct:', correctAnswers);
                }
            } else {
                console.log('  - Not answered');
            }
        }

        console.log('Final Score:', totalScore, '/', maxPossibleScore);

        // Check if exam has subjective questions
        console.log('All question types:', questions.map(q => ({ id: q._id, type: q.type })));
        
        const hasSubjectiveQuestions = questions.some(q => 
            q.type === 'short_answer' || 
            q.type === 'long_answer' || 
            q.type === 'subjective' || 
            q.type === 'essay' ||
            q.type === 'descriptive'
        );

        console.log('Has subjective questions:', hasSubjectiveQuestions);
        console.log('Subjective question types found:', questions.filter(q => 
            q.type === 'short_answer' || 
            q.type === 'long_answer' || 
            q.type === 'subjective' || 
            q.type === 'essay' ||
            q.type === 'descriptive'
        ).map(q => ({ id: q._id, type: q.type })));

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

        console.log('Exam submitted successfully. Status:', attempt.status);
        console.log('Recordings preserved:', {
            hasRecordings: !!attempt.recordings,
            recordings: attempt.recordings
        });

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
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}

// Helper function to check if answer is correct
function isAnswerCorrect(question, userAnswer) {
    if (!question.correctAnswer) return false

    switch (question.type) {
        case 'multiple-choice':
            return userAnswer === question.correctAnswer

        case 'multiple-select':
            if (!Array.isArray(userAnswer) || !Array.isArray(question.correctAnswer)) {
                return false
            }
            return userAnswer.length === question.correctAnswer.length &&
                userAnswer.every(ans => question.correctAnswer.includes(ans))

        case 'true-false':
            return userAnswer === question.correctAnswer

        case 'short-answer':
        case 'essay':
            // For text answers, we'll need manual review or more sophisticated checking
            // For now, return false to indicate manual review needed
            return false

        default:
            return false
    }
}