import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleError, logError } from '@/lib/errorHandler'

// Force dynamic rendering - this route uses headers and Prisma
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin(request)

    const [movies, series, users, watchHistory] = await Promise.all([
      prisma.movie.count(),
      prisma.series.count(),
      prisma.user.count(),
      prisma.watchHistory.count(),
    ])

    const totalViews = await prisma.movie.aggregate({
      _sum: {
        viewCount: true,
      },
    })

    return NextResponse.json({
      movies,
      series,
      users,
      views: totalViews._sum.viewCount || 0,
    })
  } catch (error: any) {
    logError(error, 'Get admin stats')
    const errorInfo = handleError(error)
    
    // If database error, return default stats
    if (error.message?.includes('Can\'t reach database') || 
        error.code === 'P1001' || 
        error.message?.includes('PrismaClient')) {
      return NextResponse.json({
        movies: 0,
        series: 0,
        users: 0,
        views: 0,
      })
    }
    
    return NextResponse.json(
      { message: errorInfo.message },
      { status: errorInfo.statusCode }
    )
  }
}



