import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/models/Category'; // Import Category first
import Exam from '@/models/Exam';
import ExamAttempt from '@/models/ExamAttempt';
import QuestionGroup from '@/models/QuestionGroup'; // Import QuestionGroup
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
            let totalFound = 0;

            for (let i = 0; i < exam.questionGroups.length; i++) {
                const group = exam.questionGroups[i];
                // Handle both populated object and unpopulated ID
                const groupId = group._id || group;

                // Fetch actual questions
                const questions = await Question.find({
                    questionGroup: groupId,
                    status: 'active'
                }).lean();

                totalFound += questions.length;

                // Create a new object with questions included
                populatedGroups.push({
                    ...group,
                    questions: questions
                });
            }

            // Replace the questionGroups array with the populated one
            exam.questionGroups = populatedGroups;
        }

        // Add empty attempts array for backward compatibility with UI if needed,
        // but avoid heavy population. Admin should use analytics page for results.
        exam.attempts = [];

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
