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
    
    // Routes allowed for students
    const studentAllowedRoutes = [
        '/',
        '/exam',
        '/reports', 
        '/profile'
    ]
    
    // Admin/Teacher only routes (students will be redirected)
    const adminTeacherOnlyRoutes = [
        '/teachers',
        '/students', 
        '/subjects',
        '/categories',
        '/question-bank',
        '/exam-analytics',
        '/live-exam',
        '/settings',
        '/question-groups',
        '/exam/add',
        '/exam/edit',
        '/storage'
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
        
        // If user is student, check if they're trying to access admin/teacher routes
        if (user.role === 'student') {
            const isAdminRoute = adminTeacherOnlyRoutes.some(route => pathname.startsWith(route))
            
            if (isAdminRoute) {
                // Redirect students away from admin pages to dashboard
                const dashboardUrl = new URL('/', request.url)
                return NextResponse.redirect(dashboardUrl)
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
