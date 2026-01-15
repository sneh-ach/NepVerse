import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleError, logError } from '@/lib/errorHandler'

/**
 * GET /api/admin/content/movies
 * Get all movies (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin(request)

    const movies = await prisma.movie.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        genres: true,
      },
    })

    return NextResponse.json(movies)
  } catch (error) {
    logError(error, 'Get admin movies')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message },
      { status: errorInfo.statusCode }
    )
  }
}


