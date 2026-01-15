import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { cacheService } from '@/lib/cache'
import { handleError, logError } from '@/lib/errorHandler'

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin(request)

    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || '7d' // 7d, 30d, 90d, all

    // Check cache
    const cacheKey = `admin:analytics:${period}`
    const cached = await cacheService.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const now = new Date()
    let startDate: Date

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(0)
    }

    // Get analytics data
    const [
      totalUsers,
      newUsers,
      totalMovies,
      totalSeries,
      totalViews,
      totalWatchTime,
      activeSubscriptions,
      revenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.movie.count({ where: { isPublished: true } }),
      prisma.series.count({ where: { isPublished: true } }),
      prisma.movie.aggregate({
        _sum: { viewCount: true },
      }),
      prisma.watchHistory.aggregate({
        _sum: { duration: true },
        where: { lastWatchedAt: { gte: startDate } },
      }),
      prisma.subscription.count({
        where: { status: 'ACTIVE' },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startDate },
        },
      }),
    ])

    const analytics = {
      users: {
        total: totalUsers,
        new: newUsers,
        growth: totalUsers > 0 ? ((newUsers / totalUsers) * 100).toFixed(2) : '0',
      },
      content: {
        movies: totalMovies,
        series: totalSeries,
        total: totalMovies + totalSeries,
      },
      engagement: {
        totalViews: totalViews._sum.viewCount || 0,
        totalWatchTime: totalWatchTime._sum.duration || 0,
        averageWatchTime: totalWatchTime._sum.duration
          ? (totalWatchTime._sum.duration / (totalUsers || 1)).toFixed(2)
          : '0',
      },
      revenue: {
        total: revenue._sum.amount || 0,
        activeSubscriptions,
        averageRevenuePerUser:
          activeSubscriptions > 0
            ? ((revenue._sum.amount || 0) / activeSubscriptions).toFixed(2)
            : '0',
      },
    }

    // Cache for 5 minutes
    await cacheService.set(cacheKey, analytics, { ttl: 300 })

    return NextResponse.json(analytics)
  } catch (error) {
    logError(error, 'Get analytics')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message },
      { status: errorInfo.statusCode }
    )
  }
}


