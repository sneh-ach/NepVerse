import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getProfileId } from '@/lib/getProfileId'

export const dynamic = 'force-dynamic'

async function getUserId(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    
    if (!token) {
      const cookieToken = request.cookies.get('token')?.value || request.cookies.get('auth-token')?.value
      if (cookieToken) {
        const { verifyToken } = await import('@/lib/auth')
        const payload = verifyToken(cookieToken)
        return payload?.userId || null
      }
      return null
    }
    
    const { verifyToken } = await import('@/lib/auth')
    const payload = verifyToken(token)
    return payload?.userId || null
  } catch (error) {
    return null
  }
}

/**
 * GET /api/user/stats
 * Get watch statistics for the authenticated user
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

    const profileId = await getProfileId(request)
    if (!profileId) {
      return NextResponse.json(
        { message: 'No profile selected' },
        { status: 400 }
      )
    }

    // Get all watch history for this profile
    // @ts-expect-error - Prisma nested include type issue
    const watchHistory: any = await prisma.watchHistory.findMany({
      where: {
        userId,
        profileId,
      },
      include: {
        movie: {
          include: {
            genres: true,
          },
        },
        series: {
          include: {
            genres: true,
        },
        episode: {
          include: {
            series: {
              include: {
                genres: true,
              },
            },
          },
        },
      },
      orderBy: {
        lastWatchedAt: 'desc',
      },
    });

    // Calculate statistics
    const totalItems = watchHistory.length
    const completedItems = watchHistory.filter(h => h.completed).length
    const completionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0

    // Calculate total hours watched
    let totalSeconds = 0
    watchHistory.forEach(h => {
      // Use currentTime as the actual time watched
      totalSeconds += h.currentTime || 0
    })
    const totalHours = totalSeconds / 3600

    // Movies vs Series breakdown
    const movies = watchHistory.filter(h => h.movieId).length
    const series = watchHistory.filter(h => h.seriesId).length
    const moviesPercentage = totalItems > 0 ? (movies / totalItems) * 100 : 0
    const seriesPercentage = totalItems > 0 ? (series / totalItems) * 100 : 0

    // Genre analysis
    const genreCount: Record<string, number> = {}
    watchHistory.forEach((h: any) => {
      const genres = h.movie?.genres || h.series?.genres || h.episode?.series?.genres || []
      genres.forEach((g: any) => {
        const genreName = g.name || g
        genreCount[genreName] = (genreCount[genreName] || 0) + 1
      })
    })
    const favoriteGenres = Object.entries(genreCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    // Watch streak calculation
    const watchDates = watchHistory
      .map(h => new Date(h.lastWatchedAt).toISOString().split('T')[0])
      .filter((date, index, self) => self.indexOf(date) === index) // Unique dates
      .sort()
      .reverse()

    let currentStreak = 0
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    if (watchDates.length > 0) {
      if (watchDates[0] === today || watchDates[0] === yesterday) {
        currentStreak = 1
        for (let i = 1; i < watchDates.length; i++) {
          const currentDate = new Date(watchDates[i - 1])
          const previousDate = new Date(watchDates[i])
          const diffDays = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24))
          
          if (diffDays === 1) {
            currentStreak++
          } else {
            break
          }
        }
      }
    }

    // Most watched month/year
    const monthYearCount: Record<string, number> = {}
    watchHistory.forEach(h => {
      const date = new Date(h.lastWatchedAt)
      const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`
      monthYearCount[monthYear] = (monthYearCount[monthYear] || 0) + 1
    })
    const mostWatchedMonth = Object.entries(monthYearCount)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || null

    // Average watch time per session
    const averageWatchTime = totalItems > 0 ? totalSeconds / totalItems : 0
    const averageWatchTimeMinutes = averageWatchTime / 60

    // Unique content watched
    const uniqueMovies = new Set(watchHistory.filter(h => h.movieId).map(h => h.movieId)).size
    const uniqueSeries = new Set(watchHistory.filter(h => h.seriesId).map(h => h.seriesId)).size
    const uniqueContent = uniqueMovies + uniqueSeries

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentActivity = watchHistory.filter(h => 
      new Date(h.lastWatchedAt) >= sevenDaysAgo
    ).length

    return NextResponse.json({
      totalHours: Math.round(totalHours * 10) / 10,
      totalMinutes: Math.round(totalSeconds / 60),
      totalItems,
      completedItems,
      completionRate: Math.round(completionRate * 10) / 10,
      movies,
      series,
      moviesPercentage: Math.round(moviesPercentage * 10) / 10,
      seriesPercentage: Math.round(seriesPercentage * 10) / 10,
      favoriteGenres,
      currentStreak,
      mostWatchedMonth,
      averageWatchTimeMinutes: Math.round(averageWatchTimeMinutes * 10) / 10,
      uniqueContent,
      uniqueMovies,
      uniqueSeries,
      recentActivity,
    })
  } catch (error) {
    const { logError, handleError } = await import('@/lib/errorHandler')
    logError(error, 'Get user stats')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message, code: errorInfo.code },
      { status: errorInfo.statusCode }
    )
  }
}
