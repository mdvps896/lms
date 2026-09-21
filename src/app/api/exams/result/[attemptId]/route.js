import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category'; // Import Category first
import Exam from '@/models/Exam';
import ExamAttempt from '@/models/ExamAttempt';
import { getAuthenticatedUser, hasPermission } from '@/utils/apiAuth';

export async function GET(request, { params }) {
    try {
        await connectDB();

        const currentUser = await getAuthenticatedUser(request);
        if (!currentUser) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { attemptId } = params;

        if (!attemptId) {
            return NextResponse.json(
                { message: 'Attempt ID is required' },
                { status: 400 }
            );
        }

        // Attempts live in TWO places: the standalone ExamAttempt collection
        // (what /exams/start-session returns an id for, and what the modern
        // flow writes) and, historically, embedded in exam.attempts[]. This
        // route only ever looked in the embedded array, so every attempt from
        // the current flow 404'd with "Exam not found" even though the result
        // existed. Look in both, newest storage first.
        let attempt = await ExamAttempt.findById(attemptId);
        let exam = null;
        let ownerId = null;

        if (attempt) {
            exam = await Exam.findById(attempt.exam)
                .populate('category')
                .populate('subjects')
                .populate({ path: 'questionGroups', populate: { path: 'questions' } });
            ownerId = attempt.user?.toString();
        } else {
            exam = await Exam.findOne({ 'attempts._id': attemptId })
                .populate('category')
                .populate('subjects')
                .populate({ path: 'questionGroups', populate: { path: 'questions' } });

            if (exam) {
                attempt = exam.attempts.id(attemptId);
                ownerId = attempt?.userId?.toString();
            }
        }

        if (!attempt || !exam) {
            return NextResponse.json(
                { message: 'Attempt not found' },
                { status: 404 }
            );
        }

        // Only the attempt's owner or staff can view this result
        // 🔒 Staff access requires the analytics permission, not the bare
        // teacher role.
        if (
            ownerId !== (currentUser.id || currentUser._id?.toString()) &&
            !hasPermission(currentUser, 'view_analytics')
        ) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
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
        let timeTaken = attempt.timeTaken; // Using stored value (seconds)
        const attemptStart = attempt.startTime || attempt.startedAt;
        if (!timeTaken && attemptStart && attempt.endTime) {
            const timeDiff = new Date(attempt.endTime) - new Date(attemptStart);
            timeTaken = Math.floor(timeDiff / 1000); // in seconds
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
            startTime: attempt.startTime || attempt.startedAt,
            endTime: attempt.endTime,
            timeTaken,
            totalQuestions,
            answeredQuestions: attempt.answers
                ? (attempt.answers instanceof Map
                    ? attempt.answers.size
                    : Object.keys(attempt.answers).length)
                : 0,
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
