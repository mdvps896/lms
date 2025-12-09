import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Exam from '../../../../models/Exam';
import Question from '../../../../models/Question';
import QuestionGroup from '../../../../models/QuestionGroup';
import ExamAttempt from '../../../../models/ExamAttempt';

export async function GET(request, { params }) {
    try {
        await connectDB();
        
        const { id } = params;
        console.log('Fetching analytics for exam:', id);

        // Get exam details with attempts
        const exam = await Exam.findById(id)
            .populate('category', 'name')
            .populate('subject', 'name')
            .lean();

        if (!exam) {
            return NextResponse.json({ 
                success: false, 
                error: 'Exam not found' 
            }, { status: 404 });
        }

        // Get all completed attempts for this exam from ExamAttempt collection
        const attempts = await ExamAttempt.find({ 
            examId: id,
            status: { $in: ['submitted', 'expired'] }
        })
        .populate('userId', 'name email')
        .lean();

        console.log(`Found ${attempts.length} completed attempts`);

        // Get all question groups for this exam
        const questionGroups = await QuestionGroup.find({ 
            examId: id
        }).lean();

        if (questionGroups.length === 0) {
            return NextResponse.json({
                success: true,
                topicBreakdown: [],
                questionAnalysis: []
            });
        }

        const questionGroupIds = questionGroups.map(qg => qg._id);

        // Get all questions for this exam
        const questions = await Question.find({ 
            questionGroupId: { $in: questionGroupIds } 
        })
        .populate('questionGroupId', 'name category')
        .lean();

        console.log(`Found ${questions.length} questions in ${questionGroups.length} groups`);

        // Calculate real performance per question group (topic)
        const topicPerformance = {};
        
        questionGroups.forEach(group => {
            topicPerformance[group._id.toString()] = {
                totalScore: 0,
                questionCount: 0,
                attemptCount: 0
            };
        });

        // Analyze each attempt to calculate topic performance
        attempts.forEach(attempt => {
            const answers = attempt.answers || [];
            
            answers.forEach(answer => {
                const question = questions.find(q => 
                    q._id.toString() === answer.questionId?.toString()
                );
                
                if (question && question.questionGroupId) {
                    const groupId = question.questionGroupId._id.toString();
                    if (topicPerformance[groupId]) {
                        topicPerformance[groupId].attemptCount++;
                        if (answer.isCorrect) {
                            topicPerformance[groupId].totalScore += 100;
                        }
                    }
                }
            });
        });

        // Create topic breakdown with real scores
        const topicBreakdown = questionGroups.map(group => {
            const groupQuestions = questions.filter(q => 
                q.questionGroupId._id.toString() === group._id.toString()
            );
            
            const perf = topicPerformance[group._id.toString()];
            const avgScore = perf.attemptCount > 0 
                ? Math.round(perf.totalScore / perf.attemptCount) 
                : 0;
            
            return {
                topic: group.name || `${exam.subject?.name || 'General'} - ${group.category || 'Questions'}`,
                questions: groupQuestions.length,
                averageScore: avgScore,
                difficulty: group.difficulty || 'Medium'
            };
        });

        // Calculate real performance per question
        const questionPerformance = {};
        
        questions.forEach(q => {
            questionPerformance[q._id.toString()] = {
                correctCount: 0,
                totalAttempts: 0,
                totalTime: 0
            };
        });

        // Analyze answers from all attempts
        attempts.forEach(attempt => {
            const answers = attempt.answers || [];
            
            answers.forEach(answer => {
                const qId = answer.questionId?.toString();
                if (qId && questionPerformance[qId]) {
                    questionPerformance[qId].totalAttempts++;
                    if (answer.isCorrect) {
                        questionPerformance[qId].correctCount++;
                    }
                    if (answer.timeSpent) {
                        questionPerformance[qId].totalTime += answer.timeSpent;
                    }
                }
            });
        });

        // Create question analysis with real data
        const questionAnalysis = questions.slice(0, 20).map((question, index) => {
            const questionText = question.questionText || question.question || '';
            const qId = question._id.toString();
            const perf = questionPerformance[qId];
            
            // Extract topic from question group or use subject
            const topic = question.questionGroupId?.name || 
                         question.questionGroupId?.category || 
                         exam.subject?.name || 
                         'General';

            // Determine difficulty based on question text length or use default
            let difficulty = 'Medium';
            if (questionText.length < 100) {
                difficulty = 'Easy';
            } else if (questionText.length > 200) {
                difficulty = 'Hard';
            }

            const correctAnswers = perf.correctCount;
            const totalAttempts = perf.totalAttempts;
            const percentage = totalAttempts > 0 ? (correctAnswers / totalAttempts * 100) : 0;
            const avgTime = totalAttempts > 0 ? (perf.totalTime / totalAttempts / 60) : 0; // Convert to minutes
            
            return {
                questionNo: index + 1,
                questionText: questionText.substring(0, 80) + (questionText.length > 80 ? '...' : ''),
                topic: topic,
                difficulty: difficulty,
                correctAnswers: correctAnswers,
                totalAttempts: totalAttempts,
                percentage: Math.round(percentage * 10) / 10,
                avgTime: Math.round(avgTime * 10) / 10
            };
        });

        console.log('Topic breakdown:', topicBreakdown);
        console.log('Question analysis sample:', questionAnalysis.slice(0, 3));

        return NextResponse.json({
            success: true,
            topicBreakdown,
            questionAnalysis
        });

    } catch (error) {
        console.error('Error fetching exam analytics:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to fetch exam analytics' 
        }, { status: 500 });
    }
}