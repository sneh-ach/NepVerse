import { NextRequest, NextResponse } from 'next/server'
import { recommendationService } from '@/lib/recommendations'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cacheService } from '@/lib/cache'

// Force dynamic rendering - this route uses headers
export const dynamic = 'force-dynamic'

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
  
  if (!token) {
    const cookieToken = request.cookies.get('token')?.value
    if (cookieToken) {
      const payload = verifyToken(cookieToken)
      if (payload) {
        return await prisma.user.findUnique({ where: { id: payload.userId } })
      }
    }
    return null
  }
  
  const payload = verifyToken(token)
  if (!payload) return null
  
  return await prisma.user.findUnique({ where: { id: payload.userId } })
}

/**
 * GET /api/recommendations
 * Get personalized content recommendations (public endpoint, enhanced for authenticated users)
 * 
 * @param searchParams.type - Content type: 'movie', 'series', or 'all' (optional)
 * @param searchParams.algorithm - Algorithm: 'collaborative', 'content-based', 'hybrid', 'trending' (optional)
 * @param searchParams.limit - Results limit (optional, default: 20)
 * @returns Array of recommended content
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting for recommendations endpoint
    const { apiRateLimiter, getClientIdentifier } = await import('@/lib/rateLimit')
    const clientId = getClientIdentifier(request)
    const rateLimit = await apiRateLimiter.check(clientId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: 'Too many requests. Please try again later.', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimit.resetTime / 1000)) } }
      )
    }

    const user = await getAuthUser(request)
    const searchParams = request.nextUrl.searchParams
    
    const type = searchParams.get('type') as 'movie' | 'series' | 'all' | null
    const algorithm = searchParams.get('algorithm') as 'collaborative' | 'content-based' | 'hybrid' | 'trending' | null
    const limit = parseInt(searchParams.get('limit') || '20')

    // If no user, return trending
    if (!user) {
      const recommendations = await recommendationService.getTrendingRecommendations(
        limit,
        type || 'all'
      )
      return NextResponse.json(recommendations)
    }

    // Check cache
    const cacheKey = `recommendations:${user.id}:${type}:${algorithm}:${limit}`
    const cached = await cacheService.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const recommendations = await recommendationService.getRecommendations({
      userId: user.id,
      limit,
      type: type || 'all',
      algorithm: algorithm || 'hybrid',
    })

    // Cache for 1 hour
    await cacheService.set(cacheKey, recommendations, { ttl: 3600 })

    return NextResponse.json(recommendations)
  } catch (error) {
    const { logError, handleError } = await import('@/lib/errorHandler')
    logError(error, 'Get recommendations')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message, code: errorInfo.code },
      { status: errorInfo.statusCode }
    )
  }
}


