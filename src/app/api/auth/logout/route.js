import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Clear the session cookies.
 *
 * 🔒 The session lives in HttpOnly `token` / `refreshToken` cookies, which
 * client JavaScript cannot delete. Logout previously only cleared the
 * non-HttpOnly `user` cookie, so the real session survived — the user
 * appeared logged out while their credentials were still being sent with
 * every request.
 */
export async function POST() {
    const response = NextResponse.json({ success: true, message: 'Logged out' });

    const expire = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 0
    };

    response.cookies.set('token', '', expire);
    response.cookies.set('refreshToken', '', expire);

    return response;
}
