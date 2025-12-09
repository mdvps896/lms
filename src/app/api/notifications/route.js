import dbConnect from '../../../lib/mongodb';
import Notification from '../../../models/Notification';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request) {
    try {
        await dbConnect();

        // Get user info from cookie
        const cookieStore = cookies();
        const userCookie = cookieStore.get('currentUser');
        
        if (!userCookie) {
            return Response.json({ 
                success: false, 
                message: 'Not authenticated' 
            }, { status: 401 });
        }

        let currentUser;
        try {
            currentUser = JSON.parse(userCookie.value);
        } catch (error) {
            return Response.json({ 
                success: false, 
                message: 'Invalid authentication token' 
            }, { status: 401 });
        }
        
        // Get URL parameters
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit')) || 10;
        const page = parseInt(searchParams.get('page')) || 1;
        const skip = (page - 1) * limit;

        // Find notifications for current user
        const notifications = await Notification.find({
            'recipients.userId': currentUser.id,
            status: 'active'
        })
        .populate('createdBy', 'name email')
        .populate('data.examId', 'name status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

        // Get unread count
        const unreadCount = await Notification.countDocuments({
            'recipients.userId': currentUser.id,
            'recipients.read': false,
            status: 'active'
        });

        // Transform notifications to include read status for current user
        const transformedNotifications = notifications.map(notification => {
            const userRecipient = notification.recipients.find(
                r => r.userId.toString() === currentUser.id
            );
            
            return {
                _id: notification._id,
                title: notification.title,
                message: notification.message,
                type: notification.type,
                data: notification.data,
                createdBy: notification.createdBy,
                createdAt: notification.createdAt,
                recipients: notification.recipients, // Include full recipients array for frontend
                read: userRecipient?.read || false,
                readAt: userRecipient?.readAt,
            };
        });

        return Response.json({
            success: true,
            notifications: transformedNotifications,
            unreadCount,
            pagination: {
                page,
                limit,
                total: await Notification.countDocuments({
                    'recipients.userId': currentUser.id,
                    status: 'active'
                })
            }
        });

    } catch (error) {
        console.error('Get notifications error:', error);
        return Response.json({ 
            success: false, 
            message: 'Internal server error' 
        }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        await dbConnect();

        const cookieStore = cookies();
        const userCookie = cookieStore.get('currentUser');
        
        if (!userCookie) {
            return Response.json({ 
                success: false, 
                message: 'Not authenticated' 
            }, { status: 401 });
        }

        let currentUser;
        try {
            currentUser = JSON.parse(userCookie.value);
        } catch (error) {
            return Response.json({ 
                success: false, 
                message: 'Invalid authentication token' 
            }, { status: 401 });
        }
        const body = await request.json();
        const { notificationId, action } = body;

        if (action === 'mark_read') {
            await Notification.updateOne(
                { 
                    _id: notificationId,
                    'recipients.userId': currentUser.id 
                },
                {
                    $set: {
                        'recipients.$.read': true,
                        'recipients.$.readAt': new Date()
                    }
                }
            );
        } else if (action === 'mark_all_read') {
            await Notification.updateMany(
                { 'recipients.userId': currentUser.id },
                {
                    $set: {
                        'recipients.$.read': true,
                        'recipients.$.readAt': new Date()
                    }
                }
            );
        }

        return Response.json({
            success: true,
            message: 'Notification updated successfully'
        });

    } catch (error) {
        console.error('Update notification error:', error);
        return Response.json({ 
            success: false, 
            message: 'Internal server error' 
        }, { status: 500 });
    }
}