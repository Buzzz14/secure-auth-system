import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { csrfMiddleware } from './middleware/csrf';
import { corsMiddleware } from './middleware/cors';
import { securityHeadersMiddleware } from './middleware/security-headers';
import { securityMiddleware } from './middleware/security';

export function middleware(request: NextRequest) {
  // Apply CORS protection first
  const corsResponse = corsMiddleware(request);
  if (corsResponse.status !== 200) {
    return corsResponse;
  }

  // Apply security middleware for XSS and NoSQL injection protection
  const securityResponse = securityMiddleware(request);
  if (securityResponse.status !== 200) {
    return securityResponse;
  }

  // Then apply CSRF protection
  const csrfResponse = csrfMiddleware(request);
  if (csrfResponse.status !== 200) {
    return csrfResponse;
  }

  // Finally, add security headers
  return securityHeadersMiddleware(request);
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 