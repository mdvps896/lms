import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/utils/apiAuth';
import { authorizePdfAccess } from '@/utils/pdfAuthorization';
import { createPdfAccessToken, normalizePdfPath, PDF_ACCESS_TOKEN_TTL_SECONDS } from '@/utils/pdfAccessToken';

export const dynamic = 'force-dynamic';

/**
 * Issues a short-lived, signed, single-file access token for a PDF.
 *
 * The token is the ONLY way to actually fetch PDF bytes (see
 * /api/storage/secure-file). This endpoint is authenticated; it re-derives the
 * caller's authorization live from the database (enrollment / free-material /
 * admin) and only then mints a token bound to { userId, exact path, scope }.
 *
 * Body: { path, courseId?, lectureId?, materialId? }
 */
export async function POST(request) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const { path: rawPath, courseId, lectureId, materialId } = body || {};

        const filePath = normalizePdfPath(rawPath);
        if (!filePath) {
            return NextResponse.json({ success: false, message: 'Invalid or non-PDF path' }, { status: 400 });
        }

        await connectDB();

        const { allowed, scope, reason } = await authorizePdfAccess({
            user,
            filePath,
            courseId,
            lectureId,
            materialId,
        });

        if (!allowed) {
            return NextResponse.json(
                { success: false, message: 'Access denied', reason },
                { status: 403 }
            );
        }

        const token = await createPdfAccessToken({
            userId: user.id || user._id,
            filePath,
            scope,
            ctx: { courseId, lectureId, materialId },
        });

        return NextResponse.json({
            success: true,
            token,
            path: filePath,
            expiresIn: PDF_ACCESS_TOKEN_TTL_SECONDS,
        });
    } catch (error) {
        console.error('pdf-token error:', error);
        return NextResponse.json({ success: false, message: 'Failed to issue token' }, { status: 500 });
    }
}
