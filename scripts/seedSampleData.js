// Seeds one sample Category, Subject, QuestionGroup, a handful of Questions,
// one Exam, and one Course — so the admin doesn't have to hand-create these
// just to have something to click around / test with.
// Safe to run more than once: each document is looked up by name first and
// only created if missing.
// Run with: node scripts/seedSampleData.js

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    isPublished: { type: Boolean, default: true }
}, { timestamps: true });

const SubjectSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

const QuestionGroupSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

const OptionSchema = new mongoose.Schema({
    text: { type: String, default: '' },
    isCorrect: { type: Boolean, default: false },
    order: { type: Number, default: 0 }
}, { _id: false });

const QuestionSchema = new mongoose.Schema({
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    questionGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionGroup', required: true },
    type: { type: String, enum: ['mcq', 'multiple_choice', 'true_false', 'short_answer', 'long_answer'], required: true },
    questionText: { type: String, required: true },
    marks: { type: Number, required: true, min: 0 },
    options: [OptionSchema],
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const ExamSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
    questionGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'QuestionGroup' }],
    type: { type: String, enum: ['live', 'regular'], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    duration: { type: Number, required: true },
    description: { type: String, default: '' },
    totalMarks: { type: Number, required: true },
    passingPercentage: { type: Number, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true, strict: false });

const CourseSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    duration: {
        value: { type: Number, required: true },
        unit: { type: String, enum: ['days', 'months', 'years'], required: true }
    },
    thumbnail: { type: String, required: true },
    isFree: { type: Boolean, default: false },
    price: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive', 'draft'], default: 'active' }
}, { timestamps: true, strict: false });

const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
const Subject = mongoose.models.Subject || mongoose.model('Subject', SubjectSchema);
const QuestionGroup = mongoose.models.QuestionGroup || mongoose.model('QuestionGroup', QuestionGroupSchema);
const Question = mongoose.models.Question || mongoose.model('Question', QuestionSchema);
const Exam = mongoose.models.Exam || mongoose.model('Exam', ExamSchema);
const Course = mongoose.models.Course || mongoose.model('Course', CourseSchema);

const SAMPLE_QUESTIONS = [
    {
        questionText: 'What is the normal resting heart rate for a healthy adult (beats per minute)?',
        options: [
            { text: '40-60', isCorrect: false, order: 0 },
            { text: '60-100', isCorrect: true, order: 1 },
            { text: '100-140', isCorrect: false, order: 2 },
            { text: '140-180', isCorrect: false, order: 3 }
        ]
    },
    {
        questionText: 'Which organ is primarily responsible for filtering blood and producing urine?',
        options: [
            { text: 'Liver', isCorrect: false, order: 0 },
            { text: 'Kidney', isCorrect: true, order: 1 },
            { text: 'Spleen', isCorrect: false, order: 2 },
            { text: 'Pancreas', isCorrect: false, order: 3 }
        ]
    },
    {
        questionText: 'What does "BP" stand for in a clinical setting?',
        options: [
            { text: 'Body Pressure', isCorrect: false, order: 0 },
            { text: 'Blood Pressure', isCorrect: true, order: 1 },
            { text: 'Breathing Pattern', isCorrect: false, order: 2 },
            { text: 'Bone Placement', isCorrect: false, order: 3 }
        ]
    },
    {
        questionText: 'Which of the following is a standard unit for measuring body temperature?',
        options: [
            { text: 'Celsius', isCorrect: true, order: 0 },
            { text: 'Pascal', isCorrect: false, order: 1 },
            { text: 'Newton', isCorrect: false, order: 2 },
            { text: 'Joule', isCorrect: false, order: 3 }
        ]
    },
    {
        questionText: 'What is the primary function of red blood cells?',
        options: [
            { text: 'Fighting infection', isCorrect: false, order: 0 },
            { text: 'Clotting blood', isCorrect: false, order: 1 },
            { text: 'Carrying oxygen', isCorrect: true, order: 2 },
            { text: 'Producing antibodies', isCorrect: false, order: 3 }
        ]
    }
];

