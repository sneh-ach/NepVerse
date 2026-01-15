import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSecurityHeaders, getCORSHeaders } from '@/lib/security'
import { validateEnv } from '@/lib/env'

// Validate environment on first middleware call
let envValidated = false
if (!envValidated) {
  const validation = validateEnv()
  if (process.env.NODE_ENV === 'production' && !validation.valid) {
    console.error('❌ Environment validation failed. Server cannot start.')
    // Don't use process.exit in Edge Runtime - let it fail naturally
    // process.exit(1)
  }
  envValidated = true
}

/**
 * Middleware for request processing
 * - Adds security headers
 * - Handles CORS
 * - Adds request ID for tracing
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Generate request ID for tracing
  const requestId = crypto.randomUUID()
  response.headers.set('X-Request-ID', requestId)
  
  // Add security headers
  const securityHeaders = getSecurityHeaders()
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // Add CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    const origin = request.headers.get('origin')
    const corsHeaders = getCORSHeaders(origin)
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: corsHeaders })
    }
  }
  
  // API route authentication is handled in individual route handlers
  // Middleware only adds headers and request ID
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

