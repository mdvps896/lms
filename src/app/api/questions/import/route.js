import dbConnect from '../../../../lib/mongodb';
import Question from '../../../../models/Question';
import QuestionGroup from '../../../../models/QuestionGroup';
import Subject from '../../../../models/Subject';
import Category from '../../../../models/Category';

export async function POST(request) {
    try {
        await dbConnect();

        const body = await request.json();
        const { questions } = body;

        if (!questions || !Array.isArray(questions)) {
            return Response.json({ 
                success: false, 
                error: 'Invalid questions data' 
            }, { status: 400 });
        }

        let imported = 0;
        let errors = [];

        for (let i = 0; i < questions.length; i++) {
            const questionData = questions[i];
            
            try {
                console.log(`Processing question ${i + 1}:`, questionData);
                
                // More lenient validation - check if any required field exists
                const hasQuestionText = questionData.questionText || questionData.question || questionData['Question Text'];
                const hasOptions = questionData.options || 
                    (questionData['Option A'] || questionData.optionA);
                const hasCorrectAnswer = questionData.correctAnswer || questionData['Correct Answer'];
                
                if (!hasQuestionText || !hasCorrectAnswer) {
                    const missing = [];
                    if (!hasQuestionText) missing.push('Question Text');
                    if (!hasCorrectAnswer) missing.push('Correct Answer');
                    errors.push(`Row ${i + 1}: Missing required fields: ${missing.join(', ')}`);
                    console.log(`Row ${i + 1}: Missing fields:`, missing);
                    continue;
                }

                // Find or create default category, subject, and question group
                let categoryId = null;
                let subjectId = null;
                let questionGroupId = null;

                // Get or create default category
                let category = await Category.findOne({ name: 'General' });
                if (!category) {
                    category = await Category.create({ 
                        name: 'General',
                        status: 'active'
                    });
                }
                categoryId = category._id;

                // Get or create default subject
                let subject = await Subject.findOne({ name: 'General' });
                if (!subject) {
                    subject = await Subject.create({ 
                        name: 'General',
                        category: categoryId,
                        status: 'active'
                    });
                }
                subjectId = subject._id;

                // Find or create question group
                const groupName = questionData.questionGroup || questionData['Question Group'] || 'General';
                let questionGroup = await QuestionGroup.findOne({ name: groupName });
                if (!questionGroup) {
                    questionGroup = await QuestionGroup.create({ 
                        name: groupName,
                        subject: subjectId,
                        category: categoryId,
                        status: 'active'
                    });
                }
                questionGroupId = questionGroup._id;

                // Prepare options array
                let optionsArray = [];
                const questionType = questionData.type || questionData['Question Type'] || 'mcq';
                
                if (questionType === 'short_answer' || questionType === 'long_answer') {
                    // For text-based questions, no options needed
                    optionsArray = [];
                } else if (questionType === 'true_false') {
                    // For true/false questions
                    optionsArray = [
                        { text: 'True', isCorrect: false, order: 0 },
                        { text: 'False', isCorrect: false, order: 1 }
                    ];
                } else {
                    // For MCQ and multiple choice
                    const optA = questionData['Option A'] || questionData.optionA || '';
                    const optB = questionData['Option B'] || questionData.optionB || '';
                    const optC = questionData['Option C'] || questionData.optionC || '';
                    const optD = questionData['Option D'] || questionData.optionD || '';
                    
                    const options = [optA, optB, optC, optD].filter(opt => opt && opt.trim());
                    optionsArray = options.map((opt, index) => ({
                        text: opt.trim(),
                        isCorrect: false,
                        order: index
                    }));
                }

                // Handle multiple correct answers (comma-separated)
                let correctAnswer = hasCorrectAnswer;
                if (typeof correctAnswer === 'string' && correctAnswer.includes(',')) {
                    // Split comma-separated answers and trim whitespace
                    const correctAnswers = correctAnswer.split(',').map(ans => ans.trim());
                    
                    // Mark correct options
                    correctAnswers.forEach(ans => {
                        const answerIndex = ['A', 'B', 'C', 'D'].indexOf(ans.toUpperCase());
                        if (answerIndex >= 0 && optionsArray[answerIndex]) {
                            optionsArray[answerIndex].isCorrect = true;
                        }
                    });
                } else if (questionType !== 'short_answer' && questionType !== 'long_answer') {
                    // Single correct answer
                    const answerIndex = ['A', 'B', 'C', 'D'].indexOf(correctAnswer.toUpperCase());
                    if (answerIndex >= 0 && optionsArray[answerIndex]) {
                        optionsArray[answerIndex].isCorrect = true;
                    }
                }

                // Create question object (no correctAnswer field - it's in options.isCorrect)
                const newQuestion = {
                    questionText: hasQuestionText,
                    options: optionsArray,
                    type: questionType,
                    marks: 1,
                    difficulty: questionData.difficulty || questionData['Difficulty'] || 'Medium',
                    status: 'active',
                    category: categoryId,
                    subject: subjectId,
                    questionGroup: questionGroupId
                };

                console.log(`Creating question ${i + 1}:`, newQuestion);

                // Create question
                await Question.create(newQuestion);
                imported++;
                console.log(`Successfully imported question ${i + 1}`);

            } catch (error) {
                console.error(`Error importing question ${i + 1}:`, error);
                errors.push(`Row ${i + 1}: ${error.message}`);
            }
        }

        console.log(`Import completed: ${imported} imported out of ${questions.length} total`);
        console.log('Errors:', errors);

        return Response.json({ 
            success: true, 
            imported,
            total: questions.length,
            errors: errors.length > 0 ? errors : undefined,
            message: `Successfully imported ${imported} out of ${questions.length} questions`
        });

    } catch (error) {
        console.error('Import error:', error);
        return Response.json({ 
            success: false, 
            error: 'Failed to import questions' 
        }, { status: 500 });
    }
}