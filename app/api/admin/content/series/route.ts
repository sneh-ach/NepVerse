import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleError, logError } from '@/lib/errorHandler'

// Force dynamic rendering - this route uses headers and Prisma
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/content/series
 * Get all series (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin(request)

    const series = await prisma.series.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        genres: true,
        episodes: {
          orderBy: { episodeNumber: 'asc' },
        },
      },
    })

    return NextResponse.json(series)
  } catch (error) {
    logError(error, 'Get admin series')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message },
      { status: errorInfo.statusCode }
    )
  }
}


