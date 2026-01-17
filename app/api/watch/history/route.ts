import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractTokenFromHeader } from '@/lib/auth'
import { getProfileId } from '@/lib/getProfileId'

// Force dynamic rendering - this route uses headers
export const dynamic = 'force-dynamic'

async function getUserId(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization')
    const token = extractTokenFromHeader(authHeader) || 
                 request.cookies.get('token')?.value || 
                 request.cookies.get('auth-token')?.value

    if (!token) return null

    const payload = verifyToken(token)
    return payload?.userId || null
  } catch (error) {
    // Silent fail for token verification - will be handled by route
    return null
  }
}

/**
 * GET /api/watch/history
 * Get watch history for the authenticated user
 * 
 * @param searchParams.movieId - Filter by movie ID (optional)
 * @param searchParams.seriesId - Filter by series ID (optional)
 * @param searchParams.limit - Maximum number of results (optional, default: 50)
 * @returns Array of watch history entries
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

    const history = await prisma.watchHistory.findMany({
      where: { 
        userId,
        profileId, // Filter by profile
      },
      include: {
        movie: true,
        series: true,
        episode: {
          include: {
            series: true,
          },
        },
      },
      orderBy: {
        lastWatchedAt: 'desc',
      },
      take: limit,
      skip: offset,
    })

    const total = await prisma.watchHistory.count({
      where: { 
        userId,
        profileId, // Filter by profile
      },
    })

    return NextResponse.json({
      history,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    const { logError, handleError } = await import('@/lib/errorHandler')
    logError(error, 'Get watch history')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message, code: errorInfo.code },
      { status: errorInfo.statusCode }
    )
  }
}

/**
 * POST /api/watch/history
 * Save or update watch history for the authenticated user
 * 
 * @param body.movieId - Movie ID (required if no seriesId/episodeId)
 * @param body.seriesId - Series ID (required if no movieId/episodeId)
 * @param body.episodeId - Episode ID (required if no movieId/seriesId)
 * @param body.progress - Watch progress percentage (0-100, required)
 * @param body.currentTime - Current playback time in seconds (required, min: 0)
 * @param body.duration - Total duration in seconds (required, min: 0)
 * @param body.completed - Whether content is completed (optional)
 * @returns Created or updated watch history entry
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

    const body = await request.json()
    
    // Validate input with Zod
    const { validate, watchHistorySchema } = await import('@/lib/validation')
    const validation = validate(watchHistorySchema, body)
    
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error, code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const { movieId, seriesId, episodeId, progress, currentTime, duration, completed } = validation.data

    // Sanitize input (already validated by Zod, but ensure ranges)
    const sanitizedProgress = Math.max(0, Math.min(100, progress))
    const sanitizedCurrentTime = Math.max(0, currentTime)
    const sanitizedDuration = Math.max(0, Number(duration) || 0)

    const data: any = {
      userId,
      profileId, // Add profile ID
      progress: sanitizedProgress,
      currentTime: sanitizedCurrentTime,
      duration: sanitizedDuration,
      completed: Boolean(completed),
    }

    if (movieId) {
      data.movieId = movieId
    }

    if (seriesId) {
      data.seriesId = seriesId
      if (episodeId) {
        data.episodeId = episodeId
      }
    }

    // Verify that the movie/series exists in the database (if provided)
    if (movieId) {
      const movie = await prisma.movie.findUnique({
        where: { id: movieId },
      })
      if (!movie) {
        // Movie doesn't exist in DB - this is OK for mock data, return 404 so client can fallback
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
        // Series doesn't exist in DB - this is OK for mock data, return 404 so client can fallback
        return NextResponse.json(
          { message: `Series with ID ${seriesId} not found in database` },
          { status: 404 }
        )
      }
    }

    // For now, use findFirst + create/update since unique constraints include profileId which may be null
    const existing = await prisma.watchHistory.findFirst({
      where: {
        userId,
        profileId,
        ...(movieId ? { movieId } : { seriesId: seriesId!, episodeId: episodeId! }),
      },
    })

    let watchHistory
    if (existing) {
      watchHistory = await prisma.watchHistory.update({
        where: { id: existing.id },
        data: {
          progress: data.progress,
          currentTime: data.currentTime,
          duration: data.duration,
          completed: data.completed,
          lastWatchedAt: new Date(),
        },
      })
    } else {
      watchHistory = await prisma.watchHistory.create({
        data,
      })

      // Create activity for first watch
      try {
        const { createActivity } = await import('@/lib/achievements')
        await createActivity(
          userId,
          'WATCHED',
          movieId || seriesId || null,
          movieId ? 'movie' : 'series',
          { progress: data.progress }
        )
      } catch (error) {
        console.error('Error creating activity:', error)
      }

      // Check achievements
      try {
        const { checkAndAwardAchievements } = await import('@/lib/achievements')
        await checkAndAwardAchievements(userId)
      } catch (error) {
        console.error('Error checking achievements:', error)
      }
    }

    return NextResponse.json(watchHistory)
  } catch (error: any) {
    const { logError, handleError } = await import('@/lib/errorHandler')
    logError(error, 'Update watch history')
    
    // Handle Prisma unique constraint errors gracefully
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'Watch history entry already exists', code: 'DUPLICATE_ENTRY' },
        { status: 409 }
      )
    }
    
    // Handle foreign key constraint errors
    if (error.code === 'P2003') {
      return NextResponse.json(
        { message: 'Referenced content not found in database', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }
    
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
 * DELETE /api/watch/history
 * Delete watch history entry (authenticated users only)
 * 
 * @param body.movieId - Movie ID to remove from history (required if no seriesId/episodeId)
 * @param body.seriesId - Series ID to remove from history (required if no movieId/episodeId)
 * @param body.episodeId - Episode ID to remove from history (required if no movieId/seriesId)
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

    // Delete only current profile's history
    await prisma.watchHistory.deleteMany({
      where: { 
        userId,
        profileId, // Only delete current profile's history
      },
    })

    return NextResponse.json({ message: 'Watch history cleared' })
  } catch (error) {
    const { logError, handleError } = await import('@/lib/errorHandler')
    logError(error, 'Clear watch history')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message, code: errorInfo.code },
      { status: errorInfo.statusCode }
    )
  }
}
