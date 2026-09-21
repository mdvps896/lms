import { NextResponse } from 'next/server';
import { requirePermission } from '@/utils/apiAuth';

// These routes now read auth headers, so they must never be statically
// prerendered (a prerendered 401 would be cached and served to everyone).
export const dynamic = 'force-dynamic';

export async function GET(request) {
    // 🔒 SECURITY: staff-only view. This had no authorization check, so any
    // authenticated user (including every student) could read it.
    const authError = await requirePermission(request, 'manage_storage');
    if (authError) return authError;

    try {
        const upgradeInfo = {
            message: "File size limit removed - Enhanced upload system active",
            features: [
                "✅ Automatic image compression for large files",
                "✅ Smart chunked upload for videos and documents", 
                "✅ Fallback compression strategies",
                "✅ Multiple upload methods for maximum compatibility",
                "✅ No file size restrictions"
            ],
            limits: {
                free: "10MB per file",
                enhanced: "No limit with optimization",
                compression: "Automatic for images >8MB",
                chunked: "Automatic for files >10MB"
            },
            optimization: {
                images: {
                    compression: "JPEG quality 80%, max 2048x2048px",
                    fallback: "JPEG quality 60%, max 1024x1024px if needed"
                },
                videos: {
                    method: "Chunked upload with 6MB chunks"
                },
                documents: {
                    method: "Chunked upload for PDFs and documents >10MB"
                }
            },
            status: "active"
        };

        return NextResponse.json(upgradeInfo);
    } catch (error) {
        console.error('Error getting upgrade info:', error);
        return NextResponse.json(
            { error: 'Failed to get upgrade information' },
            { status: 500 }
        );
    }
}