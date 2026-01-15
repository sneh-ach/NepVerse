import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiRateLimiter, getClientIdentifier } from '@/lib/rateLimit'
import { handleError, logError } from '@/lib/errorHandler'

// Force dynamic rendering - this route uses headers
export const dynamic = 'force-dynamic'

/**
 * GET /api/content/recommended
 * Get recommended content (public endpoint with rate limiting)
 * 
 * @returns Array of featured movies and series
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting for public recommendations endpoint
    const clientId = getClientIdentifier(request)
    const rateLimit = await apiRateLimiter.check(clientId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: 'Too many requests. Please try again later.', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimit.resetTime / 1000)) } }
      )
    }

    // Get featured and trending content
    const [featuredMovies, featuredSeries] = await Promise.all([
      prisma.movie.findMany({
        where: {
          isPublished: true,
          isFeatured: true,
        },
        take: 10,
        orderBy: {
          viewCount: 'desc',
        },
      }),
      prisma.series.findMany({
        where: {
          isPublished: true,
          isFeatured: true,
        },
        take: 10,
        orderBy: {
          viewCount: 'desc',
        },
      }),
    ])

    const results = [
      ...featuredMovies.map((m) => ({
        id: m.id,
        title: m.title,
        posterUrl: m.posterUrl,
        type: 'movie' as const,
      })),
      ...featuredSeries.map((s) => ({
        id: s.id,
        title: s.title,
        posterUrl: s.posterUrl,
        type: 'series' as const,
      })),
    ]

    return NextResponse.json(results)
  } catch (error) {
    logError(error, 'Get recommended content')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message, code: errorInfo.code },
      { status: errorInfo.statusCode }
    )
  }
}




