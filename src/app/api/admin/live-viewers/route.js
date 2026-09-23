import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import PDFViewSession from '@/models/PDFViewSession';
import ExamAttempt from '@/models/ExamAttempt';
import Course from '@/models/Course';
import FreeMaterial from '@/models/FreeMaterial';
import '@/models/Exam';
import '@/models/User';
import { requirePermission } from '@/utils/apiAuth';

export const dynamic = 'force-dynamic';

// The reader app sends a heartbeat every 5 s while a PDF is open. A session
// whose last heartbeat is older than this is treated as gone (app killed,
// phone locked, network lost) even though it never sent "end".
const PDF_LIVE_WINDOW_MS = 60 * 1000;
// Exams have no heartbeat: an active attempt counts as live until its clock
// (plus the submit grace period) runs out.
const EXAM_GRACE_MS = 60 * 1000;

const FREE_MATERIAL_COURSE_ID = '000000000000000000000000';

const TYPES = ['coursePdf', 'freePdf', 'exam', 'freeTest'];

function userSummary(user) {
    return {
        id: user._id.toString(),
        name: user.name || 'Unknown',
        email: user.email || '',
        profileImage: user.profileImage || null,
    };
}

/**
 * GET /api/admin/live-viewers
 * Who is reading a PDF or taking a test right now, grouped by course /
 * free material / exam. Polled by the Live Viewers page.
 */
export async function GET(request) {
    const authError = await requirePermission(request, 'manage_students');
    if (authError) return authError;

    try {
        await connectDB();
        const now = new Date();

        const [pdfSessions, activeAttempts] = await Promise.all([
            PDFViewSession.find({
                isActive: true,
                lastActiveTime: { $gte: new Date(now.getTime() - PDF_LIVE_WINDOW_MS) },
            })
                .select('user course lectureId lectureName pdfName startTime lastActiveTime duration currentPage totalPages selfieCount locationName')
                .populate('user', 'name email profileImage')
                .lean(),
            ExamAttempt.find({ status: 'active' })
                .select('user exam startedAt isFreeMaterial updatedAt locationName')
                .populate('user', 'name email profileImage')
                .populate('exam', 'name duration')
                .lean(),
        ]);

        // Titles for the course / free-material groups.
        const courseIds = new Set();
        const materialIds = new Set();
        for (const s of pdfSessions) {
            const courseId = s.course?.toString();
            if (courseId === FREE_MATERIAL_COURSE_ID) {
                if (mongoose.Types.ObjectId.isValid(s.lectureId)) materialIds.add(s.lectureId);
            } else if (courseId) {
                courseIds.add(courseId);
            }
        }
        const [courses, materials] = await Promise.all([
            courseIds.size ? Course.find({ _id: { $in: [...courseIds] } }).select('title thumbnail').lean() : [],
            materialIds.size ? FreeMaterial.find({ _id: { $in: [...materialIds] } }).select('title').lean() : [],
        ]);
        const courseTitle = new Map(courses.map(c => [c._id.toString(), c.title]));
        const courseThumb = new Map(courses.map(c => [c._id.toString(), c.thumbnail || null]));
        const materialTitle = new Map(materials.map(m => [m._id.toString(), m.title]));

        const groups = new Map();
        const addViewer = (type, groupId, title, thumbnail, viewer) => {
            const key = `${type}:${groupId}`;
            if (!groups.has(key)) {
                groups.set(key, { key, type, id: groupId, title, thumbnail, viewers: [] });
            }
            groups.get(key).viewers.push(viewer);
        };

        for (const s of pdfSessions) {
            if (!s.user) continue; // deleted account
            const courseId = s.course?.toString();
            const isFree = courseId === FREE_MATERIAL_COURSE_ID;
            const viewer = {
                id: s._id.toString(),
                user: userSummary(s.user),
                item: s.lectureName || s.pdfName || 'PDF',
                detail: s.totalPages ? `Page ${s.currentPage || 1} of ${s.totalPages}` : `Page ${s.currentPage || 1}`,
                startedAt: s.startTime,
                lastActiveAt: s.lastActiveTime,
                activeSeconds: s.duration || 0,
                selfieCount: s.selfieCount || 0,
                location: s.locationName || null,
            };
            if (isFree) {
                addViewer('freePdf', s.lectureId, materialTitle.get(s.lectureId) || s.lectureName || 'Free material', null, viewer);
            } else {
                addViewer('coursePdf', courseId, courseTitle.get(courseId) || 'Course', courseThumb.get(courseId) || null, viewer);
            }
        }

        for (const a of activeAttempts) {
            if (!a.user || !a.exam) continue;
            const durationMs = (a.exam.duration || 0) * 60 * 1000;
            const startedMs = new Date(a.startedAt).getTime();
            const endsAt = new Date(startedMs + durationMs);
            // Abandoned papers stay "active" in the DB until someone starts
            // again; only count ones whose clock is still running.
            if (!durationMs || now.getTime() > endsAt.getTime() + EXAM_GRACE_MS) continue;

            addViewer(a.isFreeMaterial ? 'freeTest' : 'exam', a.exam._id.toString(), a.exam.name || 'Exam', null, {
                id: a._id.toString(),
                user: userSummary(a.user),
                item: a.exam.name || 'Exam',
                detail: `${a.exam.duration} min test`,
                startedAt: a.startedAt,
                lastActiveAt: a.updatedAt,
                endsAt,
                location: a.locationName || null,
            });
        }

        const groupList = [...groups.values()]
            .map(g => ({
                ...g,
                count: g.viewers.length,
                viewers: g.viewers.sort((x, y) => new Date(x.startedAt) - new Date(y.startedAt)),
            }))
            .sort((x, y) => y.count - x.count || x.title.localeCompare(y.title));

        const summary = Object.fromEntries(TYPES.map(t => [t, 0]));
        for (const g of groupList) summary[g.type] += g.count;
        summary.total = TYPES.reduce((sum, t) => sum + summary[t], 0);

        return NextResponse.json({
            success: true,
            serverTime: now.toISOString(),
            summary,
            groups: groupList,
        });
    } catch (error) {
        console.error('Error fetching live viewers:', error);
        return NextResponse.json({ success: false, message: 'Failed to load live viewers' }, { status: 500 });
    }
}
