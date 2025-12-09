import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '../../../lib/mongodb'
import { checkExamStatusAndNotify } from '../../../utils/examNotifications'

export async function GET() {
    try {
        await dbConnect()
        
        // Check for exams that should trigger notifications
        const result = await checkExamStatusAndNotify()
        
        return NextResponse.json({
            success: true,
            message: `Checked exam status - ${result.started} exams started, ${result.ended} exams ended`,
            data: result
        })
    } catch (error) {
        console.error('Error in exam status check:', error)
        return NextResponse.json(
            { 
                success: false, 
                message: 'Failed to check exam status',
                error: error.message 
            },
            { status: 500 }
        )
    }
}