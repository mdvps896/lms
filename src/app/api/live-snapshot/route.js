import connectDB from '@/lib/mongodb';
import { requirePermission } from '@/utils/apiAuth';
import ExamAttempt from '@/models/ExamAttempt';

// Store latest snapshots in memory (for production)
const liveSnapshots = new Map();

/**
 * Receive live snapshot from student
 */
export async function POST(request) {
    try {
        const formData = await request.formData();
        const snapshot = formData.get('snapshot');
        const attemptId = formData.get('attemptId');
        const timestamp = formData.get('timestamp');

        if (!snapshot || !attemptId) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Convert blob to base64
        const buffer = Buffer.from(await snapshot.arrayBuffer());
        const base64 = buffer.toString('base64');
        const dataUrl = `data:image/jpeg;base64,${base64}`;

        // Store in memory with timestamp
        liveSnapshots.set(attemptId, {
            image: dataUrl,
            timestamp: parseInt(timestamp),
            receivedAt: Date.now()
        });

        // Cleanup old snapshots (older than 2 minutes)
        for (const [id, data] of liveSnapshots.entries()) {
            if (Date.now() - data.receivedAt > 120000) {
                liveSnapshots.delete(id);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Snapshot received'
        });

    } catch (error) {
        console.error('Error receiving snapshot:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

/**
 * Get live snapshots for monitoring
 */
export async function GET(request) {
    const authError = await requirePermission(request, 'manage_live_exams');
    if (authError) return authError;
    try {
        const { searchParams } = new URL(request.url);
        const examId = searchParams.get('examId');
        const attemptId = searchParams.get('attemptId');

        if (attemptId) {
            // Get specific attempt snapshot
            const snapshot = liveSnapshots.get(attemptId);
            return NextResponse.json({
                success: true,
                snapshot: snapshot || null
            });
        }

        if (examId) {
            // Get all snapshots for exam
            await connectDB();
            const attempts = await ExamAttempt.find({
                exam: examId,
                status: 'in-progress'
            })
                .populate('student', 'name email profileImage')
                .select('student startedAt')
                .lean();

            const snapshotsWithData = attempts.map(attempt => ({
                ...attempt,
                snapshot: liveSnapshots.get(attempt._id.toString()) || null
            }));

            return NextResponse.json({
                success: true,
                attempts: snapshotsWithData
            });
        }

        // Get all active snapshots
        const allSnapshots = Array.from(liveSnapshots.entries()).map(([id, data]) => ({
            attemptId: id,
            ...data
        }));

        return NextResponse.json({
            success: true,
            snapshots: allSnapshots
        });

    } catch (error) {
        console.error('Error fetching snapshots:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
