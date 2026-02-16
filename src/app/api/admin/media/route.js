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
            getFilesRecursively(filePath, fileList, path.join(baseDir, file));
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
                    relativePath: path.join(baseDir, file),
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

        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

        if (!fs.existsSync(uploadsDir)) {
            return NextResponse.json({ success: true, files: [] });
        }

        const files = getFilesRecursively(uploadsDir);

        // Sort by modified date desc
        files.sort((a, b) => new Date(b.modified) - new Date(a.modified));

        return NextResponse.json({ success: true, files });
    } catch (error) {
        console.error('Error listing media:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
