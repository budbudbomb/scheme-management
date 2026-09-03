import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { UserRole } from '@/types/models';

// Role → allowed path prefixes
const ROLE_PATHS: Record<UserRole, string[]> = {
  admin:  ['/admin'],
  pc:     ['/pc'],
  fellow: ['/fellow'],
  intern: ['/intern'],
  pmu:    ['/pmu'],
};

// Public routes that don't require auth
const PUBLIC_PATHS = ['/login', '/forgot-password'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow Next.js internals & static assets
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  // Read auth cookie (set by backend or mock auth)
  const token = request.cookies.get('cmyp_session')?.value ||
    request.cookies.get('cmyp_token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Decode role from JWT payload
  try {
    const [, payload] = token.split('.');
    if (!payload) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = typeof atob === 'function'
      ? atob(normalized)
      : Buffer.from(normalized, 'base64').toString('utf-8');
    const decoded = JSON.parse(jsonStr);
    const role = decoded?.role as UserRole | undefined;
    const profileComplete = decoded?.profileComplete === true;

    if (!role) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Gate unallocated fellows/interns
    if ((role === 'fellow' || role === 'intern') && !profileComplete) {
      if (pathname !== `/${role}/pending`) {
        return NextResponse.redirect(new URL(`/${role}/pending`, request.url));
      }
      return NextResponse.next();
    } else if ((role === 'fellow' || role === 'intern') && profileComplete) {
      if (pathname === `/${role}/pending`) {
        return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url));
      }
    }

    // Root redirect
    if (pathname === '/') {
      const dash = ROLE_PATHS[role]?.[0];
      if (dash) return NextResponse.redirect(new URL(`${dash}/dashboard`, request.url));
    }

    // Role path enforcement — redirect to own dashboard if accessing wrong role path
    const allowedPrefixes = ROLE_PATHS[role] ?? [];
    const isAllowed = allowedPrefixes.some((p) => pathname.startsWith(p));
    if (!isAllowed) {
      const ownDash = ROLE_PATHS[role]?.[0];
      if (ownDash) return NextResponse.redirect(new URL(`${ownDash}/dashboard`, request.url));
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } catch {
    // Can't decode token — redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
