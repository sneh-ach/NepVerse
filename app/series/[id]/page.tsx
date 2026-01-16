import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Play, Star } from 'lucide-react'
import { ContentCarousel } from '@/components/content/ContentCarousel'
import { ReviewSection } from '@/components/content/ReviewSection'
import { CommentsSection } from '@/components/content/CommentsSection'
import { formatDate, getImageUrl } from '@/lib/utils'
import { SeriesDetailClient } from './SeriesDetailClient'
import { AutoPlayPreview } from '@/components/content/AutoPlayPreview'
import { generateMetadata as generateSEOMetadata, generateStructuredData } from '@/lib/seo'
import { prisma } from '@/lib/prisma'

async function getSeries(id: string) {
  try {
    const series = await prisma.series.findUnique({
      where: { id },
      include: {
        genres: true,
        episodes: {
          where: { isPublished: true },
          orderBy: { episodeNumber: 'asc' },
        },
      },
    })

    if (!series || !series.isPublished) {
      return null
    }

    return {
      ...series,
      genres: series.genres || [],
      episodes: series.episodes || [],
      videoUrl: (series as any).videoUrl || null,
      trailerUrl: (series as any).trailerUrl || null,
    }
  } catch (error) {
    console.error('Error fetching series:', error)
    return null
  }
}

