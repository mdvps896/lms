/**
 * Turn a stored media path/URL into one that goes through the authenticated
 * /api/storage/secure-file route.
 *
 * Selfies and face-verification images are no longer reachable by plain URL
 * (`/api/storage/file/...` 404s them, and `/verification/...` is rewritten to
 * secure-file). Anything rendering those images must build its `src` with this
 * so the request carries the session cookie / auth and hits the access check
 * (admin or owner only).
 *
 * Remote URLs (Cloudinary etc.) are returned unchanged.
 */
export function toSecureMediaUrl(pathOrUrl) {
    if (!pathOrUrl || typeof pathOrUrl !== 'string') return '';
    const v = pathOrUrl.trim();
    if (v.startsWith('http://') || v.startsWith('https://')) return v;
    if (v.startsWith('/api/storage/secure-file')) return v;

    // Reduce "/api/storage/file/uploads/x.jpg" → "/uploads/x.jpg"
    let p = v.replace(/^\/api\/storage\/file\//, '/');
    if (!p.startsWith('/')) p = '/' + p;

    return `/api/storage/secure-file?path=${encodeURIComponent(p)}`;
}
