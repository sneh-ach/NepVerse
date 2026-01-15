'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

interface AutoPlayPreviewProps {
  videoUrl?: string | null
  trailerUrl?: string | null
  backdropUrl?: string | null
  posterUrl?: string | null
  title: string
  previewDuration?: number // Duration in seconds (default 12, range 10-15)
}

export function AutoPlayPreview({
  videoUrl,
  trailerUrl,
  backdropUrl,
  posterUrl,
  title,
  previewDuration = 12, // Default 12 seconds, can be 10-15
}: AutoPlayPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-play preview when component mounts
  useEffect(() => {
    const video = videoRef.current
    const videoSource = videoUrl || trailerUrl

    if (!video || !videoSource) {
      return
    }

    // Reset states
    setHasStarted(false)
    setIsPlaying(false)
    setShowVideo(false)
    setVideoError(false)

    // Small delay to ensure DOM is ready and video element is mounted
    const startTimeout = setTimeout(() => {
      try {
        // Ensure video is in DOM
        if (!videoRef.current) return
        
        setHasStarted(true)
        const currentVideo = videoRef.current
        currentVideo.src = videoSource
        currentVideo.muted = true // Always start muted for autoplay
        currentVideo.playsInline = true
        currentVideo.preload = 'auto'
        currentVideo.setAttribute('playsinline', 'true')
        currentVideo.setAttribute('webkit-playsinline', 'true')

        const handleLoadedMetadata = () => {
          if (video.duration && video.duration > 0) {
            // Start from a random point (skip first 30 seconds, avoid last 20 seconds)
            const minStart = Math.min(30, video.duration * 0.1)
            const maxStart = Math.max(minStart, video.duration - 20)
            const startTime = minStart + Math.random() * (maxStart - minStart)

            video.currentTime = startTime
            setShowVideo(true)

            // Wait for video to be ready to play
            const tryPlay = () => {
              if (video.readyState >= 3) { // HAVE_FUTURE_DATA
                const playPromise = video.play()
                if (playPromise !== undefined) {
                  playPromise
                    .then(() => {
                      setIsPlaying(true)

                      // Stop after preview duration
                      stopTimeoutRef.current = setTimeout(() => {
                        if (video) {
                          video.pause()
                          setIsPlaying(false)
                          setShowVideo(false)
                        }
                      }, previewDuration * 1000)
                    })
                    .catch((err) => {
                      console.error('Error playing preview:', err)
                      setVideoError(true)
                      setShowVideo(false)
                    })
                }
              } else {
                // Wait a bit more for video to be ready
                setTimeout(tryPlay, 100)
              }
            }
            
            tryPlay()
          } else {
            // Fallback: try to play from start
            video.currentTime = 0
            setShowVideo(true)
            const tryPlay = () => {
              if (video.readyState >= 3) {
                video.play().then(() => setIsPlaying(true)).catch(() => {
                  setVideoError(true)
                  setShowVideo(false)
                })
              } else {
                setTimeout(tryPlay, 100)
              }
            }
            tryPlay()
          }
        }

        const handleError = () => {
          console.error('Video error in auto-play preview')
          setVideoError(true)
          setShowVideo(false)
        }

        currentVideo.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true })
        currentVideo.addEventListener('error', handleError, { once: true })
        currentVideo.addEventListener('canplay', () => {
          if (!isPlaying && currentVideo.readyState >= 3 && hasStarted) {
            currentVideo.play().then(() => {
              setIsPlaying(true)
              setShowVideo(true)
            }).catch((err) => {
              console.error('Error in canplay handler:', err)
            })
          }
        }, { once: true })
        
        currentVideo.addEventListener('loadeddata', () => {
          // Video data loaded, try to play
          if (!isPlaying && hasStarted && currentVideo.readyState >= 2) {
            currentVideo.play().then(() => {
              setIsPlaying(true)
              setShowVideo(true)
            }).catch(() => {})
          }
        }, { once: true })

        currentVideo.load()
      } catch (error) {
        console.error('Error starting preview:', error)
        setVideoError(true)
      }
    }, 500)

    return () => {
      clearTimeout(startTimeout)
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current)
      }
      const currentVideo = videoRef.current
      if (currentVideo) {
        currentVideo.pause()
        currentVideo.src = ''
        currentVideo.load()
      }
    }
  }, [videoUrl, trailerUrl, previewDuration]) // Removed isMuted from dependencies

  const toggleMute = () => {
    const video = videoRef.current
    if (video) {
      video.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const videoSource = videoUrl || trailerUrl
  const hasVideo = !!videoSource && !videoError

  return (
    <div className="absolute inset-0">
      {/* Video Preview - Always render video element if we have a source */}
      {hasVideo && (
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${showVideo && isPlaying ? 'block' : 'hidden'}`}
          playsInline
          muted={isMuted}
          autoPlay
          loop={false}
          preload="auto"
        />
      )}
      
      {/* Fallback to backdrop/poster image */}
      {(!hasVideo || !showVideo || !isPlaying) && (backdropUrl || posterUrl) && (
        (backdropUrl || posterUrl)?.includes('r2.cloudflarestorage.com') ||
        (backdropUrl || posterUrl)?.includes('/api/storage/proxy') ? (
          <img
            src={backdropUrl || posterUrl}
            alt={title}
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
          />
        ) : (
          <img
            src={backdropUrl || posterUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        )
      )}

      {/* Mute/Unmute Toggle */}
      {hasVideo && showVideo && (
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={toggleMute}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-black/70 transition-colors"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX size={20} className="text-white" />
            ) : (
              <Volume2 size={20} className="text-white" />
            )}
          </button>
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent" />
    </div>
  )
}
