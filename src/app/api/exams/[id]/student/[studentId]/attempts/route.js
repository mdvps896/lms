import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ExamAttempt from '@/models/ExamAttempt';
import User from '@/models/User';
import Exam from '@/models/Exam';

export async function GET(request, { params }) {
    try {
        await dbConnect();

        const { id: examId, studentId } = params;

        // Get student details
        const student = await User.findById(studentId, 'name email rollNo').lean();
        
        if (!student) {
            return NextResponse.json(
                { success: false, message: 'Student not found' },
                { status: 404 }
            );
        }

        // Get exam details for passing percentage
        const exam = await Exam.findById(examId).lean();

        // Get all attempts for this student and exam
        const attempts = await ExamAttempt.find({
            exam: examId,
            user: studentId,
            status: 'submitted'
        })
            .sort({ submittedAt: -1 })
            .lean();

        // Format attempts
        const formattedAttempts = attempts.map(attempt => {
            const percentage = attempt.percentage || 0;
            const passingPercentage = exam?.passingPercentage || 50;
            
            // Calculate time taken
            let timeTaken = null;
            if (attempt.submittedAt && attempt.startedAt) {
                timeTaken = Math.floor((new Date(attempt.submittedAt) - new Date(attempt.startedAt)) / 1000);
            }

            return {
                _id: attempt._id,
                percentage,
                score: attempt.score,
                totalMarks: attempt.totalMarks,
                passed: percentage >= passingPercentage,
                resultStatus: attempt.resultStatus || 'published',
                hasSubjectiveQuestions: attempt.hasSubjectiveQuestions || false,
                submittedAt: attempt.submittedAt,
                timeTaken
            };
        });

        return NextResponse.json({
            success: true,
            student,
            attempts: formattedAttempts
        });

    } catch (error) {
        console.error('Error fetching student attempts:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch student attempts', error: error.message },
            { status: 500 }
        );
    }
}
