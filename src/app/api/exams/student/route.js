import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Exam from '@/models/Exam'
import Subject from '@/models/Subject'
import Category from '@/models/Category'
import Question from '@/models/Question'

export async function GET(request) {
    try {
        await connectDB()
        
        // Ensure models are registered
        const SubjectModel = Subject
        const CategoryModel = Category

        const { searchParams } = new URL(request.url)
        const category = searchParams.get('category')
        const status = searchParams.get('status')
        const type = searchParams.get('type')
        const subject = searchParams.get('subject')
        
        if (!category) {
            return NextResponse.json({
                success: false,
                message: 'Category is required'
            }, { status: 400 })
        }

        console.log('Fetching exams for category:', category)

        // Build query for category-filtered exams
        let query = { category: category }

        // Add additional filters
        if (type && type !== 'all') {
            query.type = type
        }

        if (subject && subject !== '') {
            query.subjects = { $in: [subject] }  // subjects is an array, so use $in operator
        }

        // Get exams first without populate
        console.log('Query:', query)
        
        const exams = await Exam.find(query)
            .sort({ startDate: 1 })
            .lean()
            
        console.log('Found exams:', exams.length)
        console.log('First exam maxAttempts:', exams[0]?.maxAttempts)
        
        // Manually populate subjects and categories
        for (let exam of exams) {
            // Populate subjects
            if (exam.subjects && exam.subjects.length > 0) {
                const subjectIds = exam.subjects
                const subjects = await Subject.find({ _id: { $in: subjectIds } }, 'name').lean()
                exam.subjects = subjects
                console.log('Populated subjects for exam:', exam.name, subjects)
            }
            
            // Populate category
            if (exam.category) {
                const category = await Category.findById(exam.category, 'name').lean()
                exam.category = category
            }
        }

        // Add computed fields for frontend
        const enrichedExams = await Promise.all(exams.map(async (exam) => {
            const now = new Date()
            const startDate = new Date(exam.startDate)
            const endDate = new Date(exam.endDate)
            
            let computedStatus = 'upcoming'
            if (now >= startDate && now <= endDate) {
                computedStatus = 'active'
            } else if (now > endDate) {
                computedStatus = 'completed'
            }

            // Get actual question count from Question collection
            let totalQuestions = 0
            if (exam.questionGroups && exam.questionGroups.length > 0) {
                totalQuestions = await Question.countDocuments({
                    questionGroup: { $in: exam.questionGroups }
                })
                console.log(`Exam "${exam.name}" - Question Groups: ${exam.questionGroups.length}, Total Questions: ${totalQuestions}`)
            } else {
                console.log(`Exam "${exam.name}" - No question groups assigned`)
            }

            return {
                ...exam,
                computedStatus,
                totalQuestions
            }
        }))

        // Apply status filter after computation
        let filteredExams = enrichedExams
        if (status && status !== 'all') {
            switch (status) {
                case 'current':
                    filteredExams = enrichedExams.filter(exam => exam.computedStatus === 'active')
                    break
                case 'upcoming':
                    filteredExams = enrichedExams.filter(exam => exam.computedStatus === 'upcoming')
                    break
                case 'completed':
                    filteredExams = enrichedExams.filter(exam => exam.computedStatus === 'completed')
                    break
                case 'live':
                    filteredExams = enrichedExams.filter(exam => 
                        exam.type === 'live' && exam.computedStatus === 'active'
                    )
                    break
            }
        }

        return NextResponse.json({
            success: true,
            data: filteredExams,
            message: `Found ${filteredExams.length} exams for your category`
        })

    } catch (error) {
        console.error('Error fetching student exams:', error)
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch exams',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 })
    }
}