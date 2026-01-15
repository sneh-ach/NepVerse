import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiRateLimiter, getClientIdentifier } from '@/lib/rateLimit'
import { handleError, logError } from '@/lib/errorHandler'

// Force dynamic rendering - this route uses searchParams and headers
export const dynamic = 'force-dynamic'

/**
 * GET /api/content/search
 * Search for movies and series (public endpoint with rate limiting)
 * 
 * @param searchParams.q - Search query (optional)
 * @param searchParams.genre - Filter by genre (optional)
 * @param searchParams.year - Filter by year (optional)
 * @param searchParams.rating - Filter by minimum rating (optional, e.g., "4.5")
 * @param searchParams.ageRating - Filter by age rating (optional, e.g., "PG", "PG-13")
 * @param searchParams.quality - Filter by quality (optional, e.g., "4K", "1080p")
 * @param searchParams.type - Filter by content type (optional, "movie" or "series")
 * @returns Array of search results
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
    const genre = searchParams.get('genre')
    const year = searchParams.get('year')
    const rating = searchParams.get('rating')
    const ageRating = searchParams.get('ageRating')
    const quality = searchParams.get('quality')
    const contentType = searchParams.get('type')

    // Build where clause for movies
    const movieWhere: any = {
      isPublished: true,
    }

    // Build where clause for series
    const seriesWhere: any = {
      isPublished: true,
    }

    // Apply filters that apply to both
    const applyCommonFilters = (whereClause: any) => {
      if (query) {
        whereClause.OR = [
          { title: { contains: query, mode: 'insensitive' } },
          { titleNepali: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ]
      }

      if (genre && genre !== 'all') {
        whereClause.genres = {
          some: {
            slug: genre,
          },
        }
      }

      if (year && year !== 'all') {
        whereClause.releaseDate = {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${parseInt(year) + 1}-01-01`),
        }
      }

      if (rating && rating !== 'all') {
        const minRating = parseFloat(rating)
        whereClause.rating = {
          gte: minRating,
        }
      }

      if (ageRating && ageRating !== 'all') {
        whereClause.ageRating = ageRating
      }

      if (quality && quality !== 'all') {
        whereClause.quality = quality
      }
    }

    applyCommonFilters(movieWhere)
    applyCommonFilters(seriesWhere)

    // Fetch movies and series based on content type filter
    let movies: any[] = []
    let series: any[] = []

    if (!contentType || contentType === 'all' || contentType === 'movie') {
      movies = await prisma.movie.findMany({
        where: movieWhere,
        include: {
          genres: true,
        },
        take: 50,
        orderBy: {
          viewCount: 'desc',
        },
      })
    }

    if (!contentType || contentType === 'all' || contentType === 'series') {
      series = await prisma.series.findMany({
        where: seriesWhere,
        include: {
          genres: true,
        },
        take: 50,
        orderBy: {
          viewCount: 'desc',
        },
      })
    }

    const results = [
      ...movies.map((m) => ({
        id: m.id,
        title: m.title,
        posterUrl: m.posterUrl,
        backdropUrl: m.backdropUrl,
        type: 'movie' as const,
        rating: m.rating ?? undefined,
        year: new Date(m.releaseDate).getFullYear(),
      })),
      ...series.map((s) => ({
        id: s.id,
        title: s.title,
        posterUrl: s.posterUrl,
        backdropUrl: s.backdropUrl,
        type: 'series' as const,
        rating: s.rating ?? undefined,
        year: new Date(s.releaseDate).getFullYear(),
      })),
    ]

    return NextResponse.json(results)
  } catch (error) {
    logError(error, 'Content search')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message, code: errorInfo.code },
      { status: errorInfo.statusCode }
    )
  }
}

