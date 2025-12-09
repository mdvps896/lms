import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ExamAttempt from '@/models/ExamAttempt';
import Exam from '@/models/Exam';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();

        // Debug: Check all attempts first
        const allAttempts = await ExamAttempt.find({}).lean();
        console.log('=== DEBUG: All ExamAttempts in DB:', allAttempts.length);
        
        if (allAttempts.length > 0) {
            console.log('Sample attempt:', {
                id: allAttempts[0]._id,
                status: allAttempts[0].status,
                exam: allAttempts[0].exam,
                hasRecordings: !!allAttempts[0].recordings
            });
        }

        // Find all submitted exam attempts
        const submittedAttempts = await ExamAttempt.find({
            status: 'submitted'
        })
        .populate('exam', 'name')
        .lean();

        console.log('Found submitted attempts:', submittedAttempts.length);

        // Group by exam and count attempts
        const examMap = new Map();

        for (const attempt of submittedAttempts) {
            if (!attempt.exam) continue;

            const examId = attempt.exam._id.toString();
            const examName = attempt.exam.name;

            if (!examMap.has(examId)) {
                examMap.set(examId, {
                    _id: examId,
                    name: examName,
                    totalAttempts: 0,
                    submittedAttempts: 0,
                    recordedAttempts: 0,
                    lastAttempt: new Date(0)
                });
            }

            const examData = examMap.get(examId);
            examData.totalAttempts++;
            examData.submittedAttempts++;

            // Check if recordings exist
            if (attempt.recordings && typeof attempt.recordings === 'object') {
                if (attempt.recordings.cameraVideo || attempt.recordings.screenVideo) {
                    examData.recordedAttempts++;
                }
            }

            // Update last attempt date
            const attemptDate = attempt.submittedAt || attempt.startedAt;
            if (attemptDate > examData.lastAttempt) {
                examData.lastAttempt = attemptDate;
            }
        }

        const exams = Array.from(examMap.values());

        console.log(`Processed ${exams.length} exams with recordings`);

        // Fallback: If no ExamAttempts found, try old Exam.attempts structure
        if (exams.length === 0) {
            console.log('No ExamAttempts found, checking old Exam.attempts structure...');
            
            const oldExams = await Exam.find({
                'attempts.status': 'submitted'
            }).lean();
            
            console.log('Found old exam structure with attempts:', oldExams.length);
            
            for (const exam of oldExams) {
                const submittedAttempts = exam.attempts?.filter(a => a.status === 'submitted') || [];
                const recordedAttempts = submittedAttempts.filter(a => 
                    a.recordings && (a.recordings.cameraVideo || a.recordings.screenVideo)
                ).length;
                
                if (submittedAttempts.length > 0) {
                    const lastAttempt = submittedAttempts.reduce((latest, attempt) => {
                        const attemptDate = attempt.submittedAt || attempt.endTime || attempt.startTime;
                        return attemptDate > latest ? attemptDate : latest;
                    }, new Date(0));
                    
                    exams.push({
                        _id: exam._id.toString(),
                        name: exam.name,
                        totalAttempts: exam.attempts?.length || 0,
                        submittedAttempts: submittedAttempts.length,
                        recordedAttempts: recordedAttempts,
                        lastAttempt: lastAttempt
                    });
                }
            }
            
            console.log(`Found ${exams.length} exams from old structure`);
        }

        console.log('Final exams response:', JSON.stringify(exams, null, 2));

        return NextResponse.json({
            exams
        });
    } catch (error) {
        console.error('Error fetching completed exams:', error);
        return NextResponse.json(
            { message: 'Failed to fetch completed exams', error: error.message },
            { status: 500 }
        );
    }
}
