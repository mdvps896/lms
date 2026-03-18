
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PDFViewSession from '@/models/PDFViewSession';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId') || '69832d4ee25a78e339a676';
        
        const allSessions = await PDFViewSession.find({
            user: userId,
            duration: { $gte: 5 }
        }).lean();

        const breakdown = {
            totalSessions: allSessions.length,
            totalDurationHours: (allSessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 3600).toFixed(2),
            byCourse: {},
            byTitle: {},
            topSessions: allSessions
                .sort((a, b) => b.duration - a.duration)
                .slice(0, 20)
                .map(s => ({
                    title: s.pdfName || s.lectureName,
                    duration: (s.duration / 3600).toFixed(2) + 'h',
                    date: s.startTime
                }))
        };

        allSessions.forEach(s => {
            const cid = s.course ? s.course.toString() : 'no_course';
            if (!breakdown.byCourse[cid]) breakdown.byCourse[cid] = { count: 0, duration: 0 };
            breakdown.byCourse[cid].count++;
            breakdown.byCourse[cid].duration += (s.duration || 0);

            const title = s.pdfName || s.lectureName || 'Untitled';
            if (!breakdown.byTitle[title]) breakdown.byTitle[title] = { count: 0, duration: 0 };
            breakdown.byTitle[title].count++;
            breakdown.byTitle[title].duration += (s.duration || 0);
        });

        // Convert durations to hours for readability
        Object.keys(breakdown.byCourse).forEach(k => {
            breakdown.byCourse[k].durationHours = (breakdown.byCourse[k].duration / 3600).toFixed(2);
        });
        Object.keys(breakdown.byTitle).forEach(k => {
            breakdown.byTitle[k].durationHours = (breakdown.byTitle[k].duration / 3600).toFixed(2);
        });

        return NextResponse.json({ success: true, breakdown });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message });
    }
}
