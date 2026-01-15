import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiRateLimiter, getClientIdentifier } from '@/lib/rateLimit'
import { handleError, logError } from '@/lib/errorHandler'

/**
 * GET /api/content/search
 * Search for movies and series (public endpoint with rate limiting)
 * 
 * @param searchParams.q - Search query (optional)
 * @param searchParams.genre - Filter by genre (optional)
 * @param searchParams.year - Filter by year (optional)
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

    // Search database
    const where: any = {
      isPublished: true,
    }

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { titleNepali: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ]
    }

    if (genre && genre !== 'all') {
      where.genres = {
        some: {
          slug: genre,
        },
      }
    }

    if (year && year !== 'all') {
      where.releaseDate = {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${parseInt(year) + 1}-01-01`),
      }
    }

    const movies = await prisma.movie.findMany({
      where,
      include: {
        genres: true,
      },
      take: 20,
    })

    const series = await prisma.series.findMany({
      where,
      include: {
        genres: true,
      },
      take: 20,
    })

    const results = [
      ...movies.map((m) => ({
        id: m.id,
        title: m.title,
        posterUrl: m.posterUrl,
        type: 'movie' as const,
      })),
      ...series.map((s) => ({
        id: s.id,
        title: s.title,
        posterUrl: s.posterUrl,
        type: 'series' as const,
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

