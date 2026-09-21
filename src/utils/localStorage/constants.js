import path from 'path';

// Local storage directory paths.
// 🔒 SECURITY: deliberately OUTSIDE `public/` — Next.js serves everything
// under `public/` as static files with zero auth, which used to make every
// upload (PDFs, lecture videos, materials) directly fetchable at a bare
// `/uploads/...` URL, bypassing every token/enrollment check in the API
// routes entirely. Reads now go exclusively through /api/storage/secure-file
// and /api/storage/file, which resolve paths against this directory.
export const UPLOAD_BASE_DIR = path.join(process.cwd(), 'storage', 'uploads');
export const IMAGES_DIR = path.join(UPLOAD_BASE_DIR, 'images');
export const VIDEOS_DIR = path.join(UPLOAD_BASE_DIR, 'videos');
export const DOCUMENTS_DIR = path.join(UPLOAD_BASE_DIR, 'documents');
export const ASSETS_DIR = path.join(UPLOAD_BASE_DIR, 'assets');

// File size constants - Effectively unlimited (5GB)
export const MAX_IMAGE_SIZE = 5000 * 1024 * 1024; // 5GB
export const MAX_VIDEO_SIZE = 5000 * 1024 * 1024; // 5GB
export const MAX_DOCUMENT_SIZE = 5000 * 1024 * 1024; // 5GB
export const IMAGE_COMPRESSION_QUALITY = 80;
