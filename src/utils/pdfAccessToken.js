import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';

/**
 * Short-lived, signed, single-file access token for serving PDFs.
 *
 * Why this exists: a PDF must never be openable from a plain URL. The only way
 * to fetch the bytes is `/api/storage/secure-file?path=<p>&token=<t>` where `t`
 * is one of these tokens. The token is a signed JWT that binds:
 *   - the exact file path (`p`)
 *   - the user it was issued to (`uid`)
 *   - the access scope it was granted under (`scope`)
 * and expires after PDF_ACCESS_TOKEN_TTL_SECONDS. The serve route re-checks the signature, the
 * expiry, that `p` matches the requested path byte-for-byte, AND re-derives the
 * user's authorization live from the database on every single request — so a
 * tampered path, a swapped user, a flipped flag, or a revoked enrollment can
 * never grant access, even with an otherwise-valid token.
 */

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error(
        'JWT_SECRET is missing or too short (needs >= 32 chars). Set it in .env.local before starting the server.'
    );
}
const secretKey = new TextEncoder().encode(JWT_SECRET);

// Was 5 minutes — fine when the whole file was downloaded in one shot, but
// non-downloadable PDFs now stream page-by-page straight from this token's
// URL (see pdf_viewer_screen.dart), so a long document read over several
// minutes needs the token to still be alive on page 300 as much as page 1.
// Still short enough that a leaked link, combined with the IP-binding above,
// isn't useful for long.
export const PDF_ACCESS_TOKEN_TTL_SECONDS = 60 * 60;

// 🔒 A token used to authorize ANY requester who had the URL — copy the link
// into another tab, forward it to a friend, or paste it in a different app,
// and it would render just the same for them, for as long as the 5-minute
// window lasted. Bind each token to whichever IP redeems it first; every
// later request (repeat page loads, video Range-request seeking — all
// legitimately reuse the same token) must come from that same IP, or it's
// treated as a different requester and rejected. Single Node process on one
// VPS instance (see pm2 fork mode), so an in-memory Map is enough — no Redis
// needed. Entries are pruned lazily against the token's own TTL.
const tokenBindings = new Map(); // jti -> { ip, expiresAt }

function pruneExpiredBindings(now) {
    for (const [jti, entry] of tokenBindings) {
        if (entry.expiresAt <= now) tokenBindings.delete(jti);
    }
}

/**
 * First caller to redeem a given token's jti "claims" it for their IP;
 * every subsequent redemption must come from that same IP.
 * @returns {boolean} true if this request is allowed to use the token.
 */
export function claimTokenForIp(jti, ip, exp) {
    const now = Date.now();
    pruneExpiredBindings(now);

    const expiresAt = exp ? exp * 1000 : now + PDF_ACCESS_TOKEN_TTL_SECONDS * 1000;
    const existing = tokenBindings.get(jti);
    if (!existing) {
        tokenBindings.set(jti, { ip, expiresAt });
        return true;
    }
    return existing.ip === ip;
}

// Despite the "Pdf" naming (kept to avoid touching every import site), this
// gate also covers locally-hosted lecture/material videos — anything that
// must never be reachable by a bare URL, only through a signed, re-checked
// token. External links (YouTube etc.) never go through this path.
const ALLOWED_EXTENSIONS = ['.pdf', '.mp4', '.avi', '.mov', '.webm', '.mkv', '.flv', '.wmv'];

/**
 * Normalize a client-supplied file path/URL down to the canonical on-disk
 * relative path we store and compare against. Returns null if it is not a
 * plausible uploads-dir PDF/video path.
 *
 * Accepts any of:
 *   /api/storage/file/uploads/materials/x.pdf
 *   /api/storage/secure-file?path=/uploads/materials/x.pdf   (already extracted)
 *   /uploads/materials/x.pdf
 *   uploads/materials/x.pdf
 */
export function normalizePdfPath(raw) {
    if (!raw || typeof raw !== 'string') return null;

    let p = raw.trim();

    // Strip a known API prefix if the caller passed a full serving URL.
    const apiPrefix = '/api/storage/file/';
    if (p.startsWith(apiPrefix)) p = p.slice(apiPrefix.length);

    // Drop protocol/host if a full URL slipped through.
    if (p.startsWith('http://') || p.startsWith('https://')) {
        try {
            p = new URL(p).pathname;
            if (p.startsWith(apiPrefix)) p = p.slice(apiPrefix.length);
        } catch {
            return null;
        }
    }

    // Reduce to the part starting at uploads/
    const idx = p.indexOf('uploads/');
    if (idx === -1) return null;
    p = p.slice(idx);

    // Collapse any leading slash noise and reject traversal.
    p = p.replace(/^\/+/, '');
    if (p.includes('..') || p.includes('\0')) return null;
    if (!p.startsWith('uploads/')) return null;
    if (!ALLOWED_EXTENSIONS.some((ext) => p.toLowerCase().endsWith(ext))) return null;

    return p;
}

/**
 * @param {{ userId: string, filePath: string, scope: string, ctx?: object }} args
 *   `ctx` carries the { courseId, lectureId, materialId } the grant was based
 *   on, so the serve route can re-run the exact same live authorization check
 *   on every request. It is inside the signed payload — the client cannot
 *   change it.
 * @returns {Promise<string>}
 */
export async function createPdfAccessToken({ userId, filePath, scope, ctx }) {
    const p = normalizePdfPath(filePath);
    if (!p) throw new Error('Invalid PDF path');
    if (!userId) throw new Error('Missing userId');
    if (!scope) throw new Error('Missing scope');

    const cleanCtx = {};
    if (ctx?.courseId) cleanCtx.courseId = String(ctx.courseId);
    if (ctx?.lectureId) cleanCtx.lectureId = String(ctx.lectureId);
    if (ctx?.materialId) cleanCtx.materialId = String(ctx.materialId);

    return new SignJWT({ typ: 'pdf-access', uid: String(userId), p, scope, ctx: cleanCtx })
        .setProtectedHeader({ alg: 'HS256' })
        .setJti(crypto.randomUUID())
        .setIssuedAt()
        .setExpirationTime(`${PDF_ACCESS_TOKEN_TTL_SECONDS}s`)
        .sign(secretKey);
}

/**
 * Verify signature + expiry + type. Returns the payload, or null for anything
 * that is not a currently-valid pdf-access token (bad signature OR expired OR
 * wrong type).
 */
export async function verifyPdfAccessToken(token) {
    if (!token || typeof token !== 'string') return null;
    try {
        const { payload } = await jwtVerify(token, secretKey);
        if (payload.typ !== 'pdf-access') return null;
        if (!payload.uid || !payload.p || !payload.scope || !payload.jti) return null;
        return payload;
    } catch {
        return null;
    }
}
