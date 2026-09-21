import { SignJWT, jwtVerify, decodeJwt } from 'jose';

// 🔒 SECURITY: no insecure fallback. A missing/blank JWT_SECRET used to fall
// back to a hardcoded string that is public in this repo's history, which
// would let anyone forge an admin token. Fail loudly at startup instead.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error(
        'JWT_SECRET is missing or too short (needs >= 32 chars). Set it in .env.local before starting the server.'
    );
}
const secretKey = new TextEncoder().encode(JWT_SECRET);

// Short-lived access token; clients renew it with the refresh token (mobile
// via /api/auth/refresh, web transparently in middleware.js).
export const ACCESS_TOKEN_TTL = '2h';
export const REFRESH_TOKEN_TTL = '30d';

export async function signToken(payload) {
    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(ACCESS_TOKEN_TTL)
        .sign(secretKey);
    return token;
}

export async function signRefreshToken(payload) {
    const token = await new SignJWT({ ...payload, typ: 'refresh' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(REFRESH_TOKEN_TTL)
        .sign(secretKey);
    return token;
}

/**
 * Verify a token. Returns null for anything that is not currently valid —
 * bad signature OR expired.
 *
 * 🔒 SECURITY: this used to return `{ ...payload, expired: true }` for expired
 * tokens. That object is truthy, so every caller doing `if (payload)` silently
 * accepted expired tokens forever, making logout and revocation impossible.
 * Callers that genuinely need the payload of an expired-but-correctly-signed
 * token (only the middleware refresh bridge) must use verifyTokenAllowExpired.
 */
export async function verifyToken(token) {
    try {
        const { payload } = await jwtVerify(token, secretKey);
        return payload;
    } catch (error) {
        return null;
    }
}

/**
 * Verify the signature but tolerate expiry, returning the payload with an
 * `expired: true` flag. Use ONLY where an expired token is deliberately being
 * exchanged for a fresh one, never as an authorization decision.
 */
export async function verifyTokenAllowExpired(token) {
    try {
        const { payload } = await jwtVerify(token, secretKey);
        return payload;
    } catch (error) {
        if (error.code === 'ERR_JWT_EXPIRED') {
            try {
                // decodeJwt does NOT verify, but reaching here already proves
                // jwtVerify failed on expiry alone, i.e. the signature is good.
                return { ...decodeJwt(token), expired: true };
            } catch {
                return null;
            }
        }
        return null;
    }
}
