import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public paths that do not require any authentication
  const isPublicPath = path === '/' || path === '/login' || path.startsWith('/psb') || path.startsWith('/api/') || path === '/akses-absen' || path.startsWith('/uploads/') || path.startsWith('/izin') || path.startsWith('/portal-guru') || path.startsWith('/portal-ortu');
  
  // Scanner paths (Kiosk mode)
  const isScannerPath = path === '/pindai-wajah' || path === '/pindai-qr' || path === '/absensi/manual';

  // Check if session token exists (Dashboard access)
  const token = request.cookies.get('better-auth.session_token')?.value || request.cookies.get('__Secure-better-auth.session_token')?.value;
  
  // Check if Kiosk access token exists
  const kioskAccess = request.cookies.get('rq_absen_access')?.value === 'true';

  // Rule 1: If trying to access Scanner Path
  if (isScannerPath) {
    // Must have Kiosk Access OR Dashboard Access
    if (!kioskAccess && !token) {
      return NextResponse.redirect(new URL('/akses-absen', request.url));
    }
    return NextResponse.next();
  }

  // Rule 2: If trying to access Protected Dashboard Path
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Rule 3: Redirect from login if already authenticated
  if (path === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
