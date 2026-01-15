import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleError, logError } from '@/lib/errorHandler'

// Force dynamic rendering - this route uses Prisma
export const dynamic = 'force-dynamic'

/**
 * GET /api/content/movie/[id]
 * Get movie details by ID (public endpoint)
 * 
 * @param params.id - Movie ID
 * @returns Movie object with genres
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const movie = await prisma.movie.findUnique({
      where: { id: params.id },
      include: {
        genres: true,
      },
    })

    if (!movie || !movie.isPublished) {
      return NextResponse.json(
        { message: 'Movie not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(movie)
  } catch (error) {
    logError(error, 'Get movie', undefined, `/api/content/movie/${params.id}`)
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message, code: errorInfo.code },
      { status: errorInfo.statusCode }
    )
  }
}




