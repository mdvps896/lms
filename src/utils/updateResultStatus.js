import mongoose from 'mongoose';
import ExamAttempt from '../models/ExamAttempt.js';
import Question from '../models/Question.js';
import Exam from '../models/Exam.js';

async function updateResultStatus() {
    try {
        // Connect to MongoDB
        const MONGODB_URI = 'mongodb+srv://hawk76713_db_user:QPGGcF1aRxTM1Z4f@exam1.xqdis5p.mongodb.net/?appName=exam1';
        await mongoose.connect(MONGODB_URI);
        // Get all submitted exam attempts without resultStatus or with published status
        const attempts = await ExamAttempt.find({ 
            status: 'submitted',
            $or: [
                { resultStatus: { $exists: false } },
                { resultStatus: null },
                { resultStatus: undefined },
                { resultStatus: 'published' }
            ]
        }).lean();

        let updatedCount = 0;
        let draftCount = 0;
        let publishedCount = 0;

        for (const attempt of attempts) {
            // Get exam with question groups
            const exam = await Exam.findById(attempt.exam).lean();
            
            if (!exam) {
                continue;
            }
            
            if (!exam.questionGroups || exam.questionGroups.length === 0) {
                continue;
            }

            // Get all questions from question groups
            const questions = await Question.find({
                questionGroup: { $in: exam.questionGroups }
            }).lean();

            // Check if any question is subjective
            const hasSubjective = questions.some(q => 
                q.type === 'short_answer' || q.type === 'long_answer'
            );

            const subjectiveQuestions = questions.filter(q => 
                q.type === 'short_answer' || q.type === 'long_answer'
            );

            subjectiveQuestions.forEach(q => {
                });

            if (hasSubjective) {
                await ExamAttempt.findByIdAndUpdate(attempt._id, {
                    resultStatus: 'draft',
                    hasSubjectiveQuestions: true
                });
                updatedCount++;
                draftCount++;
                } else {
                await ExamAttempt.findByIdAndUpdate(attempt._id, {
                    resultStatus: 'published',
                    hasSubjectiveQuestions: false
                });
                updatedCount++;
                publishedCount++;
                }
        }

        await mongoose.connection.close();
        } catch (error) {
        console.error('Error updating result status:', error);
        process.exit(1);
    }
}

updateResultStatus();
