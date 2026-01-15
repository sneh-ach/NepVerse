import { NextRequest, NextResponse } from 'next/server'
import { searchService } from '@/lib/search'
import { cacheService } from '@/lib/cache'
import { apiRateLimiter, getClientIdentifier } from '@/lib/rateLimit'
import { handleError, logError } from '@/lib/errorHandler'

/**
 * GET /api/search
 * Advanced search for content (public endpoint with rate limiting)
 * 
 * @param searchParams.q - Search query (required)
 * @param searchParams.type - Content type: 'movie', 'series', or 'all' (optional)
 * @param searchParams.genre - Filter by genre (optional, comma-separated)
 * @param searchParams.yearMin - Minimum year (optional)
 * @param searchParams.yearMax - Maximum year (optional)
 * @param searchParams.ratingMin - Minimum rating (optional)
 * @param searchParams.sort - Sort order: 'relevance', 'rating', 'year', 'popularity' (optional)
 * @param searchParams.limit - Results limit (optional, default: 20, max: 100)
 * @param searchParams.offset - Results offset (optional, default: 0)
 * @returns Search results with pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting for public search endpoint
    const clientId = getClientIdentifier(request)
    const rateLimit = await apiRateLimiter.check(clientId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: 'Too many requests. Please try again later.', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimit.resetTime / 1000)) } }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const type = searchParams.get('type') as 'movie' | 'series' | 'all' | null
    const genre = searchParams.get('genre')
    const yearMin = searchParams.get('yearMin')
    const yearMax = searchParams.get('yearMax')
    const ratingMin = searchParams.get('ratingMin')
    const sort = searchParams.get('sort') as 'relevance' | 'rating' | 'year' | 'popularity' | null
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!query) {
      return NextResponse.json(
        { message: 'Query parameter is required' },
        { status: 400 }
      )
    }

    // Check cache
    const cacheKey = `search:${query}:${type}:${genre}:${yearMin}:${yearMax}:${sort}:${limit}:${offset}`
    const cached = await cacheService.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const results = await searchService.search({
      query,
      filters: {
        type: type || 'all',
        genre: genre ? genre.split(',') : undefined,
        year: yearMin || yearMax ? {
          min: yearMin ? parseInt(yearMin) : undefined,
          max: yearMax ? parseInt(yearMax) : undefined,
        } : undefined,
        rating: ratingMin ? {
          min: parseFloat(ratingMin),
        } : undefined,
      },
      sort: sort || 'relevance',
      limit,
      offset,
    })

    // Cache for 5 minutes
    await cacheService.set(cacheKey, results, { ttl: 300 })

    return NextResponse.json(results)
  } catch (error) {
    logError(error, 'Search')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message, code: errorInfo.code },
      { status: errorInfo.statusCode }
    )
  }
}


