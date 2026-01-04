import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/models/Category'; // Import Category first
import Exam from '@/models/Exam';
import ExamAttempt from '@/models/ExamAttempt';
import Question from '@/models/Question';
import { createExamNotification } from '@/utils/examNotifications';
import { requireAdmin, getAuthenticatedUser } from '@/utils/apiAuth';

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const user = getAuthenticatedUser(req);
        const isAdmin = user && user.role === 'admin';

        const exam = await Exam.findById(params.id)
            .populate('category')
            .populate('subjects')
            .populate('questionGroups')
            .lean();

        if (!exam) {
            return NextResponse.json({ success: false, error: 'Exam not found' }, { status: 404 });
        }

        // Only fetch detailed questions if Admin
        if (isAdmin && exam.questionGroups && exam.questionGroups.length > 0) {
            for (let i = 0; i < exam.questionGroups.length; i++) {
                const groupId = exam.questionGroups[i]._id;

                const questions = await Question.find({
                    questionGroup: groupId,
                    status: 'active'
                }).lean();

                exam.questionGroups[i].questions = questions;
            }
        } else if (!isAdmin) {
            // For non-admins, ensure we don't leak empty undefined structure that might be expected?
            // Actually, simply NOT adding questions is safer.
            // But we might want to strip any existing sensitive data if it was auto-populated (it wasn't fully deep populated above).
        }

        // Fetch real attempts - This might be sensitive too. 
        // If student, maybe only their own attempts?
        // But the previous code returned ALL attempts. That is a privacy leak.
        // I will restrict attempts to the current user if not admin.

        let attemptQuery = {
            examId: params.id,
            status: { $in: ['submitted', 'expired'] }
        };

        if (!isAdmin) {
            if (!user) {
                // Public/Unauth access to exam details? Maybe allow basic meta, but NO attempts.
                attemptQuery = null;
            } else {
                attemptQuery.userId = user.id || user._id;
            }
        }

        let attempts = [];
        if (attemptQuery) {
            attempts = await ExamAttempt.find(attemptQuery)
                .populate('userId', 'name email')
                .select('userId score passed timeTaken status submittedAt updatedAt answers')
                .lean();
        }

        // Add attempts array
        exam.attempts = attempts.map(attempt => ({
            userId: attempt.userId?._id,
            userName: attempt.userId?.name || 'Student',
            userEmail: attempt.userId?.email || '',
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
    const authError = requireAdmin(req);
    if (authError) return authError;

    try {
        await dbConnect();

        const currentUser = getAuthenticatedUser(req);
        const body = await req.json();

        const exam = await Exam.findByIdAndUpdate(params.id, body, {
            new: true,
            runValidators: true,
        }).populate('assignedUsers', '_id name email');

        if (!exam) {
            return NextResponse.json({ success: false, error: 'Exam not found' }, { status: 404 });
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
    const authError = requireAdmin(req);
    if (authError) return authError;

    try {
        await dbConnect();
        const exam = await Exam.findByIdAndDelete(params.id);
        if (!exam) {
            return NextResponse.json({ success: false, error: 'Exam not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: {} });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
