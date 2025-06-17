import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';

// Store CSRF tokens in memory (in production, use Redis or similar)
const csrfTokens = new Map<string, { token: string; expires: number }>();

// Generate a new CSRF token
export function generateCSRFToken(): string {
  const token = randomBytes(32).toString('hex');
  const expires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  csrfTokens.set(token, { token, expires });
  return token;
}

// Validate CSRF token
export function validateCSRFToken(token: string): boolean {
  const stored = csrfTokens.get(token);
  if (!stored) return false;
  
  // Check if token is expired
  if (Date.now() > stored.expires) {
    csrfTokens.delete(token);
    return false;
  }
  
  return true;
}

// Clean up expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of csrfTokens.entries()) {
    if (now > data.expires) {
      csrfTokens.delete(token);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour

// CSRF middleware
export function csrfMiddleware(request: NextRequest) {
  // Skip CSRF check for GET requests
  if (request.method === 'GET') {
    return NextResponse.next();
  }

  // Skip CSRF check for public endpoints
  const publicPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/verify-email',
    '/api/auth/reset-password',
    '/api/auth/resend-reset-code',
    '/api/auth/resend-verification',
    '/api/auth/forgot-password'
  ];
  
  if (publicPaths.includes(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const csrfToken = request.headers.get('X-CSRF-Token');
  if (!csrfToken || !validateCSRFToken(csrfToken)) {
    return new NextResponse(
      JSON.stringify({ error: 'Invalid CSRF token' }),
      { status: 403 }
    );
  }

  return NextResponse.next();
} 