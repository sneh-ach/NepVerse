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
 * GET /api/admin/content/movies/[id]
 * Get a single movie (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request)

    const movie = await prisma.movie.findUnique({
      where: { id: params.id },
      include: {
        genres: true,
      },
    })

    if (!movie) {
      return NextResponse.json(
        { message: 'Movie not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(movie)
  } catch (error) {
    logError(error, 'Get admin movie')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message },
      { status: errorInfo.statusCode }
    )
  }
}

/**
 * PATCH /api/admin/content/movies/[id]
 * Update a movie (admin only)
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
    
    // Check content-length header to warn about large payloads
    const contentLength = request.headers.get('content-length')
    const maxBodySize = 4.5 * 1024 * 1024 // 4.5MB Vercel limit
    if (contentLength && parseInt(contentLength) > maxBodySize) {
      return NextResponse.json(
        { 
          message: 'Request body too large. Maximum size is 4.5MB. Please upload files separately or use smaller files.',
          maxSize: '4.5MB',
          yourSize: `${(parseInt(contentLength) / 1024 / 1024).toFixed(2)}MB`
        },
        { status: 413 }
      )
    }

    let updateData: any = {}
    let genres: string[] = []

    if (isFormData) {
      // Handle FormData (with files)
      let formData: FormData
      try {
        formData = await request.formData()
      } catch (formDataError: any) {
        // Handle 413 Payload Too Large error
        if (formDataError.message?.includes('413') || formDataError.message?.includes('too large')) {
          return NextResponse.json(
            { 
              message: 'Request body too large. Maximum size is 4.5MB. Please upload files separately or compress images before uploading.',
              maxSize: '4.5MB',
              tip: 'Try uploading poster and backdrop separately, or use smaller file sizes'
            },
            { status: 413 }
          )
        }
        throw formDataError
      }
      
      // Extract text fields
      const title = formData.get('title') as string
      const titleNepali = formData.get('titleNepali') as string
      const description = formData.get('description') as string
      const descriptionNepali = formData.get('descriptionNepali') as string
      const releaseDate = formData.get('releaseDate') as string
      const duration = formData.get('duration') as string
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
        ...(duration && { duration: parseInt(duration) }),
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

      // Validate file sizes before processing
      const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB for images
      const MAX_VIDEO_SIZE = 500 * 1024 * 1024 // 500MB for videos
      
      if (posterFile && posterFile.size > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          { message: `Poster file is too large. Maximum size is ${MAX_IMAGE_SIZE / 1024 / 1024}MB.` },
          { status: 400 }
        )
      }
      if (backdropFile && backdropFile.size > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          { message: `Backdrop file is too large. Maximum size is ${MAX_IMAGE_SIZE / 1024 / 1024}MB.` },
          { status: 400 }
        )
      }
      if (videoFile && videoFile.size > MAX_VIDEO_SIZE) {
        return NextResponse.json(
          { message: `Video file is too large. Maximum size is ${MAX_VIDEO_SIZE / 1024 / 1024}MB.` },
          { status: 400 }
        )
      }
      if (trailerFile && trailerFile.size > MAX_VIDEO_SIZE) {
        return NextResponse.json(
          { message: `Trailer file is too large. Maximum size is ${MAX_VIDEO_SIZE / 1024 / 1024}MB.` },
          { status: 400 }
        )
      }

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
      const { title, titleNepali, description, descriptionNepali, releaseDate, duration, rating, ageRating, quality, cast, matureThemes, tags, isPublished, isFeatured, genres: genresFromBody, ...otherFields } = body

      genres = genresFromBody || []

      // Store rating on 5-point scale directly
      const ratingValue = rating !== undefined ? (rating ? parseFloat(rating) : null) : undefined

      updateData = {
        ...(title && { title }),
        ...(titleNepali !== undefined && { titleNepali }),
        ...(description && { description }),
        ...(descriptionNepali !== undefined && { descriptionNepali }),
        ...(releaseDate && { releaseDate: new Date(releaseDate) }),
        ...(duration !== undefined && { duration: parseInt(String(duration)) }),
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

    const movie = await prisma.movie.update({
      where: { id: params.id },
      data: {
        ...updateData,
        ...genreData,
      },
      include: {
        genres: true,
      },
    })

    logger.info(`Movie updated: ${movie.id}`, { movieId: movie.id })
    return NextResponse.json(movie)
  } catch (error) {
    logError(error, 'Update admin movie')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message },
      { status: errorInfo.statusCode }
    )
  }
}

/**
 * DELETE /api/admin/content/movies/[id]
 * Delete a movie (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    await requireAdmin(request)

    await prisma.movie.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Movie deleted successfully' })
  } catch (error) {
    logError(error, 'Delete admin movie')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message },
      { status: errorInfo.statusCode }
    )
  }
}


