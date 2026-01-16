import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Play, Plus, Share2, Heart, Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ContentCarousel } from '@/components/content/ContentCarousel'
import { ReviewSection } from '@/components/content/ReviewSection'
import { CommentsSection } from '@/components/content/CommentsSection'
import { formatDate, formatDuration, getImageUrl } from '@/lib/utils'
import { MovieDetailClient } from './MovieDetailClient'
import { MovieDetailHero } from './MovieDetailHero'
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
        rating: movie.rating ?? undefined,
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
    publishedTime: movie.releaseDate instanceof Date ? movie.releaseDate.toISOString() : (typeof movie.releaseDate === 'string' ? movie.releaseDate : new Date(movie.releaseDate).toISOString()),
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
    datePublished: movie.releaseDate instanceof Date ? movie.releaseDate.toISOString() : (typeof movie.releaseDate === 'string' ? movie.releaseDate : new Date(movie.releaseDate).toISOString()),
    rating: movie.rating ?? undefined,
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
      {/* Hero Section with Animated Background */}
      <MovieDetailHero
        videoUrl={movie.videoUrl}
        trailerUrl={(movie as any).trailerUrl}
        backdropUrl={getImageUrl(movie.backdropUrl || '')}
        posterUrl={getImageUrl(movie.posterUrl)}
        title={movie.title}
        previewDuration={12}
      >
        <div className="container mx-auto px-4 lg:px-8 h-full flex items-center pb-8 md:pb-16 pt-16 md:pt-32 lg:pt-40">
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 items-center">
            {/* Poster - Left Side */}
            <div className="lg:col-span-3 flex justify-center lg:justify-start">
              <div className="relative w-40 sm:w-48 md:w-56 lg:w-72 aspect-[2/3] rounded-lg overflow-hidden shadow-2xl border-2 border-white/20">
                {(() => {
                  const displayPosterUrl = getImageUrl(movie.posterUrl)
                  return (displayPosterUrl?.includes('r2.cloudflarestorage.com') || displayPosterUrl?.includes('/api/storage/proxy')) ? (
                    <img
                      src={displayPosterUrl}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <Image
                      src={displayPosterUrl}
                      alt={movie.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 224px, (max-width: 1024px) 256px, 288px"
                      priority
                    />
                  )
                })()}
              </div>
            </div>

            {/* Content - Right Side */}
            <div className="lg:col-span-9">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-3 drop-shadow-lg">
                {movie.title}
              </h1>
              {movie.titleNepali && (
                <h2 className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-2 md:mb-3 drop-shadow-lg">{movie.titleNepali}</h2>
              )}

              <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-5">
                {movie.rating && (
                  <span className="px-3 py-1 bg-primary rounded-md font-semibold text-white flex items-center space-x-1 text-sm">
                    <Star size={14} className="fill-white" />
                    <span>{(movie.rating > 5 ? movie.rating / 2 : movie.rating).toFixed(1)}/5</span>
                  </span>
                )}
                <span className="text-white drop-shadow-lg text-sm">{new Date(movie.releaseDate).getFullYear()}</span>
                <span className="text-white drop-shadow-lg text-sm">{formatDuration(movie.duration * 60)}</span>
                {(movie as any).quality && (
                  <span className="px-3 py-1 bg-blue-500/80 rounded-md text-white text-xs font-semibold">
                    {(movie as any).quality}
                  </span>
                )}
                <span className="px-3 py-1 bg-gray-700 rounded-md text-white text-xs">{movie.ageRating}</span>
                {genres.map((genre: any) => (
                  <span key={genre.name} className="text-gray-300 drop-shadow-lg text-sm">
                    {genre.name}
                  </span>
                ))}
              </div>

              {/* Cast, Mature Themes, Tags */}
              {(movie as any).cast && (
                <div className="mb-2 md:mb-3">
                  <p className="text-gray-300 text-xs sm:text-sm drop-shadow-lg leading-relaxed">
                    <span className="font-semibold text-white">Cast:</span> {(movie as any).cast}
                  </p>
                </div>
              )}
              {(movie as any).matureThemes && (
                <div className="mb-2 md:mb-3">
                  <p className="text-gray-400 text-xs sm:text-sm drop-shadow-lg leading-relaxed">{(movie as any).matureThemes}</p>
                </div>
              )}
              {(movie as any).tags && (
                <div className="mb-2 md:mb-3">
                  <p className="text-gray-300 text-xs sm:text-sm drop-shadow-lg leading-relaxed">
                    <span className="font-semibold text-white">This Movie Is:</span> {(movie as any).tags}
                  </p>
                </div>
              )}

              <div className="mb-3 md:mb-4">
                <MovieDetailClient movie={{ 
                  id: movie.id, 
                  title: movie.title, 
                  trailerUrl: (movie as any).trailerUrl,
                  rating: movie.rating ?? undefined,
                  year: new Date(movie.releaseDate).getFullYear(),
                  description: movie.description
                }} />
              </div>

              <p className="text-sm sm:text-base text-gray-200 mb-2 md:mb-3 drop-shadow-lg leading-relaxed">{movie.description}</p>
              {movie.descriptionNepali && (
                <p className="text-sm sm:text-base text-gray-300 drop-shadow-lg leading-relaxed">{movie.descriptionNepali}</p>
              )}
            </div>
          </div>
        </div>
      </MovieDetailHero>

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

