import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PDFViewSession from '@/models/PDFViewSession';
import mongoose from 'mongoose';
import { getAuthenticatedUser } from '@/utils/apiAuth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        await connectDB();

        const body = await request.json();
        const { action, sessionId, userId, courseId, lectureId, lectureName, pdfUrl, pdfName, currentPage, totalPages, latitude, longitude, locationName, activeDuration } = body;
        const currentUser = await getAuthenticatedUser(request);

        if (!currentUser) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        if (!userId || !courseId || !lectureId) {
            return NextResponse.json({
                success: false,
                message: 'Missing required fields'
            }, { status: 400 });
        }

        // Security: Students can only track for themselves, unless admin
        if (currentUser.role !== 'admin' && currentUser.id !== userId && currentUser._id?.toString() !== userId) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        switch (action) {
            case 'start':
                const newSession = await PDFViewSession.create({
                    user: userId,
                    course: courseId,
                    lectureId,
                    lectureName: lectureName || 'Untitled Lecture',
                    pdfUrl: pdfUrl || '',
                    pdfName: pdfName || 'Document.pdf',
                    startTime: new Date(),
                    lastActiveTime: new Date(),
                    isActive: true,
                    currentPage: currentPage || 1,
                    totalPages: totalPages || 0,
                    latitude: latitude,
                    longitude: longitude,
                    locationName: locationName
                });

                return NextResponse.json({
                    success: true,
                    sessionId: newSession._id,
                    message: 'PDF viewing session started'
                });

            case 'update':
                if (!sessionId) {
                    return NextResponse.json({ success: false, message: 'Session ID required for update' }, { status: 400 });
                }

                const session = await PDFViewSession.findById(sessionId);
                if (!session) {
                    return NextResponse.json({ success: false, message: 'Session not found' }, { status: 404 });
                }

                // Verify session ownership
                if (session.user.toString() !== userId) {
                    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
                }

                session.lastActiveTime = new Date();
                if (currentPage) {
                    session.currentPage = currentPage;
                    const existingPage = session.pagesViewed.find(p => p.pageNumber === currentPage);
                    if (!existingPage) {
                        session.pagesViewed.push({
                            pageNumber: currentPage,
                            viewedAt: new Date(),
                            timeSpent: 0
                        });
                    }
                }

                if (activeDuration !== undefined) {
                    session.duration = activeDuration;
                } else {
                    session.calculateDuration();
                }

                await session.save();

                return NextResponse.json({
                    success: true,
                    duration: session.duration,
                    message: 'Session updated'
                });

            case 'end':
                if (!sessionId) {
                    return NextResponse.json({ success: false, message: 'Session ID required to end session' }, { status: 400 });
                }

                const endSession = await PDFViewSession.findById(sessionId);
                if (!endSession) {
                    return NextResponse.json({ success: false, message: 'Session not found' }, { status: 404 });
                }

                // Verify session ownership
                if (endSession.user.toString() !== userId) {
                    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
                }

                endSession.endTime = new Date();
                endSession.isActive = false;

                if (activeDuration !== undefined) {
                    endSession.duration = activeDuration;
                } else {
                    endSession.calculateDuration();
                }

                await endSession.save();

                return NextResponse.json({
                    success: true,
                    duration: endSession.duration,
                    formattedDuration: formatDuration(endSession.duration),
                    message: 'Session ended'
                });

            default:
                return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
        }

    } catch (error) {
        console.error('❌ PDF Tracking Error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Failed to track PDF view'
        }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const courseId = searchParams.get('courseId');
        const lectureId = searchParams.get('lectureId');
        const currentUser = await getAuthenticatedUser(request);

        if (!currentUser) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
        }

        // Security: Students can only view their own stats, unless admin/teacher
        if (currentUser.role !== 'admin' && currentUser.role !== 'teacher' && currentUser.id !== userId && currentUser._id?.toString() !== userId) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        let stats = {};

        if (courseId && lectureId) {
            stats = await PDFViewSession.getTotalPdfTime(userId, courseId, lectureId);
        } else if (courseId) {
            stats = await PDFViewSession.getTotalCourseTime(userId, courseId);

            const lectureBreakdown = await PDFViewSession.aggregate([
                {
                    $match: {
                        user: new mongoose.Types.ObjectId(userId),
                        course: new mongoose.Types.ObjectId(courseId)
                    }
                },
                {
                    $group: {
                        _id: {
                            lectureId: '$lectureId',
                            lectureName: '$lectureName',
                            pdfName: '$pdfName'
                        },
                        totalSeconds: { $sum: '$duration' },
                        sessions: { $sum: 1 },
                        lastAccessed: { $max: '$lastActiveTime' }
                    }
                },
                {
                    $sort: { lastAccessed: -1 }
                }
            ]);

            stats.lectureBreakdown = lectureBreakdown.map(item => ({
                lectureId: item._id.lectureId,
                lectureName: item._id.lectureName,
                pdfName: item._id.pdfName,
                totalSeconds: item.totalSeconds,
                formattedTime: formatDuration(item.totalSeconds),
                sessions: item.sessions,
                lastAccessed: item.lastAccessed
            }));
        } else {
            const allSessions = await PDFViewSession.find({ user: userId })
                .sort({ createdAt: -1 })
                .limit(50)
                .populate('course', 'title')
                .lean();

            stats = {
                recentSessions: allSessions.map(s => ({
                    courseTitle: s.course?.title || 'Unknown Course',
                    lectureName: s.lectureName,
                    pdfName: s.pdfName,
                    duration: s.duration,
                    formattedDuration: formatDuration(s.duration),
                    startTime: s.startTime,
                    endTime: s.endTime,
                    latitude: s.latitude,
                    longitude: s.longitude,
                    id: s._id
                }))
            };
        }

        return NextResponse.json({ success: true, stats });

    } catch (error) {
        console.error('❌ Get PDF Stats Error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Failed to get PDF statistics'
        }, { status: 500 });
    }
}

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}
