import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-env';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function signToken(payload) {
    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('60d') // Access token: increased to 60 days for fallback
        .sign(secretKey);
    return token;
}

export async function signRefreshToken(payload) {
    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('365d') // Refresh token: 365 days
        .sign(secretKey);
    return token;
}

export async function verifyToken(token) {
    try {
        const { payload } = await jwtVerify(token, secretKey);
        return payload;
    } catch (error) {
        if (error.code === 'ERR_JWT_EXPIRED') {
            // Signature is valid, but token is expired. 
            // We return the payload with an 'expired' flag for transparent refresh.
            const { decodeJwt } = await import('jose');
            const payload = decodeJwt(token);
            return { ...payload, expired: true };
        }
        return null;
    }
}

