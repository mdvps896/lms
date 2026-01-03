import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ExamAttempt from '@/models/ExamAttempt';
import { cookies } from 'next/headers';

export async function POST(req) {
    try {
        await dbConnect();

        const body = await req.json();
        const { examId, answers, score, totalMarks, timeTaken, passed: bodyPassed, status, userId } = body;

        // Get user ID from request body (mobile app) or cookies (web app)
        let currentUserId = userId;

        if (!currentUserId) {
            // Try to get from cookies (web app)
            const cookieStore = cookies();
            const userCookie = cookieStore.get('currentUser');

            if (userCookie) {
                try {
                    const currentUser = JSON.parse(userCookie.value);
                    currentUserId = currentUser.id;
                } catch (error) {
                    console.error('Error parsing user cookie:', error);
                }
            }
        }

        if (!currentUserId) {
            return NextResponse.json({
                success: false,
                error: 'User not authenticated'
            }, { status: 401 });
        }

        // Generate unique session token
        const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        console.log('📝 Creating exam attempt for user:', currentUserId, 'Exam:', examId);
        console.log('📊 Stats from body - Score:', score, 'Total Marks:', totalMarks, 'Passed:', bodyPassed);

        const scoreNum = Number(score) || 0;
        const totalMarksNum = Number(totalMarks) || (scoreNum > 0 ? scoreNum : 100);
        const percentage = totalMarksNum > 0 ? (scoreNum / totalMarksNum * 100) : 0;

        // Calculate passed status
        let finalPassed = bodyPassed;

        try {
            const Exam = (await import('@/models/Exam')).default;
            const exam = await Exam.findById(examId);

            if (exam) {
                const passCriteria = Number(exam.passingPercentage) || 40;
                finalPassed = percentage >= passCriteria;
                console.log(`✅ Exam found. Passing Criteria: ${passCriteria}, User Percentage: ${percentage}, Result: ${finalPassed}`);
            } else {
                console.log('⚠️ Exam not found in database, falling back to body/default criteria');
                if (finalPassed === undefined) finalPassed = percentage >= 40;
            }
        } catch (error) {
            console.error('❌ Error fetching exam for pass check:', error);
            if (finalPassed === undefined) finalPassed = percentage >= 40;
        }

        // Create exam attempt
        const examAttempt = await ExamAttempt.create({
            user: currentUserId,
            exam: examId,
            sessionToken,
            answers: answers || {},
            score: scoreNum,
            totalMarks: totalMarksNum,
            percentage,
            timeTaken: Number(timeTaken) || 0,
            passed: finalPassed,
            status: status || 'submitted',
            submittedAt: new Date(),
        });

        console.log('✅ Exam attempt created:', examAttempt._id);

        return NextResponse.json({
            success: true,
            data: examAttempt
        });
    } catch (error) {
        console.error('❌ Error creating exam attempt:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        await dbConnect();

        // Get userId from query parameter (mobile app) or cookies (web app)
        const { searchParams } = new URL(req.url);
        let currentUserId = searchParams.get('userId');

        if (!currentUserId) {
            // Try to get from cookies (web app)
            const cookieStore = cookies();
            const userCookie = cookieStore.get('currentUser');

            if (userCookie) {
                try {
                    const currentUser = JSON.parse(userCookie.value);
                    currentUserId = currentUser.id;
                } catch (error) {
                    console.error('Error parsing user cookie:', error);
                }
            }
        }

        if (!currentUserId) {
            return NextResponse.json({
                success: false,
                error: 'User not authenticated'
            }, { status: 401 });
        }

        console.log('📋 Fetching exam attempts for user:', currentUserId);

        // Get user's exam attempts (use 'user' field, not 'userId')
        const attempts = await ExamAttempt.find({ user: currentUserId })
            .populate('exam', 'name category')
            .sort({ submittedAt: -1 })
            .lean();

        console.log(`✅ Found ${attempts.length} exam attempts`);

        return NextResponse.json({
            success: true,
            data: attempts
        });
    } catch (error) {
        console.error('❌ Error fetching exam attempts:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
