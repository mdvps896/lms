import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Exam from '@/models/Exam';
import Category from '@/models/Category';

export async function GET(request, { params }) {
    try {
        await connectDB();

        const { attemptId } = params;

        if (!attemptId) {
            return NextResponse.json(
                { message: 'Attempt ID is required' },
                { status: 400 }
            );
        }

        // Find the exam containing this attempt
        const exam = await Exam.findOne({ 'attempts._id': attemptId })
            .populate('category')
            .populate('subjects')
            .populate({
                path: 'questionGroups',
                populate: {
                    path: 'questions'
                }
            });

        if (!exam) {
            return NextResponse.json(
                { message: 'Exam not found' },
                { status: 404 }
            );
        }

        // Find the specific attempt
        const attempt = exam.attempts.id(attemptId);

        if (!attempt) {
            return NextResponse.json(
                { message: 'Attempt not found' },
                { status: 404 }
            );
        }

        // Get all questions count
        let totalQuestions = 0;
        if (exam.questionGroups && exam.questionGroups.length > 0) {
            for (const group of exam.questionGroups) {
                if (group.questions && group.questions.length > 0) {
                    totalQuestions += group.questions.length;
                }
            }
        }

        // Calculate time taken
        let timeTaken = null;
        if (attempt.startTime && attempt.endTime) {
            const timeDiff = new Date(attempt.endTime) - new Date(attempt.startTime);
            timeTaken = Math.floor(timeDiff / 1000 / 60); // in minutes
        }

        // Build result object
        const result = {
            attemptId: attempt._id,
            score: attempt.score || 0,
            totalMarks: attempt.totalMarks || 0,
            percentage: attempt.totalMarks > 0 
                ? ((attempt.score || 0) / attempt.totalMarks) * 100 
                : 0,
            status: attempt.status,
            submittedAt: attempt.submittedAt,
            startTime: attempt.startTime,
            endTime: attempt.endTime,
            timeTaken,
            totalQuestions,
            answeredQuestions: attempt.answers ? attempt.answers.size : 0,
            exam: {
                _id: exam._id,
                name: exam.name,
                description: exam.description,
                totalMarks: exam.totalMarks,
                passingPercentage: exam.passingPercentage,
                duration: exam.duration,
                category: exam.category,
            }
        };

        return NextResponse.json(result);

    } catch (error) {
        console.error('Error fetching exam result:', error);
        return NextResponse.json(
            { message: 'Internal server error', error: error.message },
            { status: 500 }
        );
    }
}
