import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ExamAttempt from '@/models/ExamAttempt';
import Question from '@/models/Question';

export async function PUT(req, { params }) {
    try {
        await dbConnect();

        // Get user ID and role from cookies
        const cookies = req.headers.get('cookie');
        let userId = null;
        let userRole = null;
        let userEmail = null;

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
                    userEmail = userData.email;
                } catch (parseError) {
                    console.error('Failed to parse user cookie:', parseError);
                }
            }
        }

        if (!userId) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin or teacher
        if (userRole !== 'admin' && userRole !== 'teacher') {
            return NextResponse.json({ success: false, message: 'Forbidden: Only admin or teacher can update marks' }, { status: 403 });
        }

        const { attemptId} = params;
        const { updatedMarks } = await req.json();

        console.log('Received updatedMarks:', updatedMarks);

        if (!updatedMarks || typeof updatedMarks !== 'object' || Object.keys(updatedMarks).length === 0) {
            return NextResponse.json({ success: false, message: 'Invalid marks data' }, { status: 400 });
        }

        // Find the attempt (NOT lean, we need to save it)
        const attempt = await ExamAttempt.findById(attemptId).populate('exam');

        if (!attempt) {
            return NextResponse.json({ success: false, message: 'Attempt not found' }, { status: 404 });
        }

        if (!attempt.exam) {
            return NextResponse.json({ success: false, message: 'Exam not found' }, { status: 404 });
        }

        const exam = attempt.exam;

        // Fetch all questions for this exam to calculate total
        let allQuestions = [];
        
        console.log('Exam questionGroups:', exam.questionGroups);
        console.log('Exam subjects:', exam.subjects);
        
        if (exam.questionGroups && exam.questionGroups.length > 0) {
            allQuestions = await Question.find({
                questionGroup: { $in: exam.questionGroups },
                status: 'active'
            });
            console.log('Questions found by questionGroups:', allQuestions.length);
        }
        
        // Fallback: Try to find by subjects if no questionGroups
        if (allQuestions.length === 0 && exam.subjects && exam.subjects.length > 0) {
            allQuestions = await Question.find({
                subject: { $in: exam.subjects },
                status: 'active'
            });
            console.log('Questions found by subjects:', allQuestions.length);
        }
        
        // Fallback: Get questions from the attempt's answers
        if (allQuestions.length === 0 && attempt.answers) {
            const questionIds = [];
            if (attempt.answers instanceof Map) {
                for (const [key] of attempt.answers) {
                    questionIds.push(key);
                }
            } else if (typeof attempt.answers === 'object') {
                questionIds.push(...Object.keys(attempt.answers));
            }
            
            if (questionIds.length > 0) {
                allQuestions = await Question.find({
                    _id: { $in: questionIds }
                });
                console.log('Questions found from answers:', allQuestions.length);
            }
        }

        if (allQuestions.length === 0) {
            return NextResponse.json({ 
                success: false, 
                message: 'No questions found for this exam',
                debug: {
                    hasQuestionGroups: !!exam.questionGroups,
                    questionGroupsLength: exam.questionGroups?.length || 0,
                    hasSubjects: !!exam.subjects,
                    subjectsLength: exam.subjects?.length || 0,
                    hasAnswers: !!attempt.answers
                }
            }, { status: 404 });
        }

        // Validate and store manual marks
        const manualMarks = {};
        let totalMarksObtained = 0;
        let totalMaxMarks = 0;

        for (const question of allQuestions) {
            const questionId = question._id.toString();
            const maxMarks = question.marks || 1;
            totalMaxMarks += maxMarks;

            // Check if admin provided marks for this question
            // The updatedMarks uses answer._id, but we need to match it back to questions
            // For now, sum all provided marks
            let marksForQuestion = 0;
            
            // Get user's answer to determine if question was attempted
            let userAnswer = null;
            if (attempt.answers) {
                if (attempt.answers instanceof Map) {
                    userAnswer = attempt.answers.get(questionId);
                } else if (typeof attempt.answers === 'object') {
                    userAnswer = attempt.answers[questionId];
                }
            }

            // Calculate default marks (correct/incorrect)
            const correctAnswer = question.options?.find(opt => opt.isCorrect)?.text;
            const isCorrect = userAnswer === correctAnswer;
            marksForQuestion = isCorrect ? maxMarks : 0;

            manualMarks[questionId] = marksForQuestion;
            totalMarksObtained += marksForQuestion;
        }

        // Override with manual marks from admin
        // updatedMarks has answer._id as keys, we need to sum them all
        const providedMarks = Object.values(updatedMarks).map(m => parseFloat(m));
        if (providedMarks.length > 0) {
            totalMarksObtained = providedMarks.reduce((sum, m) => sum + m, 0);
        }

        // Update attempt fields
        const scorePercentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;
        const passingPercentage = exam.settings?.passingPercentage || 40;

        console.log('Updating attempt with:', {
            scorePercentage,
            totalMaxMarks,
            totalMarksObtained,
            passed: scorePercentage >= passingPercentage
        });

        // Update fields directly
        attempt.score = scorePercentage;
        attempt.totalMarks = totalMaxMarks;
        attempt.passed = scorePercentage >= passingPercentage;
        attempt.modifiedBy = userEmail;
        attempt.modifiedAt = new Date();
        
        // Store manual marks
        attempt.manualMarks = new Map(Object.entries(updatedMarks));
        
        // Publish the result (change status from draft to published)
        attempt.resultStatus = 'published';

        // Save to database
        const savedAttempt = await attempt.save();
        console.log('Attempt saved successfully:', savedAttempt._id);
        console.log('Result status changed to:', savedAttempt.resultStatus);

        return NextResponse.json({ 
            success: true, 
            message: 'Marks updated and result published successfully',
            data: {
                score: scorePercentage,
                passed: attempt.passed,
                totalMarks: totalMaxMarks,
                marksObtained: totalMarksObtained
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Error updating marks:', error);
        return NextResponse.json({ 
            success: false, 
            message: 'Internal server error',
            error: error.message 
        }, { status: 500 });
    }
}
