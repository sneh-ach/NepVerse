import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractTokenFromHeader } from '@/lib/auth'
import { getProfileId } from '@/lib/getProfileId'

// Force dynamic rendering - this route uses headers
export const dynamic = 'force-dynamic'

async function getUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization')
  const token = extractTokenFromHeader(authHeader) || request.cookies.get('auth-token')?.value || request.cookies.get('token')?.value

  if (!token) return null

  try {
    const payload = verifyToken(token)
    return payload?.userId || null
  } catch (error) {
    // Silent fail for token verification - will be handled by route
    return null
  }
}

/**
 * GET /api/watch/list
 * Get watchlist for the authenticated user
 * 
 * @returns Array of watchlist items (movies and series)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get current profile ID
    const profileId = await getProfileId(request)
    if (!profileId) {
      return NextResponse.json(
        { message: 'No profile selected' },
        { status: 400 }
      )
    }

    // Get pagination params
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Max 100
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

    const watchList = await prisma.watchList.findMany({
      where: { 
        userId,
        profileId, // Filter by profile
      },
      include: {
        movie: true,
        series: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    })

    const total = await prisma.watchList.count({
      where: { 
        userId,
        profileId, // Filter by profile
      },
    })

    return NextResponse.json({
      watchList,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    const { logError, handleError } = await import('@/lib/errorHandler')
    logError(error, 'Get watchlist')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message, code: errorInfo.code },
      { status: errorInfo.statusCode }
    )
  }
}

/**
 * POST /api/watch/list
 * Add item to watchlist (authenticated users only)
 * 
 * @param body.movieId - Movie ID to add (required if no seriesId)
 * @param body.seriesId - Series ID to add (required if no movieId)
 * @returns Created watchlist item
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get current profile ID
    const profileId = await getProfileId(request)
    if (!profileId) {
      return NextResponse.json(
        { message: 'No profile selected. Please select a profile first.' },
        { status: 400 }
      )
    }

    const { movieId, seriesId } = await request.json()

    if (!movieId && !seriesId) {
      return NextResponse.json(
        { message: 'movieId or seriesId is required' },
        { status: 400 }
      )
    }

    // Verify that the movie/series exists in the database
    if (movieId) {
      const movie = await prisma.movie.findUnique({
        where: { id: movieId },
      })
      if (!movie) {
        return NextResponse.json(
          { message: `Movie with ID ${movieId} not found in database` },
          { status: 404 }
        )
      }
    }

    if (seriesId) {
      const series = await prisma.series.findUnique({
        where: { id: seriesId },
      })
      if (!series) {
        return NextResponse.json(
          { message: `Series with ID ${seriesId} not found in database` },
          { status: 404 }
        )
      }
    }

    const data: any = { 
      userId,
      profileId, // Add profile ID
    }
    if (movieId) data.movieId = movieId
    if (seriesId) data.seriesId = seriesId

    // Check if item already exists (by profile)
    const existing = await prisma.watchList.findFirst({
      where: {
        userId,
        profileId,
        ...(movieId ? { movieId } : { seriesId: seriesId! }),
      },
    })

    let watchListItem
    if (existing) {
      // Already in list, return existing
      watchListItem = existing
    } else {
      // Create new entry
      watchListItem = await prisma.watchList.create({
        data,
      })

      // Create activity
      try {
        const { createActivity } = await import('@/lib/achievements')
        await createActivity(
          userId,
          'ADDED_TO_LIST',
          movieId || seriesId || null,
          movieId ? 'movie' : 'series',
          {}
        )
      } catch (error) {
        console.error('Error creating activity:', error)
      }
    }

    return NextResponse.json(watchListItem)
  } catch (error: any) {
    const { logError, handleError } = await import('@/lib/errorHandler')
    logError(error, 'Add to watchlist')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { 
        message: errorInfo.message,
        code: errorInfo.code
      },
      { status: errorInfo.statusCode }
    )
  }
}

/**
 * DELETE /api/watch/list
 * Remove item from watchlist (authenticated users only)
 * 
 * @param body.movieId - Movie ID to remove (required if no seriesId)
 * @param body.seriesId - Series ID to remove (required if no movieId)
 * @returns Success message
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get current profile ID
    const profileId = await getProfileId(request)
    if (!profileId) {
      return NextResponse.json(
        { message: 'No profile selected. Please select a profile first.' },
        { status: 400 }
      )
    }

    const { movieId, seriesId } = await request.json()

    if (!movieId && !seriesId) {
      return NextResponse.json(
        { message: 'movieId or seriesId is required' },
        { status: 400 }
      )
    }

    // Delete only from current profile's watchlist
    await prisma.watchList.deleteMany({
      where: {
        profileId, // Filter by profile
        ...(movieId ? { movieId } : { seriesId: seriesId! }),
      },
    })

    return NextResponse.json({ message: 'Removed from watchlist' })
  } catch (error: any) {
    const { logError, handleError } = await import('@/lib/errorHandler')
    logError(error, 'Remove from watchlist')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { 
        message: errorInfo.message,
        code: errorInfo.code
      },
      { status: errorInfo.statusCode }
    )
  }
}




