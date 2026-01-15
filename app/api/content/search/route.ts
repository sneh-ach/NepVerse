import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { simklClient, convertSimklMovieToApp, convertSimklShowToApp } from '@/lib/simkl'
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

    // If query exists, search Simkl first
    if (query) {
      try {
        const simklResults = await simklClient.search(query, 'all')
        const results = [
          ...(simklResults.movies || []).map(convertSimklMovieToApp).map((m) => ({
            id: m.id,
            title: m.title,
            posterUrl: m.posterUrl,
            type: 'movie' as const,
          })),
          ...(simklResults.shows || []).map(convertSimklShowToApp).map((s) => ({
            id: s.id,
            title: s.title,
            posterUrl: s.posterUrl,
            type: 'series' as const,
          })),
        ]
        
        if (results.length > 0) {
          return NextResponse.json(results.slice(0, 20))
        }
      } catch (error) {
        // Log but don't fail - fall through to database search
        logError(error, 'Simkl search', undefined, '/api/content/search')
        // Fall through to database search
      }
    }

    // Fallback to database search
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

