import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Question from '@/models/Question';
import { getAuthenticatedUser, requirePermission } from '@/utils/apiAuth';

export async function GET(request, { params }) {
    try {
        await connectDB();

        const authError = await requirePermission(request, 'manage_questions');
        if (authError) return authError;

        const question = await Question.findById(params.id)
            .populate('category', 'name')
            .populate('subject', 'name')
            .populate('questionGroup', 'name');

        if (!question) {
            return NextResponse.json({ success: false, message: 'Question not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: question });
    } catch (error) {
        console.error('Error fetching question:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch question', error: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(request, { params }) {
    try {
        await connectDB();
        const body = await request.json();

        const authError = await requirePermission(request, 'manage_questions');
        if (authError) return authError;

        const user = await getAuthenticatedUser(request);
        let query = { _id: params.id };

        if (user && user.role === 'teacher') {
            const accessScope = user.accessScope || 'own';
            if (accessScope === 'own') {
                query.createdBy = user.id;
            }
        }

        // Handle Restore Action
        if (body.action === 'restore') {
            const question = await Question.findOneAndUpdate(
                query,
                { isDeleted: false, deletedAt: null, status: 'active' },
                { new: true }
            );

            if (!question) {
                return NextResponse.json({ success: false, message: 'Question not found or unauthorized' }, { status: 404 });
            }
            return NextResponse.json({ success: true, message: 'Question restored successfully', data: question });
        }

        const question = await Question.findOneAndUpdate(query, body, { new: true, runValidators: true })
            .populate('category', 'name')
            .populate('subject', 'name')
            .populate('questionGroup', 'name');

        if (!question) {
            return NextResponse.json({ success: false, message: 'Question not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Question updated successfully', data: question });
    } catch (error) {
        console.error('Error updating question:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update question', error: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const force = searchParams.get('force') === 'true';

        const authError = await requirePermission(request, 'manage_questions');
        if (authError) return authError;

        const user = await getAuthenticatedUser(request);
        let query = { _id: params.id };

        if (user && user.role === 'teacher') {
            const accessScope = user.accessScope || 'own';
            if (accessScope === 'own') {
                query.createdBy = user.id;
            }
        }

        let question;
        if (force) {
            // Permanent Delete
            question = await Question.findOneAndDelete(query);
        } else {
            // Soft Delete (Recycle Bin)
            question = await Question.findOneAndUpdate(
                query,
                { isDeleted: true, deletedAt: new Date(), status: 'inactive' },
                { new: true, strict: false }
            );
        }

        if (!question) {
            return NextResponse.json({ success: false, message: 'Question not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: force ? 'Question permanently deleted' : 'Question moved to recycle bin'
        });
    } catch (error) {
        console.error('Error deleting question:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to delete question', error: error.message },
            { status: 500 }
        );
    }
}
