import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Exam from '@/models/Exam';
import Subject from '@/models/Subject';
import Category from '@/models/Category';
import Question from '@/models/Question';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');
        const type = searchParams.get('type') || 'all';

        if (!query || query.length < 2) {
            return NextResponse.json({ success: true, results: [] });
        }

        await connectDB();

        const searchRegex = new RegExp(query, 'i');
        let results = [];

        // Search Teachers
        if (type === 'all' || type === 'teachers') {
            const teachers = await User.find({
                role: 'teacher',
                $or: [
                    { name: searchRegex },
                    { email: searchRegex },
                    { username: searchRegex }
                ]
            }).limit(5).select('name email username');

            results.push(...teachers.map(t => ({
                type: 'teachers',
                name: t.name,
                email: t.email,
                username: t.username,
                _id: t._id
            })));
        }

        // Search Students
        if (type === 'all' || type === 'students') {
            const students = await User.find({
                role: 'student',
                $or: [
                    { name: searchRegex },
                    { email: searchRegex },
                    { username: searchRegex }
                ]
            }).limit(5).select('name email username');

            results.push(...students.map(s => ({
                type: 'students',
                name: s.name,
                email: s.email,
                username: s.username,
                _id: s._id
            })));
        }

        // Search Exams
        if (type === 'all' || type === 'exams') {
            const exams = await Exam.find({
                $or: [
                    { name: searchRegex },
                    { description: searchRegex }
                ]
            }).limit(5).select('name description status');

            results.push(...exams.map(e => ({
                type: 'exams',
                name: e.name,
                description: e.description,
                status: e.status,
                _id: e._id
            })));
        }

        // Search Subjects
        if (type === 'all' || type === 'subjects') {
            const subjects = await Subject.find({
                $or: [
                    { name: searchRegex },
                    { description: searchRegex }
                ]
            }).limit(5).select('name description');

            results.push(...subjects.map(s => ({
                type: 'subjects',
                name: s.name,
                description: s.description,
                _id: s._id
            })));
        }

        // Search Categories
        if (type === 'all' || type === 'categories') {
            const categories = await Category.find({
                $or: [
                    { name: searchRegex },
                    { description: searchRegex }
                ]
            }).limit(5).select('name description');

            results.push(...categories.map(c => ({
                type: 'categories',
                name: c.name,
                description: c.description,
                _id: c._id
            })));
        }

        // Search Questions
        if (type === 'all' || type === 'questions') {
            const questions = await Question.find({
                $or: [
                    { questionText: searchRegex },
                    { tips: searchRegex }
                ]
            }).limit(5).select('questionText type marks');

            // Function to strip HTML tags
            const stripHtml = (html) => {
                if (!html) return "";
                return html.replace(/<[^>]*>?/gm, "").trim();
            };

            results.push(...questions.map(q => {
                const cleanText = stripHtml(q.questionText);
                return {
                    type: 'questions',
                    title: cleanText.substring(0, 100),
                    name: cleanText.substring(0, 100),
                    questionType: q.type,
                    marks: q.marks,
                    _id: q._id
                };
            }));
        }

        // Limit total results
        results = results.slice(0, 10);

        return NextResponse.json({ success: true, results });
    } catch (error) {
        console.error('Global search error:', error);
        return NextResponse.json(
            { success: false, error: 'Search failed' },
            { status: 500 }
        );
    }
}
