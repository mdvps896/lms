import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Exam from '@/models/Exam';

async function updateExams() {
    try {
        await dbConnect();
        
        // Update all exams that don't have maxAttempts set
        const result = await Exam.updateMany(
            { $or: [{ maxAttempts: { $exists: false } }, { maxAttempts: null }, { maxAttempts: 1 }] },
            { $set: { maxAttempts: 5 } }
        );
        
        return { 
            success: true, 
            message: `Updated ${result.modifiedCount} exams to have maxAttempts: 5`,
            result
        };
        
    } catch (error) {
        console.error('Error updating exams:', error);
        return { 
            success: false, 
            error: error.message 
        };
    }
}

export async function GET(req) {
    const result = await updateExams();
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
}

export async function POST(req) {
    const result = await updateExams();
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
}