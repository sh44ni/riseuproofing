import { NextRequest, NextResponse } from 'next/server';

const ADMIN_COOKIE = 'admin_session';
const PUBLIC_ADMIN_PATHS = ['/admin/login', '/api/admin/auth'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /admin/* and /api/admin/* routes
  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  if (!isAdminPath) return NextResponse.next();

  // Allow public admin paths through (login and auth)
  if (PUBLIC_ADMIN_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check for session cookie and validate token format (64 hex characters)
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  const isValidFormat = typeof token === 'string' && /^[0-9a-fA-F]{64}$/.test(token);

  if (!token || !isValidFormat) {
    // Redirect browser requests to login, return 401 for API requests
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-admin-pathname', pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
