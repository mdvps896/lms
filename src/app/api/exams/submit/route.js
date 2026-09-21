import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Exam from '@/models/Exam'
import ExamAttempt from '@/models/ExamAttempt'
import { getAuthenticatedUser } from '@/utils/apiAuth'

export async function POST(request) {
    try {
        await connectDB()

        const currentUser = await getAuthenticatedUser(request)
        if (!currentUser) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const { attemptId, sessionToken, answers, examId, timeTaken } = await request.json()

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

        const requesterId = currentUser.id || currentUser._id?.toString()
        if (
            currentUser.role !== 'admin' &&
            currentUser.role !== 'teacher' &&
            attempt.user?.toString() !== requesterId
        ) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
        }

        // 🔒 Validate the session token FIRST. Checking `status === 'submitted'`
        // before this meant a caller with the wrong token still got the score
        // back for an already-submitted attempt.
        if (attempt.sessionToken !== sessionToken) {
            return NextResponse.json(
                { message: 'Invalid session token' },
                { status: 403 }
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

        // Prefer the exact set served to this candidate by /exams/[id]/take.
        if (Array.isArray(attempt.servedQuestionIds) && attempt.servedQuestionIds.length > 0) {
            questions = await Question.find({ _id: { $in: attempt.servedQuestionIds } }).lean()
        } else if (exam.questionGroups && exam.questionGroups.length > 0) {
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

        // 🔒 H4: enforce the exam clock server-side. The deadline was never
        // checked here — `timeTaken` came straight from the client and the
        // mobile timer is anchored to the device's own clock, so killing and
        // reopening the app (or changing the phone's date) handed the student
        // unlimited time. A small grace window absorbs slow uploads.
        const SUBMIT_GRACE_SECONDS = 60
        const startedAtMs = attempt.startedAt ? new Date(attempt.startedAt).getTime() : null
        const durationSeconds = (exam.duration || 0) * 60
        const nowMs = Date.now()

        let lateSubmission = false
        if (startedAtMs && durationSeconds > 0) {
            const deadlineMs = startedAtMs + (durationSeconds + SUBMIT_GRACE_SECONDS) * 1000
            lateSubmission = nowMs > deadlineMs
        }

        // Compute elapsed time from the server's own record rather than
        // trusting the client-supplied `timeTaken`.
        const serverTimeTaken = startedAtMs
            ? Math.max(0, Math.round((nowMs - startedAtMs) / 1000))
            : Number(timeTaken) || 0

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

        // A submit with no `answers` key used to throw here (TypeError -> 500)
        // because this ran before the `answers || {}` fallback further down.
        const clientAnswers = (answers && typeof answers === 'object') ? answers : {};

        // Answers already persisted by /exams/save-answer during the exam.
        const savedAnswers = attempt.answers
            ? (attempt.answers instanceof Map ? Object.fromEntries(attempt.answers) : attempt.answers)
            : {};

        // 🔒 Past the deadline we grade ONLY what the server already had, so
        // extra time can't buy extra answers — while still crediting
        // everything the student legitimately saved before time ran out
        // (rather than voiding their whole paper over a late upload).
        const submittedAnswers = lateSubmission ? savedAnswers : clientAnswers;

        const scoreResults = questions.map((question) => {
            const questionId = question._id.toString();
            const userAnswer = submittedAnswers[questionId];
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
        const passingPercentage = exam.passingPercentage || 0
        const passed = percentage >= passingPercentage

        attempt.status = 'submitted'
        attempt.isActive = false
        attempt.submittedAt = submittedAt
        attempt.answers = new Map(Object.entries(submittedAnswers))
        attempt.score = totalScore
        attempt.totalMarks = maxPossibleScore
        attempt.percentage = Math.round(percentage * 100) / 100
        attempt.passed = passed
        attempt.hasSubjectiveQuestions = hasSubjectiveQuestions
        attempt.resultStatus = hasSubjectiveQuestions ? 'draft' : 'published'
        attempt.timeTaken = serverTimeTaken // server-measured, not client-reported
        attempt.lateSubmission = lateSubmission

        await attempt.save()

        return NextResponse.json({
            message: 'Exam submitted successfully',
            score: totalScore,
            totalMarks: maxPossibleScore,
            percentage: Math.round(percentage * 100) / 100,
            // Authoritative counts so clients never need the answer key to
            // render a result screen.
            correctCount: scoreResults.filter(r => r.isCorrect).length,
            lateSubmission,
            totalQuestions: scoreResults.length,
            passed,
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