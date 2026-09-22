import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '@/utils/apiAuth';

export const dynamic = 'force-dynamic';

function getFilesRecursively(dir, fileList = [], baseDir = '') {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // 🔒/🐛 path.join uses the OS separator — on Windows that's '\',
            // which then got embedded straight into the web-facing `path`
            // below (e.g. "/uploads/documents\images/x.pdf"), a URL the
            // <input type="url"> in the lecture form (and any real browser
            // fetch) rejects outright. Web paths are always forward-slash,
            // regardless of what OS generated them.
            getFilesRecursively(filePath, fileList, baseDir ? `${baseDir}/${file}` : file);
        } else {
            // Only include media files
            const ext = path.extname(file).toLowerCase();
            const allowedExts = [
                // Images
                '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
                // Videos
                '.mp4', '.webm', '.mkv', '.avi',
                // Documents
                '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'
            ];

            if (allowedExts.includes(ext)) {
                // Determine file type category
                let type = 'other';
                if (['.mp4', '.webm', '.mkv', '.avi'].includes(ext)) type = 'video';
                else if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) type = 'image';
                else if (['.pdf', '.doc', '.docx', '.txt'].includes(ext)) type = 'document';

                fileList.push({
                    name: file,
                    path: `/uploads/${baseDir ? baseDir + '/' : ''}${file}`, // Web accessible path
                    relativePath: baseDir ? `${baseDir}/${file}` : file,
                    size: stat.size,
                    modified: stat.mtime,
                    type: type
                });
            }
        }
    });
    return fileList;
}

export async function GET(request) {
    try {
        const authError = await requireAdmin(request);
        // Allow non-admin for now if needed, but safer to block. 
        // User "admin" requested feature.
        if (authError) return authError;

        const storageUploadsDir = path.join(process.cwd(), 'storage', 'uploads');
        // Pre-migration uploads still live under public/uploads (see the same
        // fallback in /api/storage/file and /api/storage/secure-file) — without
        // this, every file uploaded before the move to storage/uploads is
        // invisible here, even though it's still being served on the site.
        const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads');

        const storageFiles = fs.existsSync(storageUploadsDir) ? getFilesRecursively(storageUploadsDir) : [];
        const publicFiles = fs.existsSync(publicUploadsDir) ? getFilesRecursively(publicUploadsDir) : [];

        // Same relative path in both roots -> the storage/uploads copy is the
        // current one; don't list the legacy file twice.
        const seen = new Set(storageFiles.map(f => f.relativePath));
        const files = [...storageFiles, ...publicFiles.filter(f => !seen.has(f.relativePath))];

        // Sort by modified date desc
        files.sort((a, b) => new Date(b.modified) - new Date(a.modified));

        return NextResponse.json({ success: true, files });
    } catch (error) {
        console.error('Error listing media:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
