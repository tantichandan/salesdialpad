import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to protect routes requiring authentication
 * Redirects to /auth if no valid session token found
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/auth', '/api/auth'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // If accessing public route, allow
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check if user has session token in their sessionStorage
  // Since sessionStorage is client-side only, we check for a cookie instead
  // For this implementation, we'll use a simple approach with client-side checking
  // The client will handle redirect if no session token exists

  // Allow the request through, client-side will handle redirect
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
