import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define route protection rules
const PROTECTED_ROUTES = {
  '/admin': ['ADMIN'],
  '/profesor': ['ADMIN', 'PROFESOR'],
  '/padre': ['ADMIN', 'PADRE'],
};

const PUBLIC_ROUTES = ['/', '/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith('/api'))) {
    return NextResponse.next();
  }

  // Check for access token in cookies or localStorage isn't available in middleware
  // So we rely on client-side protection via layouts
  // This middleware primarily handles server-side redirects for unauthenticated API calls
  
  // For protected routes, we let the client-side layouts handle auth
  // The layouts check authentication and redirect appropriately
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
