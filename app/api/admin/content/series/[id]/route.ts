import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleError, logError } from '@/lib/errorHandler'
import { storageService } from '@/lib/storage'
import { logger } from '@/lib/logger'

// Force dynamic rendering - this route uses headers and Prisma
export const dynamic = 'force-dynamic'

// Increase max duration for file uploads (Vercel allows up to 300s for Pro plans)
export const maxDuration = 300

/**
 * GET /api/admin/content/series/[id]
 * Get a single series (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request)

    const series = await prisma.series.findUnique({
      where: { id: params.id },
      include: {
        genres: true,
        episodes: {
          orderBy: { episodeNumber: 'asc' },
        },
      },
    })

    if (!series) {
      return NextResponse.json(
        { message: 'Series not found' },
        { status: 404 }
      )
    }

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

/**
 * PATCH /api/admin/content/series/[id]
 * Update a series (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    await requireAdmin(request)

    // Check if request is FormData (file upload) or JSON
    const contentType = request.headers.get('content-type') || ''
    const isFormData = contentType.includes('multipart/form-data')

    let updateData: any = {}
    let genres: string[] = []

    if (isFormData) {
      // Handle FormData (with files)
      const formData = await request.formData()
      
      // Extract text fields
      const title = formData.get('title') as string
      const titleNepali = formData.get('titleNepali') as string
      const description = formData.get('description') as string
      const descriptionNepali = formData.get('descriptionNepali') as string
      const releaseDate = formData.get('releaseDate') as string
      const rating = formData.get('rating') as string
      const ageRating = formData.get('ageRating') as string
      const quality = formData.get('quality') as string
      const cast = formData.get('cast') as string
      const matureThemes = formData.get('matureThemes') as string
      const tags = formData.get('tags') as string
      const isPublished = formData.get('isPublished') === 'true'
      const isFeatured = formData.get('isFeatured') === 'true'
      const genresStr = formData.get('genres') as string

      if (genresStr) {
        try {
          genres = JSON.parse(genresStr)
        } catch (e) {
          genres = []
        }
      }

      updateData = {
        ...(title && { title }),
        ...(titleNepali !== undefined && { titleNepali: titleNepali || null }),
        ...(description && { description }),
        ...(descriptionNepali !== undefined && { descriptionNepali: descriptionNepali || null }),
        ...(releaseDate && { releaseDate: new Date(releaseDate) }),
        ...(rating && { rating: parseFloat(rating) }), // Store on 5-point scale
        ...(ageRating && { ageRating }),
        ...(quality !== undefined && { quality: quality || null }),
        ...(cast !== undefined && { cast: cast || null }),
        ...(matureThemes !== undefined && { matureThemes: matureThemes || null }),
        ...(tags !== undefined && { tags: tags || null }),
        ...(typeof isPublished === 'boolean' && { isPublished }),
        ...(typeof isFeatured === 'boolean' && { isFeatured }),
      }

      // Handle file uploads
      const posterFile = formData.get('poster') as File | null
      const backdropFile = formData.get('backdrop') as File | null
      const videoFile = formData.get('video') as File | null
      const trailerFile = formData.get('trailer') as File | null

      if (storageService.isConfigured()) {
        if (posterFile && posterFile.size > 0) {
          const buffer = Buffer.from(await posterFile.arrayBuffer())
          const posterUrl = await storageService.upload({
            file: buffer,
            fileName: `posters/${Date.now()}-${posterFile.name}`,
            contentType: posterFile.type,
          })
          updateData.posterUrl = posterUrl
        }

        if (backdropFile && backdropFile.size > 0) {
          const buffer = Buffer.from(await backdropFile.arrayBuffer())
          const backdropUrl = await storageService.upload({
            file: buffer,
            fileName: `backdrops/${Date.now()}-${backdropFile.name}`,
            contentType: backdropFile.type,
          })
          updateData.backdropUrl = backdropUrl
        }

        if (videoFile && videoFile.size > 0) {
          const buffer = Buffer.from(await videoFile.arrayBuffer())
          const videoUrl = await storageService.upload({
            file: buffer,
            fileName: `videos/${Date.now()}-${videoFile.name}`,
            contentType: videoFile.type,
          })
          updateData.videoUrl = videoUrl
        }

        if (trailerFile && trailerFile.size > 0) {
          const buffer = Buffer.from(await trailerFile.arrayBuffer())
          const trailerUrl = await storageService.upload({
            file: buffer,
            fileName: `trailers/${Date.now()}-${trailerFile.name}`,
            contentType: trailerFile.type,
          })
          updateData.trailerUrl = trailerUrl
        }
      }
    } else {
      // Handle JSON (metadata only)
      const body = await request.json()
      const { title, titleNepali, description, descriptionNepali, releaseDate, rating, ageRating, quality, cast, matureThemes, tags, isPublished, isFeatured, genres: genresFromBody, ...otherFields } = body

      genres = genresFromBody || []

      // Store rating on 5-point scale directly
      const ratingValue = rating !== undefined ? (rating ? parseFloat(rating) : null) : undefined

      updateData = {
        ...(title && { title }),
        ...(titleNepali !== undefined && { titleNepali }),
        ...(description && { description }),
        ...(descriptionNepali !== undefined && { descriptionNepali }),
        ...(releaseDate && { releaseDate: new Date(releaseDate) }),
        ...(ratingValue !== undefined && { rating: ratingValue }),
        ...(ageRating && { ageRating }),
        ...(quality !== undefined && { quality }),
        ...(cast !== undefined && { cast }),
        ...(matureThemes !== undefined && { matureThemes }),
        ...(tags !== undefined && { tags }),
        ...(typeof isPublished === 'boolean' && { isPublished }),
        ...(typeof isFeatured === 'boolean' && { isFeatured }),
        ...otherFields,
      }
    }

    // Handle genres - connect/disconnect
    const genreData: any = {}
    if (genres && Array.isArray(genres) && genres.length > 0) {
      genreData.genres = {
        set: [], // Clear existing
        connect: genres.map((genreId: string) => ({ id: genreId })),
      }
    }

    const series = await prisma.series.update({
      where: { id: params.id },
      data: {
        ...updateData,
        ...genreData,
      },
      include: {
        genres: true,
      },
    })

    logger.info(`Series updated: ${series.id}`, { seriesId: series.id })
    return NextResponse.json(series)
  } catch (error) {
    logError(error, 'Update admin series')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message },
      { status: errorInfo.statusCode }
    )
  }
}

/**
 * DELETE /api/admin/content/series/[id]
 * Delete a series (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    await requireAdmin(request)

    await prisma.series.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Series deleted successfully' })
  } catch (error) {
    logError(error, 'Delete admin series')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message },
      { status: errorInfo.statusCode }
    )
  }
}


