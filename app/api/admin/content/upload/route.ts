import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { storageService } from '@/lib/storage'
import { requireAdmin } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { handleError, logError } from '@/lib/errorHandler'

// Force dynamic rendering - this route uses headers and Prisma
export const dynamic = 'force-dynamic'

// Increase max duration for file uploads (Vercel allows up to 300s for Pro plans)
export const maxDuration = 300

export async function POST(request: NextRequest) {
  let admin: { id: string; role: string; email: string | null } | null = null
  try {
    // Require admin authentication
    admin = await requireAdmin(request)
    logger.info('Admin content upload initiated', { adminId: admin.id })

    const formData = await request.formData()
    const contentType = formData.get('contentType') as 'movie' | 'series'
    
    if (!contentType || !['movie', 'series'].includes(contentType)) {
      return NextResponse.json(
        { message: 'Invalid content type' },
        { status: 400 }
      )
    }

    // Extract form data
    const title = formData.get('title') as string
    const titleNepali = formData.get('titleNepali') as string
    const description = formData.get('description') as string
    const descriptionNepali = formData.get('descriptionNepali') as string
    const releaseDate = formData.get('releaseDate') as string
    const duration = formData.get('duration') as string
    const rating = formData.get('rating') as string
    const ageRating = formData.get('ageRating') as string || 'PG'
    const quality = formData.get('quality') as string
    const cast = formData.get('cast') as string
    const matureThemes = formData.get('matureThemes') as string
    const tags = formData.get('tags') as string
    const isPublished = formData.get('isPublished') === 'true'
    const isFeatured = formData.get('isFeatured') === 'true'
    const publishDate = formData.get('publishDate') as string
    const genresStr = formData.get('genres') as string | null
    let genres: string[] = []
    
    // Parse genres from JSON string
    if (genresStr) {
      try {
        genres = JSON.parse(genresStr)
      } catch (e) {
        logger.warn('Failed to parse genres JSON', { genresStr })
        genres = []
      }
    }

    if (!title || !description || !releaseDate) {
      return NextResponse.json(
        { message: 'Title, description, and release date are required' },
        { status: 400 }
      )
    }

    // Handle file uploads with validation
    const posterFile = formData.get('poster') as File | null
    const backdropFile = formData.get('backdrop') as File | null
    const videoFile = formData.get('video') as File | null
    const trailerFile = formData.get('trailer') as File | null

    // Validate file sizes and types
    const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB
    const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

    const validateFile = (file: File | null, allowedTypes: string[], maxSize: number, fieldName: string) => {
      if (!file) return
      if (file.size > maxSize) {
        throw new Error(`${fieldName} file size exceeds ${maxSize / 1024 / 1024}MB limit`)
      }
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`${fieldName} file type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`)
      }
    }

    validateFile(posterFile, ALLOWED_IMAGE_TYPES, 10 * 1024 * 1024, 'Poster') // 10MB for images
    validateFile(backdropFile, ALLOWED_IMAGE_TYPES, 10 * 1024 * 1024, 'Backdrop')
    validateFile(videoFile, ALLOWED_VIDEO_TYPES, MAX_FILE_SIZE, 'Video')
    validateFile(trailerFile, ALLOWED_VIDEO_TYPES, MAX_FILE_SIZE, 'Trailer')

    let posterUrl = ''
    let backdropUrl = ''
    let videoUrl = ''
    let trailerUrl = ''

    // Upload files if provided
    if (storageService.isConfigured()) {
      if (posterFile) {
        const buffer = Buffer.from(await posterFile.arrayBuffer())
        posterUrl = await storageService.upload({
          file: buffer,
          fileName: `posters/${Date.now()}-${posterFile.name}`,
          contentType: posterFile.type,
        })
      }

      if (backdropFile) {
        const buffer = Buffer.from(await backdropFile.arrayBuffer())
        backdropUrl = await storageService.upload({
          file: buffer,
          fileName: `backdrops/${Date.now()}-${backdropFile.name}`,
          contentType: backdropFile.type,
        })
      }

      if (videoFile) {
        const buffer = Buffer.from(await videoFile.arrayBuffer())
        videoUrl = await storageService.upload({
          file: buffer,
          fileName: `videos/${Date.now()}-${videoFile.name}`,
          contentType: videoFile.type,
        })
      }

      if (trailerFile) {
        const buffer = Buffer.from(await trailerFile.arrayBuffer())
        trailerUrl = await storageService.upload({
          file: buffer,
          fileName: `trailers/${Date.now()}-${trailerFile.name}`,
          contentType: trailerFile.type,
        })
      }
    } else {
      // Fallback: Use placeholder URLs if storage not configured
      posterUrl = posterFile ? `/uploads/${posterFile.name}` : ''
      backdropUrl = backdropFile ? `/uploads/${backdropFile.name}` : ''
      videoUrl = videoFile ? `/uploads/${videoFile.name}` : ''
      trailerUrl = trailerFile ? `/uploads/${trailerFile.name}` : ''
      
      logger.warn('Storage not configured, using placeholder URLs')
    }

    // Create content in database
    if (contentType === 'movie') {
      if (!duration) {
        return NextResponse.json(
          { message: 'Duration is required for movies' },
          { status: 400 }
        )
      }

      // Store rating on 5-point scale directly
      const ratingValue = rating ? parseFloat(rating) : null

      const movie = await prisma.movie.create({
        data: {
          title,
          titleNepali: titleNepali || null,
          description,
          descriptionNepali: descriptionNepali || null,
          posterUrl: posterUrl || '/placeholder-poster.jpg',
          backdropUrl: backdropUrl || null,
          trailerUrl: trailerUrl || null,
          releaseDate: new Date(releaseDate),
          duration: parseInt(duration),
          rating: ratingValue,
          ageRating,
          quality: quality || null,
          cast: cast || null,
          matureThemes: matureThemes || null,
          tags: tags || null,
          isPublished,
          isFeatured,
          videoUrl: videoUrl || '/videos/sample.m3u8', // Fallback
          genres: {
            connect: genres.map((genreId: string) => ({ id: genreId })),
          },
        },
      })

      logger.info(`Movie created: ${movie.id}`, { userId: admin.id, movieId: movie.id })

      return NextResponse.json({
        message: 'Movie uploaded successfully',
        movie,
      })
    } else {
      // Series
      // Store rating on 5-point scale directly
      const ratingValue = rating ? parseFloat(rating) : null

      const series = await prisma.series.create({
        data: {
          title,
          titleNepali: titleNepali || null,
          description,
          descriptionNepali: descriptionNepali || null,
          posterUrl: posterUrl || '/placeholder-poster.jpg',
          backdropUrl: backdropUrl || null,
          trailerUrl: trailerUrl || null,
          releaseDate: new Date(releaseDate),
          rating: ratingValue,
          ageRating,
          quality: quality || null,
          cast: cast || null,
          matureThemes: matureThemes || null,
          tags: tags || null,
          isPublished,
          isFeatured,
          genres: {
            connect: genres.map((genreId: string) => ({ id: genreId })),
          },
        },
      })

      logger.info(`Series created: ${series.id}`, { userId: admin.id, seriesId: series.id })

      return NextResponse.json({
        message: 'Series uploaded successfully',
        series,
      })
    }
  } catch (error) {
    logError(error, 'Content upload', admin?.id, '/api/admin/content/upload')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message },
      { status: errorInfo.statusCode }
    )
  }
}


