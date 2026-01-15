import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, verifyToken } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { handleError, logError } from '@/lib/errorHandler'

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
  
  if (!token) {
    const cookieToken = request.cookies.get('token')?.value
    if (cookieToken) {
      const payload = verifyToken(cookieToken)
      if (payload) {
        return await prisma.user.findUnique({ where: { id: payload.userId } })
      }
    }
    return null
  }
  
  const payload = verifyToken(token)
  if (!payload) return null
  
  return await prisma.user.findUnique({ where: { id: payload.userId } })
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { items, contentType } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: 'Items array is required' },
        { status: 400 }
      )
    }

    if (!contentType || !['movie', 'series'].includes(contentType)) {
      return NextResponse.json(
        { message: 'Invalid content type' },
        { status: 400 }
      )
    }

    const results = {
      created: 0,
      errors: [] as string[],
    }

    for (const item of items) {
      try {
        if (contentType === 'movie') {
          await prisma.movie.create({
            data: {
              title: item.title,
              titleNepali: item.titleNepali || null,
              description: item.description || '',
              descriptionNepali: item.descriptionNepali || null,
              posterUrl: item.posterUrl || '/placeholder-poster.jpg',
              backdropUrl: item.backdropUrl || null,
              trailerUrl: item.trailerUrl || null,
              releaseDate: new Date(item.releaseDate || Date.now()),
              duration: item.duration || 120,
              rating: item.rating || null,
              ageRating: item.ageRating || 'PG',
              isPublished: item.isPublished || false,
              isFeatured: item.isFeatured || false,
              videoUrl: item.videoUrl || '/videos/sample.m3u8',
            },
          })
        } else {
          await prisma.series.create({
            data: {
              title: item.title,
              titleNepali: item.titleNepali || null,
              description: item.description || '',
              descriptionNepali: item.descriptionNepali || null,
              posterUrl: item.posterUrl || '/placeholder-poster.jpg',
              backdropUrl: item.backdropUrl || null,
              trailerUrl: item.trailerUrl || null,
              releaseDate: new Date(item.releaseDate || Date.now()),
              rating: item.rating || null,
              ageRating: item.ageRating || 'PG',
              isPublished: item.isPublished || false,
              isFeatured: item.isFeatured || false,
            },
          })
        }
        results.created++
      } catch (error: any) {
        results.errors.push(`${item.title}: ${error.message}`)
        logger.error(`Bulk import error for ${item.title}`, error)
      }
    }

    logger.info(`Bulk import completed`, {
      userId: user.id,
      contentType,
      created: results.created,
      errors: results.errors.length,
    })

    return NextResponse.json({
      message: `Imported ${results.created} items`,
      created: results.created,
      errors: results.errors,
    })
  } catch (error) {
    logError(error, 'Bulk import')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message },
      { status: errorInfo.statusCode }
    )
  }
}


