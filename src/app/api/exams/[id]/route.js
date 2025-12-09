import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/models/Category'; // Import Category first
import Exam from '@/models/Exam';
import ExamAttempt from '@/models/ExamAttempt';
import { createExamNotification } from '@/utils/examNotifications';
import { cookies } from 'next/headers';

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const exam = await Exam.findById(params.id)
            .populate('category')
            .populate('subjects')
            .populate('questionGroups')
            .lean();
            
        if (!exam) {
            return NextResponse.json({ success: false, error: 'Exam not found' }, { status: 404 });
        }
        
        // Fetch real attempts from ExamAttempt collection
        const attempts = await ExamAttempt.find({ 
            examId: params.id,
            status: { $in: ['submitted', 'expired'] }
        })
        .populate('userId', 'name email')
        .select('userId score passed timeTaken status submittedAt updatedAt answers')
        .lean();
        
        // Add attempts array with real data
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
            answers: attempt.answers || []
        }));
        
        console.log('Fetched exam with attempts:', {
            name: exam.name,
            attemptCount: exam.attempts.length
        });
        
        return NextResponse.json({ success: true, data: exam });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        await dbConnect();
        
        // Get current user from cookies
        const cookieStore = cookies();
        const userCookie = cookieStore.get('currentUser');
        let currentUser = null;
        
        if (userCookie) {
            try {
                currentUser = JSON.parse(userCookie.value);
            } catch (error) {
                console.error('Error parsing user cookie:', error);
            }
        }
        
        const body = await req.json();
        
        // Log the received data for debugging
        console.log('Updating exam with data:', body);
        console.log('maxAttempts in update body:', body.maxAttempts, typeof body.maxAttempts);
        
        const exam = await Exam.findByIdAndUpdate(params.id, body, {
            new: true,
            runValidators: true,
        }).populate('assignedUsers', '_id name email');
        
        if (!exam) {
            return NextResponse.json({ success: false, error: 'Exam not found' }, { status: 404 });
        }
        
        // Log the updated exam to verify save
        console.log('Updated exam saved:', {
            name: exam.name,
            maxAttempts: exam.maxAttempts,
            totalMarks: exam.totalMarks
        });
        console.log('Full updated exam object:', exam.toObject());
        
        // Create notification for exam update
        try {
            await createExamNotification('exam_updated', {
                _id: exam._id,
                name: exam.name,
                startDate: exam.startDate,
                endDate: exam.endDate,
                status: exam.status,
                assignedUsers: exam.assignedUsers.map(user => user._id)
            }, currentUser?.id);
        } catch (notificationError) {
            console.error('Error creating exam update notification:', notificationError);
            // Don't fail the exam update if notification fails
        }
        
        return NextResponse.json({ success: true, data: exam });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function DELETE(req, { params }) {
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
