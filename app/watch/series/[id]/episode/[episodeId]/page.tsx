'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { VideoPlayer } from '@/components/player/VideoPlayer'
import { ContentCarousel } from '@/components/content/ContentCarousel'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { profileStorage, UserProfile } from '@/lib/localStorage'
import { watchHistoryService } from '@/lib/clientStorage'
// Removed mock data - using real API

interface Episode {
  id: string
  episodeNumber: number
  title: string
  description: string
  duration: number
  videoUrl: string
  videoUrl360p?: string
  videoUrl720p?: string
  videoUrl1080p?: string
  subtitleUrlNepali?: string
  subtitleUrlEnglish?: string
}

interface Series {
  id: string
  title: string
  posterUrl: string
  episodeCount?: number
}

interface NextEpisode {
  id: string
  episodeNumber: number
}

export default function EpisodePlayerPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [episode, setEpisode] = useState<Episode | null>(null)
  const [series, setSeries] = useState<Series | null>(null)
  const [nextEpisode, setNextEpisode] = useState<NextEpisode | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [initialTime, setInitialTime] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    let hasRedirected = false

    const loadEpisode = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        return
      }

      if (!user) {
        if (!hasRedirected) {
          hasRedirected = true
          router.push(`/login?redirect=/watch/series/${params.id}/episode/${params.episodeId}`)
        }
        return
      }

      try {
        // Try to get profile for watch history, but don't block if it doesn't exist
        // Users would have already selected a profile when opening the website
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

        // Get series and episode from API
        const episodeRes = await fetch(`/api/content/series/${params.id}/episode/${params.episodeId}`)
        if (!episodeRes.ok) {
          console.error('Episode not found:', params.id, params.episodeId)
          router.push('/browse')
          return
        }
        const episodeData = await episodeRes.json()
        
        const episodeFormatted: Episode = {
          id: episodeData.episode.id,
          episodeNumber: episodeData.episode.episodeNumber,
          title: episodeData.episode.title,
          description: episodeData.episode.description,
          duration: episodeData.episode.duration,
          videoUrl: episodeData.episode.videoUrl || episodeData.episode.videoUrl1080p || episodeData.episode.videoUrl720p || episodeData.episode.videoUrl360p,
          videoUrl360p: episodeData.episode.videoUrl360p,
          videoUrl720p: episodeData.episode.videoUrl720p,
          videoUrl1080p: episodeData.episode.videoUrl1080p,
          subtitleUrlNepali: episodeData.episode.subtitleUrlNepali,
          subtitleUrlEnglish: episodeData.episode.subtitleUrlEnglish,
        }

        const seriesFormatted: Series = {
          id: episodeData.series.id,
          title: episodeData.series.title,
          posterUrl: episodeData.series.posterUrl,
          episodeCount: episodeData.series.episodes?.length || 0,
        }

        if (cancelled) return

        // Check for existing watch history BEFORE setting episode
        let savedProgress = 0
        let savedCurrentTime = 0
        let hasExistingHistory = false
        try {
          const history = await watchHistoryService.getAll()
          // Find ANY existing history (even with progress 0) to avoid overwriting
          const existingHistory = Array.isArray(history)
            ? history.find((h: any) => 
                h.seriesId === params.id && 
                h.episodeId === params.episodeId && 
                !h.completed
              )
            : null
          
          if (existingHistory) {
            hasExistingHistory = true
            savedProgress = existingHistory.progress || 0
            savedCurrentTime = existingHistory.currentTime || 0
            console.log('📺 Found saved watch history for episode:', {
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
            } else {
              console.log('📺 History exists but no saved position, starting from beginning')
            }
          } else {
            console.log('📺 No existing watch history, starting from beginning')
          }
        } catch (error) {
          console.warn('Failed to load watch history:', error)
        }

        setEpisode(episodeFormatted)
        setSeries(seriesFormatted)
        
        // Set next episode if available
        if (episodeData.nextEpisode) {
          setNextEpisode({
            id: episodeData.nextEpisode.id,
            episodeNumber: episodeData.nextEpisode.episodeNumber,
          })
        }

        // Only track watch start if there's no existing history (first time watching)
        // If there's existing history, we'll update it when playback starts
        if (!hasExistingHistory) {
          try {
            await watchHistoryService.add({
              seriesId: params.id as string,
              episodeId: params.episodeId as string,
              progress: 0,
              currentTime: 0,
              duration: episodeFormatted.duration * 60,
              completed: false,
            })
            console.log('📺 Created new watch history entry for episode')
          } catch (error) {
            console.warn('Failed to track watch start:', error)
          }
        } else {
          console.log('📺 Using existing watch history, will update on playback')
        }

        if (!cancelled) {
          setIsLoading(false)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error loading episode:', error)
          setIsLoading(false)
        }
      }
    }

    loadEpisode()

    return () => {
      cancelled = true
    }
  }, [params.id, params.episodeId, user?.id, router, authLoading])

  const handleTimeUpdate = useCallback((time: number, duration: number) => {
    watchHistoryService.add({
      seriesId: params.id as string,
      episodeId: params.episodeId as string,
      progress: (time / duration) * 100,
      currentTime: time,
      duration,
      completed: false,
    })
  }, [params.id, params.episodeId])

  const handleEnded = useCallback(() => {
    watchHistoryService.add({
      seriesId: params.id as string,
      episodeId: params.episodeId as string,
      progress: 100,
      currentTime: episode?.duration ? episode.duration * 60 : 2700,
      duration: episode?.duration ? episode.duration * 60 : 2700,
      completed: true,
    })

    // Auto-play next episode if available
    if (nextEpisode) {
      setTimeout(() => {
        router.push(`/watch/series/${params.id}/episode/${nextEpisode.id}`)
      }, 3000)
    }
  }, [params.id, params.episodeId, episode?.duration, nextEpisode, router])

  if (authLoading || isLoading || !episode || !series) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
        <VideoPlayer
          videoUrl={episode.videoUrl}
          videoUrl360p={episode.videoUrl360p}
          videoUrl720p={episode.videoUrl720p}
          videoUrl1080p={episode.videoUrl1080p}
          subtitleUrlNepali={episode.subtitleUrlNepali}
          subtitleUrlEnglish={episode.subtitleUrlEnglish}
          title={`${series.title} - Episode ${episode.episodeNumber}`}
          description={episode.description}
          posterUrl={series.posterUrl}
          contentId={params.id as string}
          contentType="series"
          episodeId={params.episodeId as string}
          initialTime={initialTime}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
        />

      {/* Episode Navigation - shown after video */}
      <div className="relative z-0 pt-[100vh] bg-background">
        {/* Episode Navigation */}
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href={`/series/${params.id}`}>
            <Button variant="ghost" className="flex items-center space-x-2">
              <ChevronLeft size={20} />
              <span>Back to Series</span>
            </Button>
          </Link>

          {nextEpisode && (
            <Link href={`/watch/series/${params.id}/episode/${nextEpisode.id}`}>
              <Button variant="primary" className="flex items-center space-x-2">
                <span>Next Episode</span>
                <ChevronRight size={20} />
              </Button>
            </Link>
          )}
        </div>

        <div className="bg-card rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Episode {episode.episodeNumber}: {episode.title}
          </h2>
          {(episode as any).titleNepali && (
            <p className="text-gray-400 mb-4">{(episode as any).titleNepali}</p>
          )}
          <p className="text-gray-300">{episode.description}</p>
        </div>
      </div>
      </div>
    </>
  )
}

