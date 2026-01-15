import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiRateLimiter, getClientIdentifier } from '@/lib/rateLimit'
import { handleError, logError } from '@/lib/errorHandler'

// Force dynamic rendering - this route uses searchParams and headers
export const dynamic = 'force-dynamic'

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
    // Rate limiting - wrapped in try-catch to prevent crashes
    let rateLimit = { allowed: true, remaining: 100, resetTime: Date.now() + 60000 }
    try {
      const clientId = getClientIdentifier(request)
      rateLimit = await apiRateLimiter.check(clientId)
    } catch (rateLimitError) {
      console.error('Rate limiter error (allowing request):', rateLimitError)
      // Allow request if rate limiter fails
    }
    
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
    }).catch((prismaError: any) => {
      console.error('Prisma query error in GET /api/content/movies:', prismaError)
      // Check if it's the engine error
      if (prismaError?.message?.includes('Query Engine') || prismaError?.message?.includes('libquery_engine')) {
        throw new Error('Database connection error. Please check Prisma engine configuration.')
      }
      throw prismaError
    })

    return NextResponse.json(movies)
  } catch (error) {
    console.error('Error in GET /api/content/movies:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', { errorMessage, errorStack })
    
    logError(error, 'Get movies', undefined, '/api/content/movies')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message || 'Failed to fetch movies', code: errorInfo.code },
      { status: errorInfo.statusCode || 500 }
    )
  }
}
