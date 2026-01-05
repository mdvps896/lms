import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const TOKEN_EXPIRY = '24h';

// Generate device fingerprint from request
export function generateDeviceFingerprint(req) {
    const userAgent = req.headers.get('user-agent') || '';
    const acceptLanguage = req.headers.get('accept-language') || '';
    const acceptEncoding = req.headers.get('accept-encoding') || '';

    const fingerprintData = `${userAgent}-${acceptLanguage}-${acceptEncoding}`;
    return crypto.createHash('sha256').update(fingerprintData).digest('hex');
}

// Create JWT token with device binding
export function createSecureToken(userId, email, deviceId) {
    const payload = {
        userId,
        email,
        deviceId,
        iat: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

// Verify JWT token and check device binding
export function verifySecureToken(token, expectedDeviceId) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Check if device ID matches
        if (decoded.deviceId !== expectedDeviceId) {
            return {
                valid: false,
                error: 'Token device mismatch',
                forceLogout: true
            };
        }

        return {
            valid: true,
            data: decoded
        };
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return {
                valid: false,
                error: 'Token expired',
                forceLogout: true
            };
        }

        return {
            valid: false,
            error: 'Invalid token',
            forceLogout: true
        };
    }
}

// Middleware to protect routes
export function requireAuth(handler) {
    return async (req) => {
        try {
            const authHeader = req.headers.get('authorization');
            const deviceId = req.headers.get('x-device-id');

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return new Response(
                    JSON.stringify({ success: false, message: 'No token provided', forceLogout: true }),
                    { status: 401, headers: { 'Content-Type': 'application/json' } }
                );
            }

            const token = authHeader.substring(7);
            const verification = verifySecureToken(token, deviceId);

            if (!verification.valid) {
                return new Response(
                    JSON.stringify({
                        success: false,
                        message: verification.error,
                        forceLogout: verification.forceLogout
                    }),
                    { status: 401, headers: { 'Content-Type': 'application/json' } }
                );
            }

            // Add user data to request
            req.user = verification.data;

            return handler(req);
        } catch (error) {
            return new Response(
                JSON.stringify({ success: false, message: 'Authentication failed' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }
    };
}