async function getRecommended(seriesId: string) {
  try {
    // Get other published series and movies
    const [otherSeries, relatedMovies] = await Promise.all([
      prisma.series.findMany({
        where: {
          isPublished: true,
          id: { not: seriesId },
        },
        take: 5,
        orderBy: { viewCount: 'desc' },
        include: { genres: true },
      }),
      prisma.movie.findMany({
        where: { isPublished: true },
        take: 5,
        orderBy: { viewCount: 'desc' },
        include: { genres: true },
      }),
    ])

    return [
      ...otherSeries.map((series) => ({
        id: series.id,
        title: series.title,
        posterUrl: series.posterUrl,
        type: 'series' as const,
        rating: series.rating ?? undefined,
        year: new Date(series.releaseDate).getFullYear(),
      })),
      ...relatedMovies.map((movie) => ({
        id: movie.id,
        title: movie.title,
        posterUrl: movie.posterUrl,
        type: 'movie' as const,
        rating: movie.rating ?? undefined,
        year: new Date(movie.releaseDate).getFullYear(),
      })),
    ]
  } catch (error) {
    console.error('Error fetching recommended:', error)
    return []
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const series = await getSeries(params.id)
  
  if (!series) {
    return {
      title: 'Series Not Found | NepVerse',
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nepverse.com'
  const url = `${baseUrl}/series/${params.id}`
  const image = series.backdropUrl || series.posterUrl || `${baseUrl}/og-image.jpg`
  const year = new Date(series.releaseDate).getFullYear()
  const description = series.description || `Watch ${series.title} (${year}) on NepVerse. ${series.titleNepali || ''}`
  const genreTags = Array.isArray(series.genres) ? series.genres.map((g: any) => g.name || g) : []

  return generateSEOMetadata({
    title: `${series.title}${year ? ` (${year})` : ''}`,
    description: description.substring(0, 160),
    image,
    url,
    type: 'video.tv_show',
    publishedTime: series.releaseDate instanceof Date ? series.releaseDate.toISOString() : (typeof series.releaseDate === 'string' ? series.releaseDate : new Date(series.releaseDate).toISOString()),
    tags: genreTags,
  })
}

export default async function SeriesDetailPage({ params }: { params: { id: string } }) {
  const series = await getSeries(params.id)
  const recommended = await getRecommended(params.id)

  if (!series) {
    notFound()
  }
  const genres = Array.isArray(series.genres) ? series.genres : []
  const episodes = Array.isArray(series.episodes) ? series.episodes : []

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nepverse.com'
  const structuredData = generateStructuredData({
    type: 'TVSeries',
    name: series.title,
    description: series.description || '',
    image: series.backdropUrl || series.posterUrl || `${baseUrl}/og-image.jpg`,
    datePublished: series.releaseDate instanceof Date ? series.releaseDate.toISOString() : (typeof series.releaseDate === 'string' ? series.releaseDate : new Date(series.releaseDate).toISOString()),
    rating: series.rating ?? undefined,
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
      <div className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] min-h-[400px] sm:min-h-[450px] md:min-h-[500px]">
        <AutoPlayPreview
          videoUrl={series.videoUrl}
          trailerUrl={series.trailerUrl}
          backdropUrl={getImageUrl(series.backdropUrl || '')}
          posterUrl={getImageUrl(series.posterUrl)}
          title={series.title}
          previewDuration={12} // 12 seconds preview
        />

        <div className="relative z-10 container mx-auto px-4 lg:px-8 h-full flex items-end pb-8 md:pb-16">
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 items-end">
            {/* Poster - Left Side */}
            <div className="lg:col-span-3 flex justify-center lg:justify-start">
              <div className="relative w-40 sm:w-48 md:w-56 lg:w-64 aspect-[2/3] rounded-lg overflow-hidden shadow-2xl border-2 border-white/20">
                {(() => {
                  const displayPosterUrl = getImageUrl(series.posterUrl)
                  return (displayPosterUrl?.includes('r2.cloudflarestorage.com') || displayPosterUrl?.includes('/api/storage/proxy')) ? (
                    <img
                      src={displayPosterUrl}
                      alt={series.title}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <Image
                      src={displayPosterUrl}
                      alt={series.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 192px, (max-width: 1024px) 224px, 256px"
                      priority
                    />
                  )
                })()}
              </div>
            </div>

            {/* Content - Right Side */}
            <div className="lg:col-span-9">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-4 drop-shadow-lg">
                {series.title}
              </h1>
              {series.titleNepali && (
                <h2 className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-2 md:mb-4 drop-shadow-lg">{series.titleNepali}</h2>
              )}

              <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-4 md:mb-6">
                {series.rating && (
                  <span className="px-3 py-1 bg-primary rounded-md font-semibold text-white flex items-center space-x-1">
                    <Star size={16} className="fill-white" />
                    <span>{(series.rating > 5 ? series.rating / 2 : series.rating).toFixed(1)}/5</span>
                  </span>
                )}
                <span className="text-white drop-shadow-lg">{new Date(series.releaseDate).getFullYear()}</span>
                {series.episodes && Array.isArray(series.episodes) && (
                  <span className="text-white drop-shadow-lg">{series.episodes.length} Episodes</span>
                )}
                {(series as any).quality && (
                  <span className="px-3 py-1 bg-blue-500/80 rounded-md text-white text-sm font-semibold">
                    {(series as any).quality}
                  </span>
                )}
                <span className="px-3 py-1 bg-gray-700 rounded-md text-white">{series.ageRating}</span>
                {genres.map((genre: any) => (
                  <span key={genre.name} className="text-gray-300 drop-shadow-lg">
                    {genre.name}
                  </span>
                ))}
              </div>

              {/* Cast, Mature Themes, Tags */}
              {(series as any).cast && (
                <div className="mb-4">
                  <p className="text-gray-300 text-sm drop-shadow-lg">
                    <span className="font-semibold text-white">Cast:</span> {(series as any).cast}
                  </p>
                </div>
              )}
              {(series as any).matureThemes && (
                <div className="mb-4">
                  <p className="text-gray-400 text-sm drop-shadow-lg">{(series as any).matureThemes}</p>
                </div>
              )}
              {(series as any).tags && (
                <div className="mb-4">
                  <p className="text-gray-300 text-sm drop-shadow-lg">
                    <span className="font-semibold text-white">This Series Is:</span> {(series as any).tags}
                  </p>
                </div>
              )}

              <SeriesDetailClient series={{ 
                id: series.id, 
                title: series.title, 
                trailerUrl: (series as any).trailerUrl, 
                episodes: series.episodes,
                rating: series.rating ?? undefined,
                year: new Date(series.releaseDate).getFullYear(),
                description: series.description
              }} />

              <p className="text-lg text-gray-200 mb-4 drop-shadow-lg">{series.description}</p>
              {series.descriptionNepali && (
                <p className="text-lg text-gray-300 drop-shadow-lg">{series.descriptionNepali}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Episodes */}
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-white mb-6">Episodes</h2>
        <div className="space-y-4">
          {episodes.map((episode: any) => (
            <Link
              key={episode.id}
              href={`/watch/series/${series.id}/episode/${episode.id}`}
              className="flex items-center space-x-4 p-4 bg-card rounded-lg hover:bg-card-hover transition-colors group"
            >
              <div className="relative w-32 h-20 flex-shrink-0 rounded overflow-hidden bg-gray-800">
                <Image
                  src={episode.thumbnailUrl || series.posterUrl}
                  alt={episode.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play size={24} className="text-white" fill="currentColor" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-2">
                  <span className="text-gray-400 font-semibold">Episode {episode.episodeNumber}</span>
                  <span className="text-gray-500">{episode.duration} min</span>
                </div>
                <h3 className="text-white font-semibold text-lg mb-1">{episode.title}</h3>
                {episode.titleNepali && (
                  <p className="text-gray-400 mb-2">{episode.titleNepali}</p>
                )}
                <p className="text-gray-500 text-sm">{episode.description}</p>
              </div>
            </Link>
          ))}
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
        <ReviewSection contentId={series.id} contentType="series" />
      </div>

      {/* Comments */}
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <CommentsSection contentId={series.id} contentType="series" />
      </div>
    </div>
    </>
  )
}

