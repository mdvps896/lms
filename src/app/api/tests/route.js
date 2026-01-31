import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import connectDB from '@/lib/mongodb';
import Exam from '@/models/Exam';
import Question from '@/models/Question';

export async function GET(request) {
    try {
        await connectDB();
        const exams = await Exam.find({})
            .populate('category', 'name')
            .populate('subjects', 'name')
            .populate('questionGroups', '_id')
            .select('name category subjects questionGroups createdAt')
            .sort({ createdAt: -1 });

        // Transform data to include question count
        const transformedExams = await Promise.all(exams.map(async (exam) => {
            let totalQuestions = 0;

            if (exam.questionGroups && exam.questionGroups.length > 0) {
                const groupIds = exam.questionGroups.map(g => g._id);
                totalQuestions = await Question.countDocuments({
                    questionGroup: { $in: groupIds }
                });
            }

            return {
                _id: exam._id,
                title: exam.name,
                category: exam.category,
                subjects: exam.subjects,
                questions: { length: totalQuestions },
                createdAt: exam.createdAt
            };
        }));

        return NextResponse.json({ success: true, data: transformedExams });
    } catch (error) {
        console.error('Error fetching tests:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
