'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { profileStorage } from '@/lib/localStorage'
import { HeroCarousel } from '@/components/content/HeroCarousel'
import { ContentCarousel } from '@/components/content/ContentCarousel'
import { ContentGrid } from '@/components/content/ContentGrid'
import { watchHistoryService } from '@/lib/clientStorage'

async function getFeaturedContent() {
  try {
    // Use relative URLs for API calls (works in both dev and production)
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    
    console.log('Fetching content from:', baseUrl)
    
    // Fetch real data from database
    const [moviesRes, seriesRes] = await Promise.all([
      fetch(`${baseUrl}/api/content/movies?featured=true&limit=10`).catch(err => {
        console.error('Error fetching featured movies:', err)
        return { ok: false, status: 500, json: async () => ({ error: err.message }) }
      }),
      fetch(`${baseUrl}/api/content/series?featured=true&limit=10`).catch(err => {
        console.error('Error fetching featured series:', err)
        return { ok: false, status: 500, json: async () => ({ error: err.message }) }
      }),
    ])

    // Log response status for debugging
    if (!moviesRes.ok) {
      const errorData = await moviesRes.json().catch(() => ({}))
      console.error('Movies API error:', moviesRes.status, errorData)
    }
    if (!seriesRes.ok) {
      const errorData = await seriesRes.json().catch(() => ({}))
      console.error('Series API error:', seriesRes.status, errorData)
    }

    const movies = moviesRes.ok ? await moviesRes.json() : []
    const series = seriesRes.ok ? await seriesRes.json() : []
    
    console.log('Fetched featured movies:', movies.length, 'featured series:', series.length)
    if (movies.length > 0) console.log('Sample movie:', movies[0]?.title)
    if (series.length > 0) console.log('Sample series:', series[0]?.title)

    // Get all published content for other sections
    const [allMoviesRes, allSeriesRes] = await Promise.all([
      fetch(`${baseUrl}/api/content/movies?limit=50`).catch(err => {
        console.error('Error fetching all movies:', err)
        return { ok: false, status: 500, json: async () => ({ error: err.message }) }
      }),
      fetch(`${baseUrl}/api/content/series?limit=50`).catch(err => {
        console.error('Error fetching all series:', err)
        return { ok: false, status: 500, json: async () => ({ error: err.message }) }
      }),
    ])

    // Log response status for debugging
    if (!allMoviesRes.ok) {
      const errorData = await allMoviesRes.json().catch(() => ({}))
      console.error('All Movies API error:', allMoviesRes.status, errorData)
    }
    if (!allSeriesRes.ok) {
      const errorData = await allSeriesRes.json().catch(() => ({}))
      console.error('All Series API error:', allSeriesRes.status, errorData)
    }

    const allMovies = allMoviesRes.ok ? await allMoviesRes.json() : []
    const allSeries = allSeriesRes.ok ? await allSeriesRes.json() : []
    
    console.log('All published movies:', allMovies.length, 'All published series:', allSeries.length)
    
    // Log if no content is published
    if (allMovies.length === 0 && allSeries.length === 0) {
      console.warn('⚠️ No published content found in database. Make sure content is marked as "Published" in the admin panel.')
    }

    // Get up to 3 random movies for hero carousel (or however many are available, minimum 1)
    const allContent = [...allMovies, ...allSeries].filter((item: any) => item && item.id && item.backdropUrl)
    
    // Shuffle and get up to 3 random items (or all available if less than 3, but at least 1 if available)
    const shuffled = [...allContent].sort(() => Math.random() - 0.5)
    const maxItems = Math.min(3, Math.max(1, shuffled.length))
    const featuredItems = shuffled.slice(0, maxItems).map((item: any) => ({
      id: item.id,
      title: item.title || 'Untitled',
      description: item.description || '',
      backdropUrl: item.backdropUrl || '',
      posterUrl: item.posterUrl || '',
      contentType: ('episodeCount' in item || item.episodes) ? ('series' as const) : ('movie' as const),
      rating: item.rating ?? undefined,
      year: item.releaseDate ? new Date(item.releaseDate).getFullYear() : undefined,
    }))
    
    console.log('Featured carousel items:', featuredItems.length)

    // Trending Now (most viewed in last 7 days - using viewCount as proxy, can be enhanced with actual date tracking)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const trending = [...allMovies, ...allSeries]
      .filter((item: any) => item && item.id) // Filter out any invalid items
      .sort((a: any, b: any) => {
        // Prioritize items with higher viewCount and recent updates
        const aScore = (a.viewCount || 0) + (new Date(a.updatedAt || a.createdAt) > sevenDaysAgo ? 10 : 0)
        const bScore = (b.viewCount || 0) + (new Date(b.updatedAt || b.createdAt) > sevenDaysAgo ? 10 : 0)
        return bScore - aScore
      })
      .slice(0, 10)
      .map((item: any) => ({
        id: item.id,
        title: item.title || 'Untitled',
        titleNepali: item.titleNepali,
        description: item.description || '',
        descriptionNepali: item.descriptionNepali,
        posterUrl: item.posterUrl || '',
        backdropUrl: item.backdropUrl,
        videoUrl: item.videoUrl,
        trailerUrl: item.trailerUrl,
        rating: item.rating ?? undefined,
        year: item.releaseDate ? new Date(item.releaseDate).getFullYear() : undefined,
        duration: item.duration,
        quality: item.quality,
        ageRating: item.ageRating,
        cast: item.cast,
        matureThemes: item.matureThemes,
        tags: item.tags,
        genres: Array.isArray(item.genres) ? item.genres : [],
        type: (item.episodes && Array.isArray(item.episodes)) || 'episodeCount' in item ? ('series' as const) : ('movie' as const),
      }))

    // Originals (featured series, or all series if no featured)
    const featuredSeries = series.filter((s: any) => s && s.isFeatured)
    const seriesToUse = featuredSeries.length > 0 ? featuredSeries : series.filter((s: any) => s && s.id)
    const originals = seriesToUse
      .slice(0, 10)
      .map((item: any) => ({
        id: item.id,
        title: item.title || 'Untitled',
        titleNepali: item.titleNepali,
        description: item.description || '',
        descriptionNepali: item.descriptionNepali,
        posterUrl: item.posterUrl || '',
        backdropUrl: item.backdropUrl,
        videoUrl: item.videoUrl,
        trailerUrl: item.trailerUrl,
        rating: item.rating ?? undefined,
        year: item.releaseDate ? new Date(item.releaseDate).getFullYear() : undefined,
        quality: item.quality,
        ageRating: item.ageRating,
        cast: item.cast,
        matureThemes: item.matureThemes,
        tags: item.tags,
        genres: Array.isArray(item.genres) ? item.genres : [],
        type: 'series' as const,
      }))

    // Recently Added (sorted by createdAt - when added to platform)
    const recentlyAdded = [...allMovies, ...allSeries]
      .sort((a: any, b: any) => new Date(b.createdAt || b.releaseDate).getTime() - new Date(a.createdAt || a.releaseDate).getTime())
      .slice(0, 10)
      .map((item: any) => ({
        id: item.id,
        title: item.title || 'Untitled',
        titleNepali: item.titleNepali,
        description: item.description || '',
        descriptionNepali: item.descriptionNepali,
        posterUrl: item.posterUrl || '',
        backdropUrl: item.backdropUrl,
        videoUrl: item.videoUrl,
        trailerUrl: item.trailerUrl,
        rating: item.rating ?? undefined,
        year: item.releaseDate ? new Date(item.releaseDate).getFullYear() : undefined,
        duration: item.duration,
        quality: item.quality,
        ageRating: item.ageRating,
        cast: item.cast,
        matureThemes: item.matureThemes,
        tags: item.tags,
        genres: Array.isArray(item.genres) ? item.genres : [],
        type: (item.episodes && Array.isArray(item.episodes)) || 'episodeCount' in item ? ('series' as const) : ('movie' as const),
      }))

    // New releases (sorted by release date)
    const newReleases = [...allMovies, ...allSeries]
      .sort((a: any, b: any) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
      .slice(0, 10)
      .map((item: any) => ({
        id: item.id,
        title: item.title,
        titleNepali: item.titleNepali,
        description: item.description,
        descriptionNepali: item.descriptionNepali,
        posterUrl: item.posterUrl,
        backdropUrl: item.backdropUrl,
        videoUrl: item.videoUrl,
        trailerUrl: item.trailerUrl,
        rating: item.rating,
        year: new Date(item.releaseDate).getFullYear(),
        duration: item.duration,
        quality: item.quality,
        ageRating: item.ageRating,
        cast: item.cast,
        matureThemes: item.matureThemes,
        tags: item.tags,
        genres: item.genres || [],
        type: 'episodeCount' in item || item.episodes ? ('series' as const) : ('movie' as const),
      }))

    // Genre-based sections
    const drama = [...allMovies, ...allSeries]
      .filter((item: any) => item.genres?.some((g: any) => g.name?.toLowerCase().includes('drama')))
      .slice(0, 10)
      .map((item: any) => ({
        id: item.id,
        title: item.title,
        titleNepali: item.titleNepali,
        description: item.description,
        descriptionNepali: item.descriptionNepali,
        posterUrl: item.posterUrl,
        backdropUrl: item.backdropUrl,
        videoUrl: item.videoUrl,
        trailerUrl: item.trailerUrl,
        rating: item.rating,
        year: new Date(item.releaseDate).getFullYear(),
        duration: item.duration,
        quality: item.quality,
        ageRating: item.ageRating,
        cast: item.cast,
        matureThemes: item.matureThemes,
        tags: item.tags,
        genres: item.genres || [],
        type: 'episodeCount' in item || item.episodes ? ('series' as const) : ('movie' as const),
      }))

    const comedy = [...allMovies, ...allSeries]
      .filter((item: any) => item.genres?.some((g: any) => g.name?.toLowerCase().includes('comedy')))
      .slice(0, 10)
      .map((item: any) => ({
        id: item.id,
        title: item.title,
        titleNepali: item.titleNepali,
        description: item.description,
        descriptionNepali: item.descriptionNepali,
        posterUrl: item.posterUrl,
        backdropUrl: item.backdropUrl,
        videoUrl: item.videoUrl,
        trailerUrl: item.trailerUrl,
        rating: item.rating,
        year: new Date(item.releaseDate).getFullYear(),
        duration: item.duration,
        quality: item.quality,
        ageRating: item.ageRating,
        cast: item.cast,
        matureThemes: item.matureThemes,
        tags: item.tags,
        genres: item.genres || [],
        type: 'episodeCount' in item || item.episodes ? ('series' as const) : ('movie' as const),
      }))

    const thriller = [...allMovies, ...allSeries]
      .filter((item: any) => item.genres?.some((g: any) => g.name?.toLowerCase().includes('thriller')))
      .slice(0, 10)
      .map((item: any) => ({
        id: item.id,
        title: item.title,
        titleNepali: item.titleNepali,
        description: item.description,
        descriptionNepali: item.descriptionNepali,
        posterUrl: item.posterUrl,
        backdropUrl: item.backdropUrl,
        videoUrl: item.videoUrl,
        trailerUrl: item.trailerUrl,
        rating: item.rating,
        year: new Date(item.releaseDate).getFullYear(),
        duration: item.duration,
        quality: item.quality,
        ageRating: item.ageRating,
        cast: item.cast,
        matureThemes: item.matureThemes,
        tags: item.tags,
        genres: item.genres || [],
        type: 'episodeCount' in item || item.episodes ? ('series' as const) : ('movie' as const),
      }))

    return {
      featured: featuredItems,
      trending,
      originals,
      recentlyAdded,
      newReleases,
      drama,
      comedy,
      thriller,
    }
  } catch (error) {
    console.error('Error fetching content:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
      // Return empty data on error
    return {
      featured: [],
      trending: [],
      originals: [],
      recentlyAdded: [],
      newReleases: [],
      drama: [],
      comedy: [],
      thriller: [],
    }
  }
}

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [continueWatching, setContinueWatching] = useState<any[]>([])
  const [content, setContent] = useState<any>({
    featured: [],
    trending: [],
    originals: [],
    recentlyAdded: [],
    newReleases: [],
    drama: [],
    comedy: [],
    thriller: [],
  })
  const [contentLoading, setContentLoading] = useState(true)

  // Load content from database (memoized to prevent unnecessary re-fetches)
  const loadContent = useCallback(async () => {
    try {
      setContentLoading(true)
      const data = await getFeaturedContent()
      setContent(data)
    } catch (error) {
      console.error('Failed to load content:', error)
      // Set empty content on error
      setContent({
        featured: null,
        trending: [],
        originals: [],
        recentlyAdded: [],
        newReleases: [],
        drama: [],
        comedy: [],
        thriller: [],
      })
    } finally {
      setContentLoading(false)
    }
  }, [])

  useEffect(() => {
    loadContent()
  }, [loadContent])

  // Load continue watching (memoized and optimized)
  const loadContinueWatching = useCallback(async () => {
    if (!user || loading) return
    
    try {
      const history = await watchHistoryService.getAll()
      // Filter out completed items and sort by last watched
      const inProgress = (Array.isArray(history) ? history : [])
        .filter((item: any) => {
          // Only show items that are not completed and have some progress
          return !item.completed && item.progress > 0 && (item.movieId || item.seriesId)
        })
        .sort((a: any, b: any) => {
          // Sort by last watched date (most recent first)
          const dateA = new Date(a.lastWatchedAt || a.updatedAt || a.createdAt || 0).getTime()
          const dateB = new Date(b.lastWatchedAt || b.updatedAt || b.createdAt || 0).getTime()
          return dateB - dateA
        })
        .slice(0, 10)
      
      // Batch fetch all content in parallel
      const contentPromises = inProgress.map(async (item: any) => {
        let movie = null
        let series = null
        
        if (item.movieId) {
          try {
            const res = await fetch(`/api/content/movie/${item.movieId}`, {
              headers: { 'Cache-Control': 'max-age=300' },
            })
            if (res.ok) movie = await res.json()
          } catch (e) {
            // Ignore errors
          }
        }
        
        if (item.seriesId) {
          try {
            const res = await fetch(`/api/content/series/${item.seriesId}`, {
              headers: { 'Cache-Control': 'max-age=300' },
            })
            if (res.ok) series = await res.json()
          } catch (e) {
            // Ignore errors
            }
        }
        
        return {
          id: item.movieId || item.seriesId,
          title: movie?.title || series?.title || item.movieId || item.seriesId || 'Unknown',
          titleNepali: movie?.titleNepali || series?.titleNepali,
          description: movie?.description || series?.description,
          descriptionNepali: movie?.descriptionNepali || series?.descriptionNepali,
          posterUrl: movie?.posterUrl || series?.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500',
          backdropUrl: movie?.backdropUrl || series?.backdropUrl,
          videoUrl: movie?.videoUrl || series?.videoUrl,
          trailerUrl: movie?.trailerUrl || series?.trailerUrl,
          rating: movie?.rating || series?.rating,
          year: movie?.releaseDate ? new Date(movie.releaseDate).getFullYear() : (series?.releaseDate ? new Date(series.releaseDate).getFullYear() : undefined),
          duration: movie?.duration,
          quality: movie?.quality || series?.quality,
          ageRating: movie?.ageRating || series?.ageRating,
          cast: movie?.cast || series?.cast,
          matureThemes: movie?.matureThemes || series?.matureThemes,
          tags: movie?.tags || series?.tags,
          genres: movie?.genres || series?.genres || [],
          type: item.movieId ? 'movie' : 'series',
          progress: item.progress || 0,
        }
      })
      
      const resolved = await Promise.all(contentPromises)
      setContinueWatching(resolved.filter((item: any) => item && item.id))
    } catch (error) {
      console.error('Failed to load continue watching:', error)
      setContinueWatching([])
    }
  }, [user, loading])

  useEffect(() => {
    loadContinueWatching()
    
    // Refresh every 60 seconds to show new watch history
    const interval = setInterval(loadContinueWatching, 60000)
    return () => clearInterval(interval)
  }, [loadContinueWatching])

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return
    
    if (!loading && user) {
      // Check profile from API
      const checkProfile = async () => {
        try {
          const response = await fetch('/api/profiles/current', {
            credentials: 'include',
          })
          if (response.ok) {
            const profile = await response.json()
            if (!profile) {
              router.push('/profiles')
              return
            }
          } else {
            // Fallback to localStorage
            try {
              const currentProfile = profileStorage.getCurrentProfile(user.id)
              if (!currentProfile) {
                router.push('/profiles')
                return
              }
            } catch (error) {
              console.error('Error checking profile:', error)
            }
          }
        } catch (error) {
          // Fallback to localStorage
          try {
            const currentProfile = profileStorage.getCurrentProfile(user.id)
            if (!currentProfile) {
              router.push('/profiles')
              return
            }
          } catch (fallbackError) {
            console.error('Error checking profile:', fallbackError)
          }
        }
      }
      checkProfile()
    }
  }, [user, loading, router])

  if (loading || contentLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Carousel */}
      {content.featured && content.featured.length > 0 && (
        <HeroCarousel items={content.featured} autoPlayInterval={12000} />
      )}

      {/* Content Carousels - ALL NEPALI CONTENT */}
      <div className="py-8 space-y-8">
        {/* Continue Watching - Enhanced with progress bars */}
        {continueWatching.length > 0 && (
          <ContentCarousel 
            title="Continue Watching" 
            items={continueWatching} 
            showLoading={false}
            alwaysShow={true}
            emptyMessage="Start watching movies or series to see your progress here."
          />
        )}
        {/* Recently Added Section */}
        {content.recentlyAdded.length > 0 && (
          <ContentCarousel 
            title="Recently Added" 
            items={content.recentlyAdded} 
            showLoading={false}
          />
        )}

        {/* Trending Now Section */}
        {content.trending.length > 0 && (
          <ContentCarousel 
            title="🔥 Trending Now" 
            items={content.trending} 
            showLoading={false}
          />
        )}
        
        {content.trending.length > 0 && (
          <ContentGrid 
            title="Popular Nepali Movies" 
            items={content.trending} 
            showLoading={false}
            rows={3}
            columns={{ mobile: 2, tablet: 3, desktop: 4 }}
          />
        )}
        {/* {content.originals.length > 0 && (
          <ContentCarousel 
            title="Nepali Originals" 
            items={content.originals} 
            showLoading={false}
          />
        )} */}
        {/* {content.newReleases.length > 0 && (
          <ContentCarousel 
            title="New Nepali Releases" 
            items={content.newReleases} 
            showLoading={false}
          />
        )} */}
        {/* {content.trending.length > 0 && (
          <ContentCarousel 
            title="Trending Now" 
            items={content.trending.slice(0, 10)} 
            showLoading={false}
          />
        )} */}
        {/* {content.drama.length > 0 && (
          <ContentCarousel 
            title="Nepali Drama & Romance" 
            items={content.drama} 
            showLoading={false}
          />
        )} */}
        {/* {content.comedy.length > 0 && (
          <ContentCarousel 
            title="Nepali Comedy" 
            items={content.comedy} 
            showLoading={false}
          />
        )} */}
        {/* {content.thriller.length > 0 && (
          <ContentCarousel 
            title="Nepali Thriller & Suspense" 
            items={content.thriller} 
            showLoading={false}
          />
        )} */}
        {/* {content.newReleases.length > 0 && (
          <ContentCarousel 
            title="Recently Added" 
            items={content.newReleases.slice(0, 10)} 
            showLoading={false}
          />
        )} */}
        
        {/* Show message if no content at all */}
        {!contentLoading && 
         (!content.featured || content.featured.length === 0) &&
         content.trending.length === 0 && 
         content.originals.length === 0 && 
         content.newReleases.length === 0 && 
         content.drama.length === 0 && 
         content.comedy.length === 0 && 
         content.thriller.length === 0 && (
          <div className="px-4 lg:px-8 py-12 text-center">
            <div className="bg-card/50 rounded-lg p-8 border border-gray-800 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-white mb-4">No Content Available</h3>
              <p className="text-gray-400 mb-6">
                There's no content in the database yet. Add movies and series through the admin panel to see them here.
              </p>
              {user && (user as any).role === 'ADMIN' && (
                <a 
                  href="/admin/content" 
                  className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                >
                  Go to Admin Panel
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

