import Notification from '../models/Notification';
import User from '../models/User';
import Exam from '../models/Exam';

export const createExamNotification = async (type, examData, createdBy) => {
    try {
        let title, message;
        
        switch (type) {
            case 'exam_created':
                title = 'New Exam Created';
                message = `Exam "${examData.name}" has been created and is now available.`;
                break;
            case 'exam_started':
                title = 'Exam Started';
                message = `Exam "${examData.name}" has started and is now live.`;
                break;
            case 'exam_ended':
                title = 'Exam Ended';
                message = `Exam "${examData.name}" has ended.`;
                break;
            case 'exam_updated':
                title = 'Exam Updated';
                message = `Exam "${examData.name}" has been updated.`;
                break;
            default:
                title = 'Exam Notification';
                message = `Update for exam "${examData.name}".`;
        }

        // Get all users who should receive this notification
        let recipients = [];
        
        if (type === 'exam_created' || type === 'exam_updated') {
            // Notify assigned users and all admins/teachers
            const assignedUsers = examData.assignedUsers || [];
            const adminTeachers = await User.find({ 
                role: { $in: ['admin', 'teacher'] } 
            }).select('_id');
            
            const allUserIds = [
                ...assignedUsers,
                ...adminTeachers.map(user => user._id)
            ];
            
            // Remove duplicates
            const uniqueUserIds = [...new Set(allUserIds.map(id => id.toString()))];
            recipients = uniqueUserIds.map(userId => ({
                userId,
                read: false
            }));
        } else if (type === 'exam_started' || type === 'exam_ended') {
            // Notify assigned users
            if (examData.assignedUsers && examData.assignedUsers.length > 0) {
                recipients = examData.assignedUsers.map(userId => ({
                    userId,
                    read: false
                }));
            }
        }

        // Create notification
        const notification = new Notification({
            title,
            message,
            type,
            data: {
                examId: examData._id,
                examName: examData.name,
                startTime: examData.startDate,
                endTime: examData.endDate,
                status: examData.status
            },
            recipients,
            createdBy,
            status: 'active'
        });

        await notification.save();
        return notification;
    } catch (error) {
        console.error('Error creating exam notification:', error);
        throw error;
    }
};

export const createNotificationForLiveExam = async (examId, notificationType = 'exam_started') => {
    try {
        const exam = await Exam.findById(examId)
            .populate('assignedUsers', '_id name email');
            
        if (!exam) {
            throw new Error('Exam not found');
        }

        // Create notification based on exam status
        let type = notificationType;
        if (exam.type === 'live' && exam.status === 'active') {
            const now = new Date();
            const startDate = new Date(exam.startDate);
            const endDate = new Date(exam.endDate);
            
            if (now >= startDate && now <= endDate) {
                type = 'exam_started';
            } else if (now > endDate) {
                type = 'exam_ended';
            }
        }

        const notification = await createExamNotification(type, {
            _id: exam._id,
            name: exam.name,
            startDate: exam.startDate,
            endDate: exam.endDate,
            status: exam.status,
            assignedUsers: exam.assignedUsers.map(user => user._id)
        }, exam.createdBy);

        return notification;
    } catch (error) {
        console.error('Error creating notification for live exam:', error);
        throw error;
    }
};

export const checkExamStatusAndNotify = async () => {
    try {
        const now = new Date();
        
        // Find exams that should be starting now (within the last minute)
        const startingExams = await Exam.find({
            startDate: {
                $lte: now,
                $gte: new Date(now.getTime() - 60000) // Last 1 minute
            },
            status: 'active',
            type: 'live'
        }).populate('assignedUsers');

        // Find exams that should be ending now
        const endingExams = await Exam.find({
            endDate: {
                $lte: now,
                $gte: new Date(now.getTime() - 60000) // Last 1 minute
            },
            status: 'active'
        }).populate('assignedUsers');

        // Create notifications for starting exams
        for (const exam of startingExams) {
            await createExamNotification('exam_started', exam, exam.createdBy);
        }

        // Create notifications for ending exams
        for (const exam of endingExams) {
            await createExamNotification('exam_ended', exam, exam.createdBy);
        }

        return {
            started: startingExams.length,
            ended: endingExams.length
        };
    } catch (error) {
        console.error('Error checking exam status:', error);
        throw error;
    }
};