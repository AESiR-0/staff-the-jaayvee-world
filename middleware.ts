import { NextRequest, NextResponse } from 'next/server';
import { routeToTabKey, canAccess } from '@/lib/rbac';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check RBAC for protected routes
  const tabKey = routeToTabKey[pathname as keyof typeof routeToTabKey];
  if (tabKey && !canAccess(tabKey)) {
    // Redirect to dashboard if user doesn't have access to this route
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

