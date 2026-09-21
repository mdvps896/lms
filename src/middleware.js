import { NextResponse } from 'next/server'
import { verifyToken, verifyTokenAllowExpired, signToken } from '@/utils/auth'


export async function middleware(request) {
    const { pathname } = request.nextUrl

    // Public routes that don't require authentication
    const publicRoutes = [
        '/authentication/login',
        '/authentication/register',
        '/authentication/reset',
        '/authentication/verify',
        '/authentication/404',
        '/authentication/maintenance',
        // Public digital-consent-form page — for people filling the e-sign
        // form without a registered account or the mobile app (e.g. iOS
        // users). Submissions go to /api/public/esign/*, not the
        // authenticated /api/student/esign/* routes.
        '/esign'
    ]

    const publicApiRoutes = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/firebase', // Sync Firebase/Google auth
        '/api/auth/migrate', // Legacy migration
        '/api/auth/refresh', // Token refresh
        '/api/auth/logout', // Clearing cookies must work even with a dead token
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
        // NOTE: '/api/upload' is deliberately NOT public. It writes files to
        // disk and its callers (question images, settings logos) are all
        // authenticated admin/teacher screens.
        // Public static assets (logos, banners, course images, demo videos). This
        // was already reachable without a token — its path contains a dot, so
        // the old matcher skipped the middleware entirely — and the mobile app
        // loads these URLs with no Authorization header. It is listed here so
        // that status is explicit and reviewable. The route itself refuses to
        // serve PDFs; anything sensitive must go through
        // /api/storage/secure-file or /api/admin/materials/pdf instead.
        '/api/storage/file',
        // Serves PDFs by signed short-lived access token (?token=), which
        // browser PDF viewers / iframes / the mobile downloader cannot attach
        // as a Bearer header. The route enforces everything itself: the PDF
        // branch requires a valid token bound to the exact path + a live
        // re-check of the user's authorization; the non-PDF branch still
        // requires a full session. Token issuance (/api/storage/pdf-token) is
        // NOT public and stays behind this middleware.
        '/api/storage/secure-file',
        '/api/news-ticker', // Public news ticker for mobile app
        '/api/blogs', // Public blogs list and individual blog for mobile app
        '/api/banners', // Public banners for mobile app
        // Public e-sign form submission/status/upload/pdf — no account
        // required. Rate-limited and token-authorized per-submission inside
        // each route (see src/app/api/public/esign/*). Admin approve/reject/
        // reset/pdf for these still go through the authenticated
        // /api/student/esign/* and /api/admin/esign/* routes.
        '/api/public/esign',
    ]

    // Check if the current path is a public route
    // 🔒 SECURITY: Match on exact path or a "/" boundary — a bare startsWith()
    // let '/api/settings' also match '/api/settings/test-payment' and '/api/upload'
    // also match '/api/upload-sound', silently making unrelated routes public.
    const isExactOrChildRoute = (pathname, route) =>
        pathname === route || pathname.startsWith(route + '/')
    const isPublicRoute = publicRoutes.some(route => isExactOrChildRoute(pathname, route))
    const isPublicApiRoute = publicApiRoutes.some(route => isExactOrChildRoute(pathname, route))

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

        // Verify Token. Expiry is tolerated here ONLY so the refresh flow
        // below can exchange it; an expired token never authorizes on its own.
        let payload = await verifyTokenAllowExpired(token)

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
                if (refreshPayload) {
                    canProceed = true;
                    refreshSource = refreshPayload;
                }
            }

            // 2. LEGACY BRIDGE: If no Refresh Token, trust the expired access
            // token signature for a SHORT window so users on old app builds
            // (which never stored a refresh token) aren't logged out mid-exam.
            // 🔒 SECURITY: this was 180 days, which meant a token leaked once
            // stayed usable for half a year and no session could be revoked.
            if (!canProceed) {
                const now = Math.floor(Date.now() / 1000);
                const gracePeriod = 7 * 24 * 60 * 60; // 7 days

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
                    // Must match the access token's own TTL (2h) — a cookie
                    // that outlives its token just produces confusing 401s.
                    maxAge: 2 * 60 * 60
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
    // PAGE PROTECTION
    // -----------------------------------------------------------

    // Skip middleware for static files
    if (pathname.startsWith('/_next') || isPublicRoute || pathname === '/favicon.ico') {
        return NextResponse.next()
    }

    // 🔒 SECURITY: role and permissions come from the SIGNED JWT, never from
    // the 'user' cookie. That cookie is written client-side with
    // document.cookie, is not HttpOnly and is not signed — any student could
    // set {"role":"admin"} in devtools and walk straight into every admin and
    // teacher page. The cookie is still written for UI convenience, but it is
    // no longer an authorization input.
    const redirectToLogin = () =>
        NextResponse.redirect(new URL('/authentication/login', request.url))

    const pageTokenCookie = request.cookies.get('token')
    if (!pageTokenCookie) {
        return redirectToLogin()
    }

    let user = await verifyToken(pageTokenCookie.value)

    // Expired access token: accept it for page navigation only if a valid
    // refresh token backs it, mirroring the API branch above.
    if (!user) {
        const expiredPayload = await verifyTokenAllowExpired(pageTokenCookie.value)
        const pageRefreshToken = request.cookies.get('refreshToken')?.value
        const refreshPayload = pageRefreshToken ? await verifyToken(pageRefreshToken) : null

        if (expiredPayload && refreshPayload && refreshPayload.userId === expiredPayload.userId) {
            user = refreshPayload
        } else {
            return redirectToLogin()
        }
    }

    try {
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
        return redirectToLogin()
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * SECURITY: every /api path runs through the middleware, no
         * exceptions. The previous single matcher ended in `.*\..*`, which
         * excluded ANY path containing a dot — so a request to something like
         * /api/storage/file/uploads/x.pdf skipped authentication entirely.
         * API routes are matched first and unconditionally.
         */
        '/api/:path*',

        /*
         * Pages: skip Next's own static output and real static assets
         * (anything with a file extension), which never need auth.
         */
        '/((?!api|_next/static|_next/image|favicon.ico|images|.*\\..*).*)',
    ],
}
