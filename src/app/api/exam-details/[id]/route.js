import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Exam from '../../../../models/Exam';
import Question from '../../../../models/Question';
import QuestionGroup from '../../../../models/QuestionGroup';
import ExamAttempt from '../../../../models/ExamAttempt';
import User from '../../../../models/User';
import Category from '../../../../models/Category';
import Subject from '../../../../models/Subject';

export async function GET(request, { params }) {
    try {
        await connectDB();

        const { id } = params;
        // Get exam details with populated references
        const exam = await Exam.findById(id)
            .populate('category', 'name')
            .populate('subjects', 'name')
            .lean();

        if (!exam) {
            return NextResponse.json({
                success: false,
                error: 'Exam not found'
            }, { status: 404 });
        }

        // Get question groups and questions count for this exam
        const questionGroups = await QuestionGroup.find({ examId: id }).lean();
        const questionGroupIds = questionGroups.map(qg => qg._id);
        const totalQuestions = await Question.countDocuments({
            questionGroupId: { $in: questionGroupIds }
        });

        // Fetch real student results from BOTH ExamAttempt collection AND embedded attempts
        // First try ExamAttempt collection
        let attempts = await ExamAttempt.find({
            exam: id
        })
            .populate('user', 'name email')
            .lean();

        // If no attempts in ExamAttempt collection, try embedded attempts in Exam document
        if (attempts.length === 0 && exam.attempts && exam.attempts.length > 0) {
            try {
                // Convert embedded attempts to same format
                const userIds = exam.attempts
                    .map(a => a.userId ? a.userId.toString() : null)
                    .filter(Boolean);

                const users = await User.find({ _id: { $in: userIds } }).select('name email').lean();
                const userMap = {};
                users.forEach(u => {
                    if (u && u._id) {
                        userMap[u._id.toString()] = u;
                    }
                });

                attempts = exam.attempts.map(attempt => {
                    const userIdStr = attempt.userId ? attempt.userId.toString() : null;
                    return {
                        _id: attempt._id,
                        exam: id,
                        user: userIdStr ? userMap[userIdStr] : null,
                        startedAt: attempt.startTime,
                        submittedAt: attempt.submittedAt || attempt.endTime,
                        status: attempt.status,
                        answers: attempt.answers,
                        score: attempt.score,
                        percentage: attempt.percentage,
                        updatedAt: attempt.endTime || attempt.startTime
                    };
                });

            } catch (conversionError) {
                console.error('Error converting embedded attempts:', conversionError);
                attempts = [];
            }
        }

        // Transform attempts to student results format
        const studentResults = attempts.map(attempt => {
            // Convert answers Map to array and count correct/wrong answers
            let correctAnswers = 0;
            let totalAnswers = 0;

            if (attempt.answers) {
                const answersMap = attempt.answers instanceof Map ? attempt.answers : new Map(Object.entries(attempt.answers));
                totalAnswers = answersMap.size;

                answersMap.forEach((answer) => {
                    if (answer && answer.isCorrect) {
                        correctAnswers++;
                    }
                });
            }

            const wrongAnswers = totalAnswers - correctAnswers;

            // Calculate percentage from score/totalMarks or use direct percentage field
            let percentage = 0;
            if (attempt.percentage !== undefined && attempt.percentage !== null) {
                percentage = attempt.percentage;
            } else if (attempt.score !== undefined && attempt.totalMarks && attempt.totalMarks > 0) {
                percentage = (attempt.score / attempt.totalMarks) * 100;
            }

            const isPassed = percentage >= (exam.passingPercentage || 60);

            return {
                _id: attempt._id.toString(),
                attemptId: attempt._id.toString(), // Add explicit attemptId field for routing
                studentId: attempt.user?._id?.toString() || 'Unknown',
                studentName: attempt.user?.name || 'Student',
                studentEmail: attempt.user?.email || 'N/A',
                score: Math.round(percentage * 10) / 10,
                percentage: Math.round(percentage * 10) / 10,
                correctAnswers: correctAnswers,
                wrongAnswers: wrongAnswers,
                timeSpent: Math.floor(((attempt.submittedAt - attempt.startedAt) / 1000 / 60) || exam.duration * 0.8), // Convert to minutes
                submittedAt: attempt.submittedAt || attempt.updatedAt,
                status: attempt.status,
                isPassed: isPassed
            };
        });

        // Calculate statistics from real data
        const totalStudents = studentResults.length;
        const completedAttempts = studentResults.filter(r => r.status === 'submitted' || r.status === 'expired').length;
        const averageScore = totalStudents > 0 ?
            studentResults.reduce((sum, r) => sum + r.score, 0) / totalStudents : 0;
        const highestScore = totalStudents > 0 ?
            Math.max(...studentResults.map(r => r.score)) : 0;
        const lowestScore = totalStudents > 0 ?
            Math.min(...studentResults.map(r => r.score)) : 0;
        const passRate = totalStudents > 0 ?
            (studentResults.filter(r => r.isPassed).length / totalStudents) * 100 : 0;

        const examDetails = {
            _id: exam._id,
            title: exam.name || exam.title,
            name: exam.name,
            description: exam.description,
            subject: exam.subjects?.[0]?.name || exam.subject?.name || 'General',
            category: exam.category?.name || 'General',
            totalQuestions: totalQuestions,
            duration: exam.duration,
            passingScore: exam.passingPercentage || exam.passingScore || 60,
            status: exam.status,
            createdAt: exam.createdAt,
            totalStudents: totalStudents,
            completedAttempts: completedAttempts,
            averageScore: Math.round(averageScore * 10) / 10,
            highestScore: highestScore,
            lowestScore: lowestScore,
            passRate: Math.round(passRate * 10) / 10
        };

        return NextResponse.json({
            success: true,
            exam: examDetails,
            studentResults: studentResults,
            questionGroups: questionGroups.length
        });

    } catch (error) {
        console.error('Error fetching exam details:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to fetch exam details'
        }, { status: 500 });
    }
}