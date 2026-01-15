import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiRateLimiter, getClientIdentifier } from '@/lib/rateLimit'
import { handleError, logError } from '@/lib/errorHandler'

/**
 * GET /api/content/movies
 * Get all published movies (public endpoint with rate limiting)
 * 
 * @param searchParams.featured - Filter featured movies (optional)
 * @param searchParams.limit - Limit results (optional, default: 50)
 * @param searchParams.offset - Offset for pagination (optional, default: 0)
 * @returns Array of published movies
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimit = await apiRateLimiter.check(clientId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: 'Too many requests. Please try again later.', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimit.resetTime / 1000)) } }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const featured = searchParams.get('featured') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {
      isPublished: true,
    }

    if (featured) {
      where.isFeatured = true
    }

    const movies = await prisma.movie.findMany({
      where,
      include: {
        genres: true,
      },
      orderBy: {
        viewCount: 'desc',
      },
      take: limit,
      skip: offset,
    })

    return NextResponse.json(movies)
  } catch (error) {
    logError(error, 'Get movies')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message, code: errorInfo.code },
      { status: errorInfo.statusCode }
    )
  }
}