async function findOrCreate(Model, filter, data) {
    const existing = await Model.findOne(filter);
    if (existing) return { doc: existing, created: false };
    const doc = await Model.create(data);
    return { doc, created: true };
}

async function seed() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected.');

    const { doc: category, created: catCreated } = await findOrCreate(
        Category,
        { name: 'Sample Category' },
        { name: 'Sample Category', description: 'Auto-seeded sample category for testing', status: 'active', isPublished: true }
    );
    console.log(`${catCreated ? '✅ Created' : 'ℹ️  Found existing'} Category: ${category.name} (${category._id})`);

    const { doc: subject, created: subCreated } = await findOrCreate(
        Subject,
        { name: 'Sample Subject', category: category._id },
        { name: 'Sample Subject', category: category._id, description: 'Auto-seeded sample subject', status: 'active' }
    );
    console.log(`${subCreated ? '✅ Created' : 'ℹ️  Found existing'} Subject: ${subject.name} (${subject._id})`);

    const { doc: group, created: groupCreated } = await findOrCreate(
        QuestionGroup,
        { name: 'Sample Question Group', category: category._id, subject: subject._id },
        { name: 'Sample Question Group', category: category._id, subject: subject._id, description: 'Auto-seeded sample question group', status: 'active' }
    );
    console.log(`${groupCreated ? '✅ Created' : 'ℹ️  Found existing'} QuestionGroup: ${group.name} (${group._id})`);

    const existingQuestionCount = await Question.countDocuments({ questionGroup: group._id });
    let questions;
    if (existingQuestionCount > 0) {
        questions = await Question.find({ questionGroup: group._id });
        console.log(`ℹ️  Found ${questions.length} existing questions in the sample group — skipping question creation`);
    } else {
        questions = await Question.insertMany(
            SAMPLE_QUESTIONS.map(q => ({
                category: category._id,
                subject: subject._id,
                questionGroup: group._id,
                type: 'mcq',
                questionText: q.questionText,
                marks: 1,
                options: q.options,
                status: 'active'
            }))
        );
        console.log(`✅ Created ${questions.length} sample questions`);
    }

    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    const now = new Date();
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days

    const { doc: exam, created: examCreated } = await findOrCreate(
        Exam,
        { name: 'Sample Exam' },
        {
            name: 'Sample Exam',
            category: category._id,
            subjects: [subject._id],
            questionGroups: [group._id],
            type: 'regular',
            startDate: now,
            endDate,
            duration: 30, // minutes
            description: 'Auto-seeded sample exam for testing',
            totalMarks,
            passingPercentage: 40,
            status: 'active'
        }
    );
    console.log(`${examCreated ? '✅ Created' : 'ℹ️  Found existing'} Exam: ${exam.name} (${exam._id})`);

    const { doc: course, created: courseCreated } = await findOrCreate(
        Course,
        { title: 'Sample Course' },
        {
            title: 'Sample Course',
            description: 'Auto-seeded sample course for testing',
            duration: { value: 3, unit: 'months' },
            thumbnail: 'https://placehold.co/600x400?text=Sample+Course',
            isFree: true,
            price: 0,
            status: 'active'
        }
    );
    console.log(`${courseCreated ? '✅ Created' : 'ℹ️  Found existing'} Course: ${course.title} (${course._id})`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Seeding complete. Summary:');
    console.log(`  Category:      ${category.name}`);
    console.log(`  Subject:       ${subject.name}`);
    console.log(`  QuestionGroup: ${group.name} (${questions.length} questions, ${totalMarks} total marks)`);
    console.log(`  Exam:          ${exam.name}`);
    console.log(`  Course:        ${course.title}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await mongoose.connection.close();
    process.exit(0);
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
