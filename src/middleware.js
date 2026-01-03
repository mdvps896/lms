import { NextResponse } from 'next/server'

export function middleware(request) {
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

    // Check if the current path is a public route
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

    // Skip middleware for API routes, static files, and public routes
    if (pathname.startsWith('/api') || pathname.startsWith('/_next') || isPublicRoute) {
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
        '/((?!_next/static|_next/image|favicon.ico|images|.*\\..*|api).*)',
    ],
}
