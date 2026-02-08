import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ExamAttempt from '@/models/ExamAttempt';
import User from '@/models/User';

export async function GET(request, { params }) {
    try {
        await dbConnect();

        const { id: examId } = params;

        // Get exam details to fetch passing percentage
        const Exam = require('@/models/Exam').default;
        const exam = await Exam.findById(examId).select('passingPercentage').lean();
        const passingPercentage = exam?.passingPercentage || 50;

        // Get all attempts for this exam
        const attempts = await ExamAttempt.find({
            exam: examId,
            status: 'submitted'
        })
            .populate('user', 'name email rollNo')
            .lean();

        // Group attempts by student
        const studentMap = new Map();

        attempts.forEach(attempt => {
            if (!attempt.user) return;

            const userId = attempt.user._id.toString();

            if (!studentMap.has(userId)) {
                studentMap.set(userId, {
                    _id: attempt.user._id,
                    name: attempt.user.name,
                    email: attempt.user.email,
                    rollNo: attempt.user.rollNo,
                    totalAttempts: 0,
                    attempts: [],
                    bestAttempt: null
                });
            }

            const student = studentMap.get(userId);
            student.totalAttempts++;

            // Calculate time taken in seconds
            let timeTakenInSeconds = 0;
            if (attempt.submittedAt && attempt.startedAt) {
                timeTakenInSeconds = Math.floor((new Date(attempt.submittedAt) - new Date(attempt.startedAt)) / 1000);
            }

            // Calculate correct and wrong answers
            const totalQuestions = attempt.totalMarks || 0;
            const percentage = attempt.percentage || 0;
            let correctAnswers = Math.round(attempt.score || 0);

            // FALLBACK: If score is 0 but percentage is > 0, it means score wasn't saved correctly
            // but percentage was. derive correctAnswers from percentage for display.
            if (correctAnswers === 0 && percentage > 0 && totalQuestions > 0) {
                correctAnswers = Math.round((percentage / 100) * totalQuestions);
            }

            const wrongAnswers = Math.max(0, totalQuestions - correctAnswers);

            // Add formatted attempt
            student.attempts.push({
                _id: attempt._id,
                percentage: attempt.percentage || 0,
                score: attempt.score || 0,
                totalMarks: attempt.totalMarks || 0,
                passed: (attempt.percentage || 0) >= passingPercentage,
                correctAnswers: correctAnswers,
                wrongAnswers: wrongAnswers,
                timeTakenInSeconds: timeTakenInSeconds,
                submittedAt: attempt.submittedAt,
                status: attempt.status
            });

            // Update best attempt
            if (!student.bestAttempt || attempt.percentage > student.bestAttempt.percentage) {
                student.bestAttempt = {
                    _id: attempt._id,
                    percentage: attempt.percentage || 0,
                    score: attempt.score || 0,
                    totalMarks: attempt.totalMarks || 0,
                    passed: (attempt.percentage || 0) >= passingPercentage,
                    correctAnswers: correctAnswers,
                    wrongAnswers: wrongAnswers,
                    timeTakenInSeconds: timeTakenInSeconds,
                    resultStatus: attempt.resultStatus || 'published',
                    submittedAt: attempt.submittedAt
                };
            }
        });

        const students = Array.from(studentMap.values())
            .sort((a, b) => a.name.localeCompare(b.name));

        return NextResponse.json({
            success: true,
            students
        });

    } catch (error) {
        console.error('Error fetching students results:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch students results', error: error.message },
            { status: 500 }
        );
    }
}
