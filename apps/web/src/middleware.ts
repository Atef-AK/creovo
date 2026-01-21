import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard'];

// Routes that should redirect to dashboard if authenticated
const authRoutes = ['/auth/login', '/auth/register'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check for session cookie (Firebase token would be stored here)
    const session = request.cookies.get('session')?.value;

    // Handle protected routes
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
        if (!session) {
            const url = new URL('/auth/login', request.url);
            url.searchParams.set('redirect', pathname);
            return NextResponse.redirect(url);
        }
    }

    // Handle auth routes - redirect to dashboard if already logged in
    if (authRoutes.some(route => pathname.startsWith(route))) {
        if (session) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/auth/:path*',
    ],
};
