import { NextResponse } from 'next/server';

/**
 * Checks if the request is from an authenticated admin.
 * @param {Request} request 
 * @returns {Object|null} user object if admin, null otherwise.
 */
import { verifyToken } from './auth';

/**
 * Checks if the request is from an authenticated admin or user.
 * Supports both Cookie (web) and Bearer Token (mobile/api).
 * @param {Request} request 
 * @returns {Object|null} user object if authenticated, null otherwise.
 */
export async function getAuthenticatedUser(request) {
    // 1. Check Bearer Token (Authorization Header)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const payload = await verifyToken(token);
        if (payload && payload.userId) {
            // Normalize user object structure
            return {
                id: payload.userId,
                _id: payload.userId,
                role: payload.role || 'student', // Default to student if not in token
                ...payload
            };
        }
    }

    // 2. Fallback to Cookie (HttpOnly Token)
    const tokenCookie = request.cookies.get('token');
    if (tokenCookie) {
        const payload = await verifyToken(tokenCookie.value);
        if (payload && payload.userId) {
            // Normalize user object structure
            return {
                id: payload.userId,
                _id: payload.userId,
                role: payload.role || 'student', // Default to student if not in token
                ...payload
            };
        }
    }

    return null;
}

/**
 * Verifies if the user is an admin. Returns a response if NOT authorized.
 * @param {Request} request 
 * @returns {NextResponse|null} Error response if unauthorized, null if authorized.
 */
export async function requireAdmin(request) {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== 'admin') {
        return NextResponse.json(
            { success: false, error: 'Unauthorized: Admin access required' },
            { status: 401 }
        );
    }
    return null;
}

/**
 * Verifies if the user is a student or admin.
 * @param {Request} request 
 * @returns {NextResponse|null} Error response if unauthorized, null if authorized.
 */
export async function requireAuth(request) {
    const user = await getAuthenticatedUser(request);
    if (!user) {
        return NextResponse.json(
            { success: false, error: 'Unauthorized: Login required' },
            { status: 401 }
        );
    }
    return null;
}

/**
 * Verifies if the user has a specific permission.
 * Admins have all permissions by default.
 * @param {Request} request 
 * @param {string} permission 
 * @returns {NextResponse|null} Error response if unauthorized, null if authorized.
 */
export async function requirePermission(request, permission) {
    const user = await getAuthenticatedUser(request);

    if (!user) {
        return NextResponse.json(
            { success: false, error: 'Unauthorized: Login required' },
            { status: 401 }
        );
    }

    // Admin has full access
    if (user.role === 'admin') {
        return null; // Authorized
    }

    // Check permission for teachers (or others if applicable)
    if (user.permissions && user.permissions.includes(permission)) {
        return null; // Authorized
    }

    return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
    );
}
