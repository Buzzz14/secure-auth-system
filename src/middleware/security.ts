import { NextResponse, NextRequest } from 'next/server';
import { sanitizeInput, sanitizeObject } from '@/utils/security';

export function securityMiddleware(request: NextRequest) {
  // Skip for GET requests and static files
  if (request.method === 'GET' || request.nextUrl.pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  try {
    // Clone the request to modify it
    const requestClone = request.clone();
    
    // Get the request body
    const body = requestClone.json().then((data) => {
      // Sanitize the entire object to prevent NoSQL injection
      const sanitizedData = sanitizeObject(data);
      
      // Sanitize string fields to prevent XSS
      Object.keys(sanitizedData).forEach((key) => {
        if (typeof sanitizedData[key] === 'string') {
          sanitizedData[key] = sanitizeInput(sanitizedData[key]);
        }
      });

      return sanitizedData;
    });

    // Create a new request with sanitized body
    const newRequest = new NextRequest(request.url, {
      method: request.method,
      headers: request.headers,
      body: JSON.stringify(body),
    });

    return NextResponse.next({
      request: newRequest,
    });
  } catch (error) {
    console.error('Security middleware error:', error);
    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    );
  }
} 