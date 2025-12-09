const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, ...values] = line.split('=');
        if (key && values.length) {
            process.env[key.trim()] = values.join('=').trim();
        }
    });
}

// MongoDB connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
};

// ExamAttempt Schema
const examAttemptSchema = new mongoose.Schema({
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sessionToken: String,
    startedAt: Date,
    submittedAt: Date,
    status: String,
    isActive: Boolean,
    answers: Map,
    score: Number,
    totalMarks: Number,
    percentage: Number,
    passed: Boolean
}, { timestamps: true });

const ExamAttempt = mongoose.models.ExamAttempt || mongoose.model('ExamAttempt', examAttemptSchema);

// Exam Schema (minimal)
const examSchema = new mongoose.Schema({
    title: String,
    settings: Object
}, { timestamps: true });

const Exam = mongoose.models.Exam || mongoose.model('Exam', examSchema);

// User Schema (minimal)
const userSchema = new mongoose.Schema({
    name: String,
    email: String
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Main function to complete old attempts
async function completeOldAttempts() {
    try {
        await connectDB();

        console.log('\n🔍 Finding active/incomplete exam attempts...\n');

        // Find all attempts - check all possible incomplete states
        const oldAttempts = await ExamAttempt.find({
            $or: [
                { status: 'active' },
                { status: 'in-progress' },
                { status: 'started' },
                { status: { $ne: 'submitted' } },
                { isActive: true },
                { submittedAt: null },
                { submittedAt: { $exists: false } }
            ]
        }).populate('exam').populate('user');

        console.log(`📊 Found ${oldAttempts.length} incomplete attempts\n`);

        if (oldAttempts.length === 0) {
            console.log('✅ No incomplete attempts found. All exams are already completed!');
            process.exit(0);
        }

        let updatedCount = 0;
        let errorCount = 0;

        for (const attempt of oldAttempts) {
            try {
                const examTitle = attempt.exam?.title || 'Unknown Exam';
                const userName = attempt.user?.name || 'Unknown User';
                
                console.log(`📝 Processing: ${userName} - ${examTitle}`);
                console.log(`   Status: ${attempt.status || 'undefined'} | Active: ${attempt.isActive}`);

                // Calculate score if not already done
                if (!attempt.score && attempt.answers) {
                    const totalQuestions = attempt.answers.size || Object.keys(attempt.answers).length;
                    attempt.totalMarks = totalQuestions;
                    
                    // Count correct answers (simplified - you may want more complex logic)
                    let correctCount = 0;
                    if (attempt.answers instanceof Map) {
                        for (const [key, value] of attempt.answers) {
                            if (value !== null && value !== undefined && value !== '') {
                                correctCount++;
                            }
                        }
                    } else {
                        correctCount = Object.values(attempt.answers).filter(v => v !== null && v !== undefined && v !== '').length;
                    }
                    
                    attempt.score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
                    attempt.percentage = attempt.score;
                    attempt.passed = attempt.score >= 40; // Default passing percentage
                }

                // Update to submitted status
                attempt.status = 'submitted';
                attempt.isActive = false;
                if (!attempt.submittedAt) {
                    attempt.submittedAt = new Date();
                }

                await attempt.save();
                
                console.log(`   ✅ Marked as submitted | Score: ${attempt.score?.toFixed(2)}%\n`);
                updatedCount++;

            } catch (error) {
                console.error(`   ❌ Error updating attempt:`, error.message);
                errorCount++;
            }
        }

        console.log('\n═════════════════════════════════════════');
        console.log('📊 SUMMARY');
        console.log('═════════════════════════════════════════');
        console.log(`✅ Successfully updated: ${updatedCount}`);
        console.log(`❌ Failed: ${errorCount}`);
        console.log(`📝 Total processed: ${oldAttempts.length}`);
        console.log('═════════════════════════════════════════\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ Script Error:', error);
        process.exit(1);
    }
}

// Run the script
completeOldAttempts();
