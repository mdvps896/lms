import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ExamAttempt from '@/models/ExamAttempt';
import Exam from '@/models/Exam';
import Question from '@/models/Question';
import { getAuthenticatedUser } from '@/utils/apiAuth';

export async function GET(request, { params }) {
    try {
        await connectDB();

        const { attemptId } = params;

        const currentUser = await getAuthenticatedUser(request);
        if (!currentUser) {
            console.error('No user found');
            return NextResponse.json(
                { success: false, message: 'User not authenticated' },
                { status: 401 }
            );
        }

        const userId = currentUser.id || currentUser._id?.toString();
        const userRole = currentUser.role;

        // Find ExamAttempt
        const attempt = await ExamAttempt.findById(attemptId)
            .populate('exam')
            .lean();

        if (!attempt) {
            console.error('Attempt not found');
            return NextResponse.json(
                { success: false, message: 'Attempt not found' },
                { status: 404 }
            );
        }

        // Check if this attempt belongs to the current user OR user is admin/teacher
        const isOwner = attempt.user.toString() === userId;
        const isAdminOrTeacher = userRole === 'admin' || userRole === 'teacher';

        if (!isOwner && !isAdminOrTeacher) {
            console.error('Attempt does not belong to current user and user is not admin/teacher');
            return NextResponse.json(
                { success: false, message: 'Unauthorized access to attempt' },
                { status: 403 }
            );
        }

        // Get exam details
        const exam = attempt.exam;

        // Get questions from questionGroups (preferred) or subjects (fallback)
        let allQuestions = [];

        const hasGroups = exam.questionGroups && exam.questionGroups.length > 0;
        const hasSubjects = exam.subjects && exam.subjects.length > 0;

        if (hasGroups) {
            try {
                allQuestions = await Question.find({
                    questionGroup: { $in: exam.questionGroups },
                    status: 'active'
                }).lean();
            } catch (qError) {
                console.error('Error fetching questions by groups:', qError);
            }
        }

        // Only if no questions found by groups, try subjects
        if (allQuestions.length === 0 && hasSubjects) {
            try {
                allQuestions = await Question.find({
                    subject: { $in: exam.subjects },
                    status: 'active'
                }).lean();
            } catch (qError) {
                console.error('Error fetching questions by subjects:', qError);
            }
        }

        // Build answers array and calculate actual score
        let calculatedScore = 0;
        let calculatedTotalMarks = 0;

        // Match questions and answers
        const answersWithDetails = allQuestions.map((question, idx) => {
            let userAnswer = null;

            // Safely get user answer
            if (attempt.answers) {
                const qIdString = question._id.toString();

                // Convert Map to Object if needed for easier lookup
                const answersObj = attempt.answers instanceof Map
                    ? Object.fromEntries(attempt.answers)
                    : attempt.answers;

                // 1. Direct lookup by ID string
                userAnswer = answersObj[qIdString];

                // 2. Fallback: Search all keys (handles ObjectId weirdness in lean objects)
                if (userAnswer === undefined || userAnswer === null) {
                    const keys = Object.keys(answersObj);
                    const matchKey = keys.find(k => k.toString() === qIdString);
                    if (matchKey) {
                        userAnswer = answersObj[matchKey];
                    }
                }

                // 3. Fallback: Check if indices were used as keys (unlikely but safe)
                if (userAnswer === undefined || userAnswer === null) {
                    userAnswer = answersObj[idx.toString()] || answersObj[idx];
                }
            }

            // Find correct answer(s) from options
            let correctAnswer = null;
            const correctAnswers = [];
            const correctOptionIds = [];
            const optionsArray = [];

            if (question.options && question.options.length > 0) {
                question.options.forEach(opt => {
                    optionsArray.push(opt.text);
                    if (opt.isCorrect) {
                        correctAnswers.push(opt.text);
                        if (opt._id) correctOptionIds.push(opt._id.toString());
                    }
                });

                // If multiple correct answers, join with comma; otherwise use single answer
                correctAnswer = correctAnswers.length > 1
                    ? correctAnswers.join(', ')
                    : correctAnswers[0] || null;
            }

            // For multiple choice, compare arrays; for single choice, compare strings
            let isCorrect = false;

            // Normalize helper for string comparison
            const normalize = (val) => {
                if (val === null || val === undefined) return '';
                return String(val).replace(/<[^>]*>/g, '').trim().toLowerCase();
            };

            const checkMatch = (userAns, correctTexts, correctIds) => {
                const normUser = normalize(userAns);
                if (normUser === '') return false;

                // Check against text
                if (correctTexts.some(t => normalize(t) === normUser)) return true;

                // Check against IDs (exact match as IDs don't have HTML/spaces usually)
                if (correctIds.some(id => id === String(userAns))) return true;

                return false;
            };

            if (Array.isArray(userAnswer)) {
                // Multiple selection
                if (correctAnswers.length === 0) {
                    isCorrect = false;
                } else {
                    // All selected must be correct, and all correct must be selected
                    const normUserAnswers = userAnswer.map(ua => normalize(ua)).filter(ua => ua !== '');

                    // Fuzzy match each user answer against correct options
                    const matchedCorrectly = userAnswer.every(ua => checkMatch(ua, correctAnswers, correctOptionIds));
                    const allCorrectMatched = correctAnswers.every(ca =>
                        userAnswer.some(ua => normalize(ua) === normalize(ca)) ||
                        correctOptionIds.some(id => userAnswer.includes(id))
                    );

                    isCorrect = matchedCorrectly && allCorrectMatched;
                }
            } else {
                // Single selection
                isCorrect = userAnswer !== null && userAnswer !== undefined && checkMatch(userAnswer, correctAnswers, correctOptionIds);
            }
            const questionMarks = question.marks || 1;
            let marksObtained = isCorrect ? questionMarks : 0;
            let finalIsCorrect = isCorrect;

            // Check if admin has manually assigned marks for this question
            // Manual marks override calculated marks
            if (attempt.manualMarks) {
                const manualMarksMap = attempt.manualMarks instanceof Map
                    ? attempt.manualMarks
                    : new Map(Object.entries(attempt.manualMarks || {}));

                // Try to find manual marks by question ID
                if (manualMarksMap.has(question._id.toString())) {
                    marksObtained = parseFloat(manualMarksMap.get(question._id.toString())) || marksObtained;
                    // If admin gave full marks, mark as correct
                    finalIsCorrect = marksObtained === questionMarks;
                }
            }

            // Accumulate score
            calculatedScore += marksObtained;
            calculatedTotalMarks += questionMarks;

            // Format selectedOption for display - if array, join with commas
            const formattedAnswer = Array.isArray(userAnswer)
                ? userAnswer.join(', ')
                : userAnswer;

            return {
                _id: question._id,
                question: {
                    questionText: question.questionText || 'Question text not available',
                    options: optionsArray,
                    correctAnswer: correctAnswer,
                    marks: questionMarks,
                    difficulty: question.difficulty
                },
                selectedOption: formattedAnswer,
                isCorrect: finalIsCorrect,
                marksObtained: marksObtained
            };
        });

        // Calculate time taken
        let timeTaken = attempt.timeTaken || null;
        if (!timeTaken && attempt.submittedAt && attempt.startedAt) {
            try {
                timeTaken = Math.floor((new Date(attempt.submittedAt) - new Date(attempt.startedAt)) / 1000);
            } catch (e) {
                console.error('Error calculating time:', e);
            }
        }

        // Calculate score percentage using recalculated score for accuracy
        // Prefer calculated score if available, fallback to stored score
        let actualScore = calculatedScore;
        const actualTotalMarks = calculatedTotalMarks > 0 ? calculatedTotalMarks : (attempt.totalMarks || 1);

        // FALLBACK: If recalculation resulted in 0 but the saved score/percentage is > 0
        if (calculatedScore === 0 && (attempt.score > 0 || attempt.percentage > 0)) {
            actualScore = attempt.score || ((attempt.percentage || 0) / 100 * actualTotalMarks);
        }

        const scorePercentage = actualTotalMarks > 0
            ? ((actualScore / actualTotalMarks) * 100)
            : 0;

        const formattedAttempt = {
            _id: attempt._id,
            score: scorePercentage,
            passed: scorePercentage >= (exam.passingPercentage || 50),
            resultStatus: attempt.resultStatus || 'published',
            hasSubjectiveQuestions: attempt.hasSubjectiveQuestions || false,
            timeTaken,
            submittedAt: attempt.submittedAt,
            createdAt: attempt.startedAt,
            status: attempt.status,
            answers: answersWithDetails
        };

        // Get subject info if available
        let subject = null;
        if (exam.subjects && exam.subjects.length > 0) {
            try {
                const Subject = require('@/models/Subject').default;
                const subjectDoc = await Subject.findById(exam.subjects[0]).lean();
                subject = subjectDoc;
            } catch (e) {
                console.error('Error fetching subject:', e);
            }
        }

        const response = {
            success: true,
            attempt: formattedAttempt,
            exam: {
                _id: exam._id,
                name: exam.name,
                title: exam.name,
                subject: subject,
                duration: exam.duration,
                totalQuestions: allQuestions.length,
                passingPercentage: exam.passingPercentage || 50
            }
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('=== ERROR in attempt-details API ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch attempt details', error: error.message },
            { status: 500 }
        );
    }
}
