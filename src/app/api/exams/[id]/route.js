import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/models/Category'; // Import Category first
import Exam from '@/models/Exam';
import ExamAttempt from '@/models/ExamAttempt';
import Question from '@/models/Question';
import { createExamNotification } from '@/utils/examNotifications';
import { requireAdmin, requirePermission, getAuthenticatedUser } from '@/utils/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const user = await getAuthenticatedUser(req);
        const isAdmin = user && user.role === 'admin';
        const isTeacher = user && user.role === 'teacher';

        let query = { _id: params.id };
        if (isTeacher) {
            const accessScope = user.accessScope || 'own';
            if (accessScope === 'own') {
                query.createdBy = user.id;
            }
        }

        const exam = await Exam.findOne(query)
            .populate('category')
            .populate('subjects')
            .populate('questionGroups')
            .lean();

        if (!exam) {
            return NextResponse.json({ success: false, error: 'Exam not found or unauthorized' }, { status: 404 });
        }

        // Populate questions for all users (students need them to take the test!)
        // Only difference: admins/teachers might see additional metadata in the future
        if (exam.questionGroups && exam.questionGroups.length > 0) {
            // Create a new array to store question groups with questions
            const populatedGroups = [];

            for (let i = 0; i < exam.questionGroups.length; i++) {
                const group = exam.questionGroups[i];
                const groupId = group._id;

                // Fetch actual questions
                const questions = await Question.find({
                    questionGroup: groupId,
                    status: 'active'
                }).lean();

                // Create a new object with questions included
                populatedGroups.push({
                    ...group,
                    questions: questions
                });
            }

            // Replace the questionGroups array with the populated one
            exam.questionGroups = populatedGroups;
        }

        // Fetch attempts
        // If student, only their own attempts.
        // If teacher/admin, all attempts (subject to exam visibility which we checked above).

        let attemptQuery = {
            exam: params.id,
            status: { $in: ['submitted', 'expired'] }
        };

        if (user && user.role === 'student') {
            attemptQuery.user = user.id || user._id;
        } else if (!user) {
            attemptQuery = null; // Public - no attempts
        }
        // Admin/Teacher see all attempts for this exam (since we already verified they can see the exam)

        let attempts = [];
        if (attemptQuery) {
            attempts = await ExamAttempt.find(attemptQuery)
                .populate('user', 'name email')
                .select('user score passed timeTaken status submittedAt updatedAt answers')
                .lean();
        }

        // Add attempts array
        exam.attempts = attempts.map(attempt => ({
            userId: attempt.user?._id,
            userName: attempt.user?.name || 'Student',
            userEmail: attempt.user?.email || '',
            score: attempt.score || 0,
            passed: attempt.passed || false,
            timeTaken: attempt.timeTaken || 0,
            status: attempt.status,
            submittedAt: attempt.submittedAt || attempt.updatedAt,
            updatedAt: attempt.updatedAt,
            answers: attempt.answers || [] // Answers might be sensitive if they reveal correct ones, but these are USER answers.
        }));

        return NextResponse.json({ success: true, data: exam });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    // Security check
    const authError = await requirePermission(req, 'manage_exams');
    if (authError) return authError;

    try {
        await dbConnect();

        const currentUser = await getAuthenticatedUser(req);
        const body = await req.json();

        let query = { _id: params.id };
        if (currentUser && currentUser.role === 'teacher') {
            const accessScope = currentUser.accessScope || 'own';
            if (accessScope === 'own') {
                query.createdBy = currentUser.id;
            }
        }

        const exam = await Exam.findOneAndUpdate(query, body, {
            new: true,
            runValidators: true,
        }).populate('assignedUsers', '_id name email');

        if (!exam) {
            return NextResponse.json({ success: false, error: 'Exam not found or unauthorized' }, { status: 404 });
        }

        // Create notification for exam update
        try {
            await createExamNotification('exam_updated', {
                _id: exam._id,
                name: exam.name,
                startDate: exam.startDate,
                endDate: exam.endDate,
                status: exam.status,
                assignedUsers: exam.assignedUsers.map(user => user._id)
            }, currentUser?.id || currentUser?._id);
        } catch (notificationError) {
            // Don't fail the exam update if notification fails
        }

        return NextResponse.json({ success: true, data: exam });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function DELETE(req, { params }) {
    // Security check
    const authError = await requirePermission(req, 'manage_exams');
    if (authError) return authError;

    try {
        await dbConnect();

        const currentUser = await getAuthenticatedUser(req);

        let query = { _id: params.id };
        if (currentUser && currentUser.role === 'teacher') {
            const accessScope = currentUser.accessScope || 'own';
            if (accessScope === 'own') {
                query.createdBy = currentUser.id;
            }
        }

        const exam = await Exam.findOneAndDelete(query);
        if (!exam) {
            return NextResponse.json({ success: false, error: 'Exam not found or unauthorized' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: {} });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
