import { NextResponse } from 'next/server'
import { verifyToken, signToken } from '@/utils/auth'


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
        '/api/auth/firebase', // Sync Firebase/Google auth
        '/api/auth/migrate', // Legacy migration
        '/api/auth/refresh', // Token refresh
        '/api/auth/send-registration-otp',
        '/api/auth/verify-registration-otp',
        '/api/auth/check-registration-enabled',
        '/api/auth/check-app-settings', // Mobile app settings (must be public)
        '/api/auth/send-mobile-otp', // Mobile OTP login
        '/api/auth/verify-mobile-login', // Mobile OTP verification
        '/api/auth/google-register',
        '/api/auth/reset-password',
        '/api/auth/verify-2fa', // 2FA Verification (Public)
        '/api/auth/resend-2fa', // 2FA Resend (Public)
        '/api/settings', // Often public
        '/api/upload', // Sometimes public or protected? Let's protect, but maybe it breaks image uploads?
        // Assuming upload endpoints are protected purely by this.
        '/api/storage/demo-video', // Allow file streaming without explicit token (endpoint does its own checks if needed, or is public)
        '/api/news-ticker', // Public news ticker for mobile app
        '/api/blogs', // Public blogs list and individual blog for mobile app
        '/api/banners', // Public banners for mobile app
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
        let payload = await verifyToken(token)

        // Handle Expired Token Transparently (Strict Secure Refresh Flow + Legacy Bridge)
        if (payload && payload.expired) {
            // 1. Get Refresh Token (For new app versions)
            let refreshToken = request.cookies.get('refreshToken')?.value;
            if (!refreshToken) {
                refreshToken = request.headers.get('x-refresh-token');
            }

            let canProceed = false;
            let refreshSource = null;

            if (refreshToken) {
                // Check if Refresh Token is valid
                const refreshPayload = await verifyToken(refreshToken);
                if (refreshPayload && !refreshPayload.expired) {
                    canProceed = true;
                    refreshSource = refreshPayload;
                }
            }

            // 2. LEGACY BRIDGE: If no Refresh Token, trust the expired access token signature
            if (!canProceed) {
                const now = Math.floor(Date.now() / 1000);
                // Allow a generous grace period for users on old app versions (e.g. 180 days)
                const gracePeriod = 180 * 24 * 60 * 60;

                if (payload.exp && (now < payload.exp + gracePeriod)) {
                    console.log(`[AUTH] Legacy session recovery for user: ${payload.userId}`);
                    canProceed = true;
                    refreshSource = payload;
                }
            }

            if (canProceed && refreshSource) {
                // Issue new Access Token
                const newToken = await signToken({
                    userId: refreshSource.userId,
                    email: refreshSource.email || payload.email,
                    role: refreshSource.role || payload.role,
                    permissions: refreshSource.permissions || payload.permissions,
                    accessScope: refreshSource.accessScope || payload.accessScope,
                    deviceId: refreshSource.deviceId || payload.deviceId
                });

                // Pass new token to the internal route handler
                const requestHeaders = new Headers(request.headers);
                requestHeaders.set('Authorization', `Bearer ${newToken}`);

                const response = NextResponse.next({
                    request: { headers: requestHeaders },
                });

                // Set new token in header and cookie
                response.cookies.set('token', newToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 60 * 24 * 60 * 60
                });
                response.headers.set('x-new-token', newToken);

                return response;
            }

            // No valid refresh mechanism - force logout
            return NextResponse.json(
                { success: false, message: 'Unauthorized: Session expired', expired: true },
                { status: 401 }
            )
        }

        if (!payload) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized: Invalid token' },
                { status: 401 }
            )
        }

        // Token is valid - Allow request
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

        // If user is teacher, enforce permission-based access
        if (user.role === 'teacher') {
            const isHome = pathname === '/';
            const isProfile = pathname.startsWith('/profile');

            if (!isHome && !isProfile) {
                // Define route to permission mapping
                const routePermissions = {
                    '/students': 'manage_students',
                    '/exam': 'manage_exams',
                    '/subjects': 'manage_academic',
                    '/categories': 'manage_academic',
                    '/courses': 'manage_courses',
                    '/question-bank': 'manage_questions',
                    '/question-groups': 'manage_questions',
                    '/analytics': 'view_analytics',
                    '/exam-analytics': 'view_analytics',
                    '/live-exams': 'manage_live_exams',
                    '/recorded-exams': 'manage_content',
                    '/google-meet': 'manage_live_exams',
                    '/free-materials': 'manage_content',
                    '/storage': 'manage_storage'
                };

                // Admin-only routes (Teacher never has access)
                const adminOnlyPrefixes = [
                    '/teachers',
                    '/coupons',
                    '/payment',
                    '/settings',
                    '/support',
                    '/customers',
                    '/leads',
                    '/projects',
                    '/proposal',
                    '/reports',
                    '/widgets'
                ];
                const isAdminOnly = adminOnlyPrefixes.some(prefix => pathname.startsWith(prefix));

                if (isAdminOnly) {
                    return NextResponse.redirect(new URL('/', request.url));
                }

                // Check specific permissions for other routes
                const matchedRoute = Object.keys(routePermissions).find(route => pathname.startsWith(route));
                if (matchedRoute) {
                    const requiredPermission = routePermissions[matchedRoute];
                    const userPermissions = user.permissions || [];

                    if (!userPermissions.includes(requiredPermission)) {
                        return NextResponse.redirect(new URL('/', request.url));
                    }
                }
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
