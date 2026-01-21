import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Exam from '@/models/Exam';
import ExamAttempt from '@/models/ExamAttempt';
import User from '@/models/User';
import Category from '@/models/Category';
import Subject from '@/models/Subject';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({
                success: false,
                error: 'User ID is required'
            }, { status: 400 });
        }



        // Get user details
        const user = await User.findById(userId).select('name email role category').lean();

        if (!user) {
            return NextResponse.json({
                success: false,
                error: 'User not found'
            }, { status: 404 });
        }



        if (!user.category) {
            return NextResponse.json({
                success: false,
                error: 'User has no category assigned'
            }, { status: 400 });
        }

        const now = new Date();

        // Get student's exams from their category - same query as /api/exams/student
        const allExams = await Exam.find({ category: user.category })
            .populate('category', 'name')
            .populate('subjects', 'name')
            .sort({ startDate: 1 })
            .lean();

        // Separate upcoming and available test exams
        const myExams = [];
        const testExams = [];

        for (const exam of allExams) {
            const startDate = new Date(exam.startDate);
            const endDate = new Date(exam.endDate);

            let status = 'upcoming';
            if (now >= startDate && now <= endDate) {
                status = 'active';
            } else if (now > endDate) {
                status = 'completed';
            }

            const examData = {
                id: exam._id.toString(),
                title: exam.name,
                subject: exam.subjects?.[0]?.name || 'General',
                category: exam.category?.name || 'General',
                date: exam.startDate,
                time: new Date(exam.startDate).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                duration: `${exam.duration} minutes`,
                status: status,
                type: exam.type,
                totalQuestions: exam.questionGroups?.length || 0,
                difficulty: exam.difficulty || 'Medium'
            };

            // All scheduled and live exams that are upcoming or active
            if (status === 'upcoming' || status === 'active') {
                myExams.push(examData);
            }

            // Test/practice exams that are active go to testExams section
            if ((exam.type === 'test' || exam.type === 'practice') && status === 'active') {
                testExams.push({
                    ...examData,
                    questions: examData.totalQuestions
                });
            }
        }

        // Get student's exam attempts and results
        const attempts = await ExamAttempt.find({ user: userId })
            .populate('exam', 'name subjects category passingPercentage')
            .sort({ submittedAt: -1 })
            .limit(10)
            .lean();

        // If no attempts in ExamAttempt collection, check embedded attempts
        let allAttempts = [...attempts];

        if (attempts.length === 0) {
            const examsWithAttempts = await Exam.find({
                'attempts.userId': userId
            }).select('name subjects category passingPercentage attempts').lean();

            for (const exam of examsWithAttempts) {
                const userAttempts = exam.attempts.filter(
                    a => a.userId.toString() === userId
                );

                for (const attempt of userAttempts) {
                    allAttempts.push({
                        _id: attempt._id,
                        exam: {
                            _id: exam._id,
                            name: exam.name,
                            subjects: exam.subjects,
                            category: exam.category,
                            passingPercentage: exam.passingPercentage
                        },
                        score: attempt.score,
                        percentage: attempt.percentage,
                        submittedAt: attempt.submittedAt || attempt.endTime,
                        status: attempt.status
                    });
                }
            }

        }

        // Transform attempts to results format
        const results = allAttempts
            .filter(attempt => attempt.status === 'submitted' || attempt.status === 'expired')
            .map(attempt => {
                const rawScore = attempt.score || attempt.percentage || 0;
                const score = Math.round(rawScore * 100) / 100; // Round to 2 decimal places
                const passingScore = attempt.exam?.passingPercentage || 60;
                const isPassed = score >= passingScore;

                // Calculate grade
                let grade = 'F';
                if (score >= 90) grade = 'A+';
                else if (score >= 85) grade = 'A';
                else if (score >= 80) grade = 'B+';
                else if (score >= 75) grade = 'B';
                else if (score >= 70) grade = 'C+';
                else if (score >= 60) grade = 'C';
                else if (score >= 50) grade = 'D';

                return {
                    id: attempt._id.toString(),
                    examTitle: attempt.exam?.name || 'Unknown Exam',
                    subject: attempt.exam?.subjects?.[0]?.name || 'General',
                    score: score,
                    totalMarks: 100,
                    percentage: Math.round(score * 100) / 100, // Round to 2 decimal places
                    grade: grade,
                    date: attempt.submittedAt ?
                        new Date(attempt.submittedAt).toLocaleDateString('en-US') :
                        'N/A',
                    status: isPassed ? 'passed' : 'failed'
                };
            });

        return NextResponse.json({
            success: true,
            data: {
                myExams: myExams,
                testExams: testExams,
                results: results
            },
            message: `Found ${myExams.length} scheduled exams, ${testExams.length} practice tests, and ${results.length} results`
        });

    } catch (error) {
        console.error('Error fetching student dashboard data:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to fetch dashboard data'
        }, { status: 500 });
    }
}
