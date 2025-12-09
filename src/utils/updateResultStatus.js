import mongoose from 'mongoose';
import ExamAttempt from '../models/ExamAttempt.js';
import Question from '../models/Question.js';
import Exam from '../models/Exam.js';

async function updateResultStatus() {
    try {
        // Connect to MongoDB
        const MONGODB_URI = 'mongodb+srv://hawk76713_db_user:QPGGcF1aRxTM1Z4f@exam1.xqdis5p.mongodb.net/?appName=exam1';
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

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

        console.log(`Found ${attempts.length} exam attempts to process`);

        let updatedCount = 0;
        let draftCount = 0;
        let publishedCount = 0;

        for (const attempt of attempts) {
            console.log(`\nProcessing attempt ${attempt._id}`);
            
            // Get exam with question groups
            const exam = await Exam.findById(attempt.exam).lean();
            
            if (!exam) {
                console.log(`Skipping - exam not found`);
                continue;
            }
            
            console.log('Exam ID:', exam._id);
            console.log('Question Groups:', exam.questionGroups);
            
            if (!exam.questionGroups || exam.questionGroups.length === 0) {
                console.log(`Skipping - no question groups`);
                continue;
            }

            // Get all questions from question groups
            const questions = await Question.find({
                questionGroup: { $in: exam.questionGroups }
            }).lean();

            console.log(`Found ${questions.length} questions`);

            // Check if any question is subjective
            const hasSubjective = questions.some(q => 
                q.type === 'short_answer' || q.type === 'long_answer'
            );

            const subjectiveQuestions = questions.filter(q => 
                q.type === 'short_answer' || q.type === 'long_answer'
            );

            console.log(`Subjective questions: ${subjectiveQuestions.length}`);
            subjectiveQuestions.forEach(q => {
                console.log(`  - ${q._id}: ${q.type}`);
            });

            if (hasSubjective) {
                await ExamAttempt.findByIdAndUpdate(attempt._id, {
                    resultStatus: 'draft',
                    hasSubjectiveQuestions: true
                });
                updatedCount++;
                draftCount++;
                console.log(`✅ Updated to DRAFT`);
            } else {
                await ExamAttempt.findByIdAndUpdate(attempt._id, {
                    resultStatus: 'published',
                    hasSubjectiveQuestions: false
                });
                updatedCount++;
                publishedCount++;
                console.log(`✅ Updated to PUBLISHED`);
            }
        }

        console.log(`\n========== SUMMARY ==========`);
        console.log(`Total processed: ${updatedCount}`);
        console.log(`Set to DRAFT: ${draftCount}`);
        console.log(`Set to PUBLISHED: ${publishedCount}`);
        
        await mongoose.connection.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error updating result status:', error);
        process.exit(1);
    }
}

updateResultStatus();
