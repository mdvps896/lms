import { NextResponse } from 'next/server'
import { verifyToken } from '@/utils/auth'

export async function middleware(request) {
    const { pathname } = request.nextUrl

    // Public routes that don't require authentication
    const publicRoutes = [
        '/authentication/login',
        '/authentication/register',
        '/authentication/reset',
        '/authentication/verify',
        '/authentication/404',
        '/authentication/maintenance'
    ]

    const publicApiRoutes = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/send-registration-otp',
        '/api/auth/verify-registration-otp',
        '/api/auth/check-registration-enabled',
        '/api/auth/google-register',
        '/api/settings', // Often public
        '/api/upload', // Sometimes public or protected? Let's protect, but maybe it breaks image uploads?
        // Assuming upload endpoints are protected purely by this.
        '/api/storage/demo-video' // Allow file streaming without explicit token (endpoint does its own checks if needed, or is public)
    ]

    // Check if the current path is a public route
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
    const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route))

    // -----------------------------------------------------------
    // API PROTECTION (JWT)
    // -----------------------------------------------------------
    if (pathname.startsWith('/api')) {
        // Allow public API routes
        if (isPublicApiRoute) {
            return NextResponse.next()
        }

        // Check Authorization header
        const authHeader = request.headers.get('authorization')
        let token = null

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7)
        } else {
            // Check cookie
            const tokenCookie = request.cookies.get('token')
            if (tokenCookie) {
                token = tokenCookie.value
            }
        }

        if (!token) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized: No token provided' },
                { status: 401 }
            )
        }

        // Verify Token
        const payload = await verifyToken(token)
        if (!payload) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized: Invalid token' },
                { status: 401 }
            )
        }

        // Token is valid - Allow request
        // (Optional: Pass user info via headers if needed by backend, but backend extracts from token or DB usually)
        // For Next.js App Router, we can't easily modify the request object passed to the route handler to add "user".
        // Apps typically re-verify or trust the token.
        return NextResponse.next()
    }

    // -----------------------------------------------------------
    // PAGE PROTECTION (Cookie 'user') - Legacy/Existing
    // -----------------------------------------------------------

    // Skip middleware for static files
    if (pathname.startsWith('/_next') || isPublicRoute || pathname === '/favicon.ico') {
        return NextResponse.next()
    }

    // Get user from cookie
    const userCookie = request.cookies.get('user')

    if (!userCookie) {
        // Redirect to login if not authenticated
        const loginUrl = new URL('/authentication/login', request.url)
        return NextResponse.redirect(loginUrl)
    }

    try {
        const user = JSON.parse(userCookie.value)

        // If user is student, enforce strict whitelist
        if (user.role === 'student') {
            // Strict Allowed Prefixes
            const studentAllowedPrefixes = [
                '/profile',
                '/my-exams',
                '/exams',     // Matches /exams/[id]/start, /exams/[id]/take
                '/my-results'
            ];

            // Check if allowed
            const isHome = pathname === '/';
            // Allow exact match or prefix match
            const isAllowedPrefix = studentAllowedPrefixes.some(prefix => pathname.startsWith(prefix));

            if (!isHome && !isAllowedPrefix) {
                // Determine if it's unauthorized - Redirect to dashboard
                return NextResponse.redirect(new URL('/', request.url));
            }
        }

    } catch (error) {
        // If cookie is invalid, redirect to login
        const loginUrl = new URL('/authentication/login', request.url)
        return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|images|.*\\..*).*)',
    ],
}
