import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleError, logError } from '@/lib/errorHandler'

/**
 * GET /api/admin/movies
 * Get all movies (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin(request)

    const movies = await prisma.movie.findMany({
      include: {
        genres: true,
      },
      orderBy: {
        createdAt: 'desc',
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

/**
 * POST /api/admin/movies
 * Create a new movie (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin(request)

    const data = await request.json()
    const { genres, ...movieData } = data

    const movie = await prisma.movie.create({
      data: {
        ...movieData,
        releaseDate: new Date(movieData.releaseDate),
        genres: {
          connect: genres?.map((id: string) => ({ id })) || [],
        },
      },
      include: {
        genres: true,
      },
    })

    return NextResponse.json(movie)
  } catch (error) {
    logError(error, 'Create admin movie')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message },
      { status: errorInfo.statusCode }
    )
  }
}




