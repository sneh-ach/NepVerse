import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Play, Plus, Share2, Heart, Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ContentCarousel } from '@/components/content/ContentCarousel'
import { ReviewSection } from '@/components/content/ReviewSection'
import { CommentsSection } from '@/components/content/CommentsSection'
import { formatDate, formatDuration } from '@/lib/utils'
import { MovieDetailClient } from './MovieDetailClient'
import { AutoPlayPreview } from '@/components/content/AutoPlayPreview'
import { generateMetadata as generateSEOMetadata, generateStructuredData } from '@/lib/seo'
import { prisma } from '@/lib/prisma'

async function getMovie(id: string) {
  try {
    const movie = await prisma.movie.findUnique({
      where: { id },
      include: {
        genres: true,
      },
    })

    if (!movie || !movie.isPublished) {
      return null
    }

    return {
      ...movie,
      genres: movie.genres || [],
      videoUrl: movie.videoUrl || '/videos/sample.m3u8',
      trailerUrl: movie.trailerUrl || null,
    }
  } catch (error) {
    console.error('Error fetching movie:', error)
    return null
  }
}

async function getRecommended(movieId: string) {
  try {
    // Get other published movies, excluding current
    const movies = await prisma.movie.findMany({
      where: {
        isPublished: true,
        id: { not: movieId },
      },
      take: 10,
      orderBy: {
        viewCount: 'desc',
      },
      include: {
        genres: true,
      },
    })

    return movies.map((movie) => ({
      id: movie.id,
      title: movie.title,
      posterUrl: movie.posterUrl,
      type: 'movie' as const,
      rating: movie.rating,
      year: new Date(movie.releaseDate).getFullYear(),
    }))
  } catch (error) {
    console.error('Error fetching recommended movies:', error)
    return []
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const movie = await getMovie(params.id)
  
  if (!movie) {
    return {
      title: 'Movie Not Found | NepVerse',
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nepverse.com'
  const url = `${baseUrl}/movie/${params.id}`
  const image = movie.backdropUrl || movie.posterUrl || `${baseUrl}/og-image.jpg`
  const year = new Date(movie.releaseDate).getFullYear()
  const description = movie.description || `Watch ${movie.title} (${year}) on NepVerse. ${movie.titleNepali || ''}`
  const genreTags = Array.isArray(movie.genres) ? movie.genres.map((g: any) => g.name || g) : []

  return generateSEOMetadata({
    title: `${movie.title}${year ? ` (${year})` : ''}`,
    description: description.substring(0, 160),
    image,
    url,
    type: 'video.movie',
    publishedTime: movie.releaseDate,
    tags: genreTags,
  })
}

export default async function MovieDetailPage({ params }: { params: { id: string } }) {
  const movie = await getMovie(params.id)
  const recommended = await getRecommended(params.id)

  if (!movie) {
    notFound()
  }
  const genres = Array.isArray(movie.genres) ? movie.genres : []

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nepverse.com'
  const structuredData = generateStructuredData({
    type: 'Movie',
    name: movie.title,
    description: movie.description || '',
    image: movie.backdropUrl || movie.posterUrl || `${baseUrl}/og-image.jpg`,
    datePublished: movie.releaseDate,
    rating: movie.rating,
    duration: `PT${movie.duration}M`,
  })

  // Sanitize JSON-LD data (JSON.stringify is safe, but validate structure)
  const jsonLdScript = JSON.stringify(structuredData)
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript }}
      />
      <div className="min-h-screen">
      {/* Hero Section with Auto-Play Preview */}
      <div className="relative h-[70vh] min-h-[500px]">
        <AutoPlayPreview
          videoUrl={movie.videoUrl}
          trailerUrl={(movie as any).trailerUrl}
          backdropUrl={movie.backdropUrl}
          posterUrl={movie.posterUrl}
          title={movie.title}
          previewDuration={12} // 12 seconds preview
        />

        <div className="relative z-10 container mx-auto px-4 lg:px-8 h-full flex items-end pb-16">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              {movie.title}
            </h1>
            {movie.titleNepali && (
              <h2 className="text-2xl md:text-3xl text-gray-300 mb-4">{movie.titleNepali}</h2>
            )}

            <div className="flex flex-wrap items-center gap-4 mb-6">
              {movie.rating && (
                <span className="px-3 py-1 bg-primary rounded-md font-semibold text-white flex items-center space-x-1">
                  <Star size={16} className="fill-white" />
                  <span>{(movie.rating > 5 ? movie.rating / 2 : movie.rating).toFixed(1)}/5</span>
                </span>
              )}
              <span className="text-white">{new Date(movie.releaseDate).getFullYear()}</span>
              <span className="text-white">{formatDuration(movie.duration * 60)}</span>
              {(movie as any).quality && (
                <span className="px-3 py-1 bg-blue-500/80 rounded-md text-white text-sm font-semibold">
                  {(movie as any).quality}
                </span>
              )}
              <span className="px-3 py-1 bg-gray-700 rounded-md text-white">{movie.ageRating}</span>
              {genres.map((genre: any) => (
                <span key={genre.name} className="text-gray-300">
                  {genre.name}
                </span>
              ))}
            </div>

            {/* Cast, Mature Themes, Tags */}
            {(movie as any).cast && (
              <div className="mb-4">
                <p className="text-gray-300 text-sm">
                  <span className="font-semibold text-white">Cast:</span> {(movie as any).cast}
                </p>
              </div>
            )}
            {(movie as any).matureThemes && (
              <div className="mb-4">
                <p className="text-gray-400 text-sm">{(movie as any).matureThemes}</p>
              </div>
            )}
            {(movie as any).tags && (
              <div className="mb-4">
                <p className="text-gray-300 text-sm">
                  <span className="font-semibold text-white">This Movie Is:</span> {(movie as any).tags}
                </p>
              </div>
            )}

            <MovieDetailClient movie={{ 
              id: movie.id, 
              title: movie.title, 
              trailerUrl: (movie as any).trailerUrl,
              rating: movie.rating,
              year: new Date(movie.releaseDate).getFullYear(),
              description: movie.description
            }} />

            <p className="text-lg text-gray-200 mb-4">{movie.description}</p>
            {movie.descriptionNepali && (
              <p className="text-lg text-gray-300">{movie.descriptionNepali}</p>
            )}
          </div>
        </div>
      </div>

      {/* Recommended */}
      {recommended.length > 0 && (
        <div className="py-8">
          <ContentCarousel title="More Like This" items={recommended} />
        </div>
      )}

      {/* Reviews */}
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <ReviewSection contentId={movie.id} contentType="movie" />
      </div>

      {/* Comments */}
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <CommentsSection contentId={movie.id} contentType="movie" />
      </div>
    </div>
    </>
  )
}

