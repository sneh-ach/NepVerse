'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { VideoPlayer } from '@/components/player/VideoPlayer'
import { ContentCarousel } from '@/components/content/ContentCarousel'
import { useAuth } from '@/hooks/useAuth'
import { profileStorage, UserProfile } from '@/lib/localStorage'
import { watchHistoryService } from '@/lib/clientStorage'
// Removed mock data - using real API

interface Movie {
  id: string
  title: string
  description?: string
  posterUrl: string
  videoUrl?: string
  videoUrl360p?: string
  videoUrl720p?: string
  videoUrl1080p?: string
  subtitleUrlNepali?: string
  subtitleUrlEnglish?: string
  duration: number
}

interface RecommendedItem {
  id: string
  title: string
  posterUrl: string
  type: 'movie' | 'series'
}

export default function MoviePlayerPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [movie, setMovie] = useState<Movie | null>(null)
  const [recommended, setRecommended] = useState<RecommendedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [initialTime, setInitialTime] = useState<number | null>(null)
  const hasRedirectedRef = useRef(false)

  // Define callbacks at the top level (before any conditional returns)
  const handleTimeUpdate = useCallback(async (time: number, duration: number) => {
    try {
      const progress = (time / duration) * 100
      // Only save if we have meaningful progress (more than 1 second)
      if (time > 1 && duration > 0) {
        console.log('📺 Saving watch progress:', {
          time: time.toFixed(1),
          duration: duration.toFixed(1),
          progress: progress.toFixed(1) + '%'
        })
        await watchHistoryService.add({
          movieId: params.id as string,
          progress,
          currentTime: time,
          duration,
          completed: false,
        })
      }
    } catch (error) {
      // Silently fail - watch history is not critical for playback
      console.warn('Failed to update watch history:', error)
    }
  }, [params.id])

  const handleEnded = useCallback(async () => {
    try {
      if (!movie) {
        console.error('Movie not found for onEnded:', params.id)
        return
      }
      await watchHistoryService.add({
        movieId: params.id as string,
        progress: 100,
        currentTime: movie.duration * 60,
        duration: movie.duration * 60,
        completed: true,
      })
    } catch (error) {
      console.warn('Failed to mark movie as completed:', error)
    }
  }, [params.id])

  useEffect(() => {
    let cancelled = false

    const loadMovie = async () => {
      // If we already have a movie loaded, don't run again
      if (movie) {
        return
      }

      // Wait for auth to finish loading
      if (authLoading) {
        return
      }

      if (!user) {
        if (!hasRedirectedRef.current) {
          hasRedirectedRef.current = true
          router.push(`/login?redirect=/watch/movie/${params.id}`)
        }
        return
      }

      // Try to get profile for watch history, but don't block if it doesn't exist
      // Users would have already selected a profile when opening the website
      try {
        // Check if profile is selected - prioritize localStorage
        let currentProfile = profileStorage.getCurrentProfile(user.id)
        
        // If no profile in localStorage, try API (non-blocking)
        if (!currentProfile) {
          try {
            const profileResponse = await fetch('/api/profiles/current', {
              credentials: 'include',
            })
            if (profileResponse.ok) {
              const profileData = await profileResponse.json()
              if (profileData && profileData.id) {
                // Profile exists in API, get it from localStorage or create reference
                const allProfiles = profileStorage.getByUser(user.id)
                const foundProfile = allProfiles.find(p => p.id === profileData.id)
                if (foundProfile) {
                  profileStorage.setCurrentProfile(foundProfile, user.id)
                  currentProfile = foundProfile
                } else {
                  // Profile exists in API but not in localStorage - create a reference
                  const profileRef: UserProfile = {
                    id: profileData.id,
                    userId: user.id,
                    name: profileData.name || 'Profile',
                    avatar: profileData.avatar || '👤',
                    avatarType: profileData.avatarType || 'default',
                    isKidsProfile: profileData.isKidsProfile || false,
                    createdAt: profileData.createdAt || new Date().toISOString(),
                    updatedAt: profileData.updatedAt || new Date().toISOString(),
                  }
                  profileStorage.setCurrentProfile(profileRef, user.id)
                  currentProfile = profileRef
                }
              }
            }
          } catch (apiError) {
            // API failed, continue without profile - user can still watch
            console.warn('Could not fetch profile, continuing without it:', apiError)
          }
        }
        
        // Profile is optional - continue even if we don't have one
        // Watch history will use localStorage fallback if no profile

        // Get movie from API
        const movieRes = await fetch(`/api/content/movie/${params.id}`)
        if (!movieRes.ok) {
          console.error('Movie not found:', params.id)
          router.push('/browse')
          return
        }
        const foundMovie = await movieRes.json()
        
        if (cancelled) return

        // Check for existing watch history BEFORE setting movie
        let savedProgress = 0
        let savedCurrentTime = 0
        let hasExistingHistory = false
        try {
          const history = await watchHistoryService.getAll()
          // Find ANY existing history (even with progress 0) to avoid overwriting
          const existingHistory = Array.isArray(history) 
            ? history.find((h: any) => h.movieId === params.id && !h.completed)
            : null
          
          if (existingHistory) {
            hasExistingHistory = true
            savedProgress = existingHistory.progress || 0
            savedCurrentTime = existingHistory.currentTime || 0
            console.log('📺 Found saved watch history:', {
              progress: savedProgress,
              currentTime: savedCurrentTime,
              duration: existingHistory.duration
            })
            
            // Only resume if we have meaningful progress (> 0 and < 90%)
            if (savedCurrentTime > 0 && savedProgress > 0 && savedProgress < 90 && existingHistory.duration > 0) {
              setInitialTime(savedCurrentTime)
              console.log('📺 Will resume from saved position:', savedCurrentTime, 'seconds (', savedProgress.toFixed(1), '%)')
            } else if (savedProgress >= 90) {
              console.log('📺 Progress is near end (90%+), starting from beginning')
              setInitialTime(null) // Explicitly set to null to ensure no resume
            } else {
              console.log('📺 History exists but no saved position, starting from beginning')
              setInitialTime(null) // Explicitly set to null to ensure no resume
            }
          } else {
            console.log('📺 No existing watch history, starting from beginning')
            setInitialTime(null) // Explicitly set to null to ensure no resume
          }
        } catch (error) {
          console.warn('Failed to load watch history:', error)
        }

        const movieData: Movie = {
          id: foundMovie.id,
          title: foundMovie.title,
          description: foundMovie.description,
          posterUrl: foundMovie.posterUrl,
          videoUrl: foundMovie.videoUrl || foundMovie.videoUrl1080p || foundMovie.videoUrl720p || foundMovie.videoUrl360p,
          videoUrl360p: foundMovie.videoUrl360p,
          videoUrl720p: foundMovie.videoUrl720p,
          videoUrl1080p: foundMovie.videoUrl1080p,
          subtitleUrlNepali: foundMovie.subtitleUrlNepali,
          subtitleUrlEnglish: foundMovie.subtitleUrlEnglish,
          duration: foundMovie.duration || 120, // Fallback duration
        }
        setMovie(movieData)

        // Only track watch start if there's no existing history (first time watching)
        // If there's existing history, we'll update it when playback starts
        if (!hasExistingHistory) {
          try {
            await watchHistoryService.add({
              movieId: params.id as string,
              progress: 0,
              currentTime: 0,
              duration: movieData.duration * 60,
              completed: false,
            })
            console.log('📺 Created new watch history entry')
          } catch (error) {
            console.warn('Failed to track watch start:', error)
          }
        } else {
          console.log('📺 Using existing watch history, will update on playback')
        }

        // Get recommended movies
        const recommendedRes = await fetch(`/api/content/movies?limit=10`)
        const recommendedMovies = recommendedRes.ok ? await recommendedRes.json() : []
        const recommendedItems: RecommendedItem[] = recommendedMovies
          .filter((m: any) => m.id !== params.id)
          .slice(0, 5)
          .map((m: any) => ({
            id: m.id,
            title: m.title,
            posterUrl: m.posterUrl,
            type: 'movie' as const,
          }))
        
        if (!cancelled) {
          setRecommended(recommendedItems)
          setIsLoading(false)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error loading movie:', error)
          setIsLoading(false)
        }
      }
    }

    loadMovie()

    return () => {
      cancelled = true
    }
  }, [params.id, user?.id, authLoading])

  if (authLoading || isLoading || !movie) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <VideoPlayer
        videoUrl={movie.videoUrl || ''}
        videoUrl360p={movie.videoUrl360p || undefined}
        videoUrl720p={movie.videoUrl720p || undefined}
        videoUrl1080p={movie.videoUrl1080p || undefined}
        subtitleUrlNepali={movie.subtitleUrlNepali}
        subtitleUrlEnglish={movie.subtitleUrlEnglish}
        title={movie.title}
        description={movie.description}
        posterUrl={movie.posterUrl}
        contentId={params.id as string}
        contentType="movie"
        initialTime={initialTime}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
      
      {/* Recommended content - shown after video ends or in a separate view */}
      {recommended.length > 0 && (
        <div className="relative z-0 pt-[100vh] bg-background">
          <div className="py-8">
            <ContentCarousel title="Continue Watching" items={recommended} />
          </div>
        </div>
      )}
    </>
  )
}

