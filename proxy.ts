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
  pm:     ['/pm'],
};

// Role → default dashboard/landing path
function getRoleDashboardPath(role: UserRole): string {
  switch (role) {
    case 'admin':   return '/admin/dashboard';
    case 'pc':      return '/pc/dashboard';
    case 'fellow':  return '/fellow/dashboard';
    case 'intern':  return '/intern/dashboard';
    case 'pm':      return '/pm/dashboard';
    case 'pmu':     return '/pmu';
    default:        return '/login';
  }
}

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
      return NextResponse.redirect(new URL(getRoleDashboardPath(role), request.url));
    }

    // Role path enforcement — redirect to own dashboard if accessing wrong role path
    const allowedPrefixes = ROLE_PATHS[role] ?? [];
    const isAllowed = allowedPrefixes.some((p) => pathname.startsWith(p));
    if (!isAllowed) {
      return NextResponse.redirect(new URL(getRoleDashboardPath(role), request.url));
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
