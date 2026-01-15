import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleError, logError } from '@/lib/errorHandler'

// Force dynamic rendering - this route uses Prisma
export const dynamic = 'force-dynamic'

/**
 * GET /api/genres
 * Get all genres
 */
export async function GET(request: NextRequest) {
  try {
    let genres = await prisma.genre.findMany({
      orderBy: { name: 'asc' },
    })

    // If no genres exist, create default ones
    if (genres.length === 0) {
      const defaultGenres = [
        { name: 'Action', slug: 'action', description: 'Action-packed content' },
        { name: 'Comedy', slug: 'comedy', description: 'Funny and entertaining content' },
        { name: 'Drama', slug: 'drama', description: 'Dramatic stories and narratives' },
        { name: 'Horror', slug: 'horror', description: 'Scary and suspenseful content' },
        { name: 'Romance', slug: 'romance', description: 'Romantic stories' },
        { name: 'Thriller', slug: 'thriller', description: 'Suspenseful and thrilling content' },
        { name: 'Sci-Fi', slug: 'sci-fi', description: 'Science fiction content' },
        { name: 'Fantasy', slug: 'fantasy', description: 'Fantasy and magical content' },
        { name: 'Documentary', slug: 'documentary', description: 'Documentary content' },
        { name: 'Animation', slug: 'animation', description: 'Animated content' },
        { name: 'Crime', slug: 'crime', description: 'Crime and mystery content' },
        { name: 'Adventure', slug: 'adventure', description: 'Adventure content' },
      ]

      genres = await Promise.all(
        defaultGenres.map((genre) =>
          prisma.genre.create({
            data: genre,
          })
        )
      )
    }

    return NextResponse.json(genres)
  } catch (error) {
    logError(error, 'Get genres')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message },
      { status: errorInfo.statusCode }
    )
  }
}
