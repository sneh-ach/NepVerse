import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleError, logError } from '@/lib/errorHandler'

/**
 * GET /api/content/series/[id]
 * Get series details by ID (public endpoint)
 * 
 * @param params.id - Series ID
 * @returns Series object with genres and episodes
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const series = await prisma.series.findUnique({
      where: { id: params.id },
      include: {
        genres: true,
        episodes: {
          where: { isPublished: true },
          orderBy: { episodeNumber: 'asc' },
        },
      },
    })

    if (!series || !series.isPublished) {
      return NextResponse.json(
        { message: 'Series not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(series)
  } catch (error) {
    logError(error, 'Get series', undefined, `/api/content/series/${params.id}`)
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message, code: errorInfo.code },
      { status: errorInfo.statusCode }
    )
  }
}
