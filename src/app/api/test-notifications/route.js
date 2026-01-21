import { NextResponse } from 'next/server'
import dbConnect from '../../../lib/mongodb'
import Exam from '../../../models/Exam'
import User from '../../../models/User'
import { createExamNotification } from '../../../utils/examNotifications'
import { cookies } from 'next/headers'

export async function POST() {
    try {
        await dbConnect()

        // Get current user from cookies
        const cookieStore = cookies()
        const userCookie = cookieStore.get('currentUser')
        let currentUser = null

        if (userCookie) {
            try {
                currentUser = JSON.parse(userCookie.value)
            } catch (error) {
                console.error('Error parsing user cookie:', error)
            }
        }

        // Find all live type exams
        const liveExams = await Exam.find({
            type: 'live'
        }).populate('assignedUsers', '_id name email')

        const notifications = []

        for (const exam of liveExams) {
            try {
                // For testing, create notifications for all users if no assigned users
                let assignedUserIds = exam.assignedUsers?.map(user => user._id) || []

                if (assignedUserIds.length === 0) {
                    // If no assigned users, notify all users (for testing)
                    const allUsers = await User.find({}, '_id')
                    assignedUserIds = allUsers.map(user => user._id)
                }

                // Create exam started notification
                const notification = await createExamNotification('exam_started', {
                    _id: exam._id,
                    name: exam.name,
                    startDate: exam.startDate,
                    endDate: exam.endDate,
                    status: exam.status,
                    assignedUsers: assignedUserIds
                }, currentUser?.id)

                notifications.push(notification)
            } catch (error) {
                console.error(`Error creating notification for exam ${exam.name}:`, error)
            }
        }

        return NextResponse.json({
            success: true,
            message: `Found ${liveExams.length} live exams, created ${notifications.length} notifications`,
            data: {
                examsFound: liveExams.length,
                notificationsCreated: notifications.length,
                examNames: liveExams.map(e => e.name),
                notifications: notifications
            }
        })
    } catch (error) {
        console.error('Error creating test notifications:', error)
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to create test notifications',
                error: error.message
            },
            { status: 500 }
        )
    }
}