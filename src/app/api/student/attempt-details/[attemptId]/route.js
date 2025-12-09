import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ExamAttempt from '@/models/ExamAttempt';
import Exam from '@/models/Exam';
import Question from '@/models/Question';

export async function GET(request, { params }) {
    try {
        await dbConnect();

        const { attemptId } = params;

        console.log('=== Fetching attempt details for:', attemptId);

        // Get user ID and role from cookies
        const cookies = request.headers.get('cookie');
        let userId = null;
        let userRole = null;

        if (cookies) {
            const userCookie = cookies
                .split('; ')
                .find(row => row.startsWith('user='));

            if (userCookie) {
                try {
                    const userDataStr = decodeURIComponent(userCookie.split('=')[1]);
                    const userData = JSON.parse(userDataStr);
                    userId = userData._id;
                    userRole = userData.role;
                    console.log('User ID:', userId, 'Role:', userRole);
                } catch (parseError) {
                    console.error('Failed to parse user cookie:', parseError);
                }
            }
        }

        if (!userId) {
            console.error('No user ID found');
            return NextResponse.json(
                { success: false, message: 'User not authenticated' },
                { status: 401 }
            );
        }

        // Find ExamAttempt
        console.log('Searching for exam attempt...');
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

        console.log('Attempt found for exam:', attempt.exam?.name);

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
        
        console.log('Access granted:', isOwner ? 'Owner' : 'Admin/Teacher');

        // Get exam details
        const exam = attempt.exam;

        console.log('Attempt found, status:', attempt.status);
        console.log('Attempt has answers:', attempt.answers ? 'yes' : 'no');
        if (attempt.answers) {
            console.log('Attempt answers type:', typeof attempt.answers);
            console.log('Attempt answers is Map:', attempt.answers instanceof Map);
            if (attempt.answers instanceof Map) {
                console.log('Answers Map size:', attempt.answers.size);
            } else if (typeof attempt.answers === 'object') {
                console.log('Answers object keys count:', Object.keys(attempt.answers).length);
            }
        }

        // Get questions from questionGroups
        let allQuestions = [];
        if (exam.questionGroups && exam.questionGroups.length > 0) {
            console.log('Fetching questions for question groups...');

            try {
                // Fetch Questions that belong to these question groups
                const questions = await Question.find({
                    questionGroup: { $in: exam.questionGroups },
                    status: 'active'
                }).lean();

                allQuestions = questions;
                console.log('Total questions found:', allQuestions.length);
            } catch (qError) {
                console.error('Error fetching questions:', qError);
                // Continue without questions
            }
        } else {
            console.log('No question groups in exam - trying fallback method');

            // FALLBACK: If no questionGroups, try to fetch questions by subject/category
            if (exam.subjects && exam.subjects.length > 0) {
                try {
                    console.log('Fetching questions by subject:', exam.subjects);
                    const questions = await Question.find({
                        subject: { $in: exam.subjects },
                        status: 'active'
                    }).lean();

                    allQuestions = questions;
                    console.log('Total questions found (fallback):', allQuestions.length);
                } catch (qError) {
                    console.error('Error fetching questions (fallback):', qError);
                }
            }
        }

        // Build answers array and calculate actual score
        console.log('Building answers array for', allQuestions.length, 'questions');
        let calculatedScore = 0;
        let calculatedTotalMarks = 0;
        
        const answersWithDetails = allQuestions.map((question, idx) => {
            let userAnswer = null;

            // Safely get user answer
            if (attempt.answers) {
                const questionId = question._id.toString();

                if (attempt.answers instanceof Map) {
                    userAnswer = attempt.answers.get(questionId);
                } else if (typeof attempt.answers === 'object') {
                    userAnswer = attempt.answers[questionId];
                }

                if (idx === 0) {
                    console.log('Sample - Question ID:', questionId);
                    console.log('Sample - User Answer:', userAnswer);
                }
            }

            // Find correct answer(s) from options
            let correctAnswer = null;
            const correctAnswers = [];
            const optionsArray = [];

            if (question.options && question.options.length > 0) {
                question.options.forEach(opt => {
                    optionsArray.push(opt.text);
                    if (opt.isCorrect) {
                        correctAnswers.push(opt.text);
                    }
                });
                
                // If multiple correct answers, join with comma; otherwise use single answer
                correctAnswer = correctAnswers.length > 1 
                    ? correctAnswers.join(', ') 
                    : correctAnswers[0] || null;
            }

            // For multiple choice, compare arrays; for single choice, compare strings
            let isCorrect = false;
            if (Array.isArray(userAnswer) && correctAnswers.length > 1) {
                // Multiple choice - check if arrays match (regardless of order)
                const sortedUserAnswer = [...userAnswer].sort();
                const sortedCorrectAnswer = [...correctAnswers].sort();
                isCorrect = JSON.stringify(sortedUserAnswer) === JSON.stringify(sortedCorrectAnswer);
            } else {
                // Single choice - direct comparison
                isCorrect = userAnswer !== null && userAnswer !== undefined && userAnswer !== '' && userAnswer === correctAnswers[0];
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
        
        console.log('Calculated Score:', calculatedScore, '/', calculatedTotalMarks);
        console.log('Stored Score:', attempt.score, '/', attempt.totalMarks);

        // Calculate time taken
        let timeTaken = null;
        if (attempt.submittedAt && attempt.startedAt) {
            try {
                timeTaken = Math.floor((new Date(attempt.submittedAt) - new Date(attempt.startedAt)) / 1000);
            } catch (e) {
                console.error('Error calculating time:', e);
            }
        }

        // Calculate score percentage using recalculated score for accuracy
        // Prefer calculated score if available, fallback to stored score
        const actualScore = calculatedTotalMarks > 0 ? calculatedScore : (attempt.score || 0);
        const actualTotalMarks = calculatedTotalMarks > 0 ? calculatedTotalMarks : (attempt.totalMarks || 1);
        const scorePercentage = actualTotalMarks > 0
            ? ((actualScore / actualTotalMarks) * 100)
            : 0;
        
        console.log('Final Score Percentage:', scorePercentage);

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
                title: exam.name,
                subject: subject,
                duration: exam.duration,
                totalQuestions: allQuestions.length,
                passingPercentage: exam.passingPercentage || 50
            }
        };

        console.log('=== Returning attempt details successfully ===');
        console.log('Answers count:', answersWithDetails.length);

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
