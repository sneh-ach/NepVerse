/**
 * Request ID utilities for tracing and correlation
 */

/**
 * Extract request ID from request headers or generate a new one
 */
export function getRequestId(request: Request | { headers: Headers }): string {
  if ('headers' in request) {
    const existingId = request.headers.get('x-request-id')
    if (existingId) return existingId
  }
  
  // Generate a new request ID
  return crypto.randomUUID()
}

/**
 * Add request ID to response headers
 */
export function addRequestIdHeader(response: Response, requestId: string): Response {
  response.headers.set('X-Request-ID', requestId)
  return response
}
