import dbConnect from '../../../../lib/mongodb';
import Question from '../../../../models/Question';
import QuestionGroup from '../../../../models/QuestionGroup';

export async function POST(request) {
    try {
        await dbConnect();

        const body = await request.json();
        const { questionIds, exportAll } = body;

        let questions;

        if (exportAll) {
            // Export all questions with populated question groups
            questions = await Question.find({})
                .populate('questionGroup', 'name')
                .lean();
        } else if (questionIds && questionIds.length > 0) {
            // Export selected questions
            questions = await Question.find({ _id: { $in: questionIds } })
                .populate('questionGroup', 'name')
                .lean();
        } else {
            return Response.json({ 
                success: false, 
                error: 'No questions specified for export' 
            }, { status: 400 });
        }

        // Format questions for CSV export
        const formattedQuestions = questions.map(question => {
            // Extract correct answers from options array
            let correctAnswerStr = '';
            if (question.options && question.options.length > 0) {
                const correctIndices = [];
                question.options.forEach((option, index) => {
                    if (option.isCorrect) {
                        correctIndices.push(String.fromCharCode(65 + index)); // Convert 0->A, 1->B, etc.
                    }
                });
                correctAnswerStr = correctIndices.join(',');
            }
            
            return {
                questionText: question.questionText || question.question,
                options: question.options || [],
                correctAnswer: correctAnswerStr,
                type: question.type || 'mcq',
                questionGroup: question.questionGroup?.name || 'General',
                difficulty: question.difficulty || 'Medium'
            };
        });

        return Response.json({ 
            success: true, 
            questions: formattedQuestions,
            count: formattedQuestions.length
        });

    } catch (error) {
        console.error('Export error:', error);
        return Response.json({ 
            success: false, 
            error: 'Failed to export questions' 
        }, { status: 500 });
    }
}