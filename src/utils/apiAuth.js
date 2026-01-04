import { NextResponse } from 'next/server';

/**
 * Checks if the request is from an authenticated admin.
 * @param {Request} request 
 * @returns {Object|null} user object if admin, null otherwise.
 */
export function getAuthenticatedUser(request) {
    const userCookie = request.cookies.get('user');
    if (!userCookie) return null;
    try {
        return JSON.parse(userCookie.value);
    } catch {
        return null;
    }
}

/**
 * Verifies if the user is an admin. Returns a response if NOT authorized.
 * @param {Request} request 
 * @returns {NextResponse|null} Error response if unauthorized, null if authorized.
 */
export function requireAdmin(request) {
    const user = getAuthenticatedUser(request);
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
export function requireAuth(request) {
    const user = getAuthenticatedUser(request);
    if (!user) {
        return NextResponse.json(
            { success: false, error: 'Unauthorized: Login required' },
            { status: 401 }
        );
    }
    return null;
}
