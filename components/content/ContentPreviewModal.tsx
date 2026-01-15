'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X, Volume2, VolumeX, Play, ArrowLeft, Star, Clock, Users, Tag, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatDuration } from '@/lib/utils'
import Link from 'next/link'

interface ContentPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  content: {
    id: string
    title: string
    titleNepali?: string
    description?: string
    descriptionNepali?: string
    posterUrl?: string
    backdropUrl?: string
    videoUrl?: string
    trailerUrl?: string
    rating?: number
    year?: number
    duration?: number
    quality?: string
    ageRating?: string
    cast?: string
    matureThemes?: string
    tags?: string
    genres?: Array<{ name: string }>
    type: 'movie' | 'series'
  }
}

export function ContentPreviewModal({ isOpen, onClose, content }: ContentPreviewModalProps) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const previewTimeoutRef = useRef<NodeJS.Timeout>()

  // Auto-play preview immediately when modal opens
  useEffect(() => {
    if (!isOpen) {
      // Reset when closed
      setHasStarted(false)
      setIsPlaying(false)
      setVideoError(false)
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.src = ''
      }
      return
    }

    if (!content.videoUrl) {
      // No video URL, just show backdrop
      return
    }

    // Clear any existing timeout
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current)
    }

    // Reset states when modal opens
    setHasStarted(false)
    setIsPlaying(false)
    setVideoError(false)

    // Start preview after a short delay
    previewTimeoutRef.current = setTimeout(() => {
      startPreview()
    }, 300)
    
    // eslint-disable-next-line react-hooks/exhaustive-deps

    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, content.videoUrl])

  const startPreview = async () => {
    const video = videoRef.current
    if (!video || !content.videoUrl) return

    // Check if already started to prevent multiple calls
    if (hasStarted) return

    try {
      setHasStarted(true)
      setVideoError(false)
      
      // Set video source
      video.src = content.videoUrl
      video.muted = isMuted
      video.playsInline = true
      video.preload = 'auto'
      
      let stopTimeout: NodeJS.Timeout | null = null
      
      // Get video duration and play a random 4-5 second segment
      const handleLoadedMetadata = () => {
        const currentVideo = videoRef.current
        if (!currentVideo) return
        
        if (currentVideo.duration && currentVideo.duration > 0) {
          // Play a random segment (avoid last 10 seconds and first 30 seconds)
          const minStart = Math.min(30, currentVideo.duration * 0.1) // Skip first 10% or 30 seconds, whichever is smaller
          const maxStart = Math.max(minStart, currentVideo.duration - 10)
          const startTime = minStart + Math.random() * (maxStart - minStart)
          const clipDuration = 4 + Math.random() // 4-5 seconds
          
          currentVideo.currentTime = startTime
          
          const playPromise = currentVideo.play()
          if (playPromise !== undefined) {
            playPromise.then(() => {
              setIsPlaying(true)
              
              // Stop after clip duration
              stopTimeout = setTimeout(() => {
                const v = videoRef.current
                if (v) {
                  v.pause()
                  setIsPlaying(false)
                }
              }, clipDuration * 1000)
            }).catch((err) => {
              console.error('Error playing preview:', err)
              // Try with trailer if main video fails
              if (content.trailerUrl && content.trailerUrl !== content.videoUrl) {
                currentVideo.src = content.trailerUrl
                currentVideo.load()
                currentVideo.play().catch(() => setVideoError(true))
              } else {
                setVideoError(true)
              }
            })
          }
        } else {
          // Fallback: try to play from start
          currentVideo.currentTime = 0
          currentVideo.play().then(() => setIsPlaying(true)).catch(() => setVideoError(true))
        }
      }

      const handleError = () => {
        console.error('Video error')
        // Try trailer as fallback
        if (content.trailerUrl && content.trailerUrl !== content.videoUrl) {
          video.src = content.trailerUrl
          video.load()
        } else {
          setVideoError(true)
        }
      }

      video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true })
      video.addEventListener('error', handleError, { once: true })
      video.addEventListener('canplay', () => {
        // Video can start playing
        if (!isPlaying && video.readyState >= 3) {
          video.play().then(() => setIsPlaying(true)).catch(() => {})
        }
      }, { once: true })

      video.load()
    } catch (error) {
      console.error('Error starting preview:', error)
      setVideoError(true)
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (video) {
      video.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleBack = () => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.src = ''
    }
    setHasStarted(false)
    setIsPlaying(false)
    setVideoError(false)
    onClose()
    router.push('/')
  }

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.src = ''
      }
      setHasStarted(false)
      setIsPlaying(false)
      setVideoError(false)
    }
  }, [isOpen])

  const handlePlayFull = () => {
    if (videoRef.current) {
      videoRef.current.pause()
    }
    onClose()
    router.push(`/watch/${content.type}/${content.id}`)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[99999] bg-black">
      {/* Backdrop Video/Image */}
      <div className="absolute inset-0">
        {!videoError && content.videoUrl && hasStarted ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted={isMuted}
              autoPlay
              preload="auto"
              onError={() => {
                console.error('Video error in preview modal')
                setVideoError(true)
              }}
              onLoadedData={() => {
                // Video loaded, ensure it plays
                const video = videoRef.current
                if (video && !isPlaying && video.readyState >= 3) {
                  video.play().then(() => setIsPlaying(true)).catch(() => setVideoError(true))
                }
              }}
              onCanPlay={() => {
                const video = videoRef.current
                if (video && !isPlaying) {
                  video.play().then(() => setIsPlaying(true)).catch(() => {})
                }
              }}
              loop={false}
            />
            {/* Fallback image while video loads */}
            {!isPlaying && (
              <img
                src={content.backdropUrl || content.posterUrl || '/placeholder-poster.jpg'}
                alt={content.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
          </>
        ) : (
          <img
            src={content.backdropUrl || content.posterUrl || '/placeholder-poster.jpg'}
            alt={content.title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/20" />
      </div>

      {/* Controls Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 z-10">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            className="backdrop-blur-md bg-black/50 border-white/30 hover:bg-black/70"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Home
          </Button>
          
          <div className="flex items-center space-x-3">
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
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-black/70 transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Details */}
      <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
        <div className="max-w-4xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            {content.title}
          </h1>
          {content.titleNepali && (
            <h2 className="text-2xl md:text-3xl text-gray-300 mb-4">{content.titleNepali}</h2>
          )}

          {/* Info Bar */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            {content.rating && (
              <div className="flex items-center space-x-1 bg-primary/90 px-3 py-1 rounded-md">
                <Star size={16} className="fill-white text-white" />
                <span className="text-white font-bold">{(content.rating > 5 ? content.rating / 2 : content.rating).toFixed(1)}/5</span>
              </div>
            )}
            {content.year && (
              <span className="text-white text-lg font-semibold">{content.year}</span>
            )}
            {content.duration && (
              <div className="flex items-center space-x-1 text-white">
                <Clock size={16} />
                <span>{Math.floor(content.duration / 60)}h {content.duration % 60}m</span>
              </div>
            )}
            {content.quality && (
              <span className="px-3 py-1 bg-blue-500/80 rounded-md text-white text-sm font-semibold">
                {content.quality}
              </span>
            )}
            {content.ageRating && (
              <span className="px-3 py-1 bg-gray-700 rounded-md text-white">{content.ageRating}</span>
            )}
          </div>

          {/* Genres */}
          {content.genres && content.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {content.genres.map((genre: any, idx: number) => (
                <span key={idx} className="px-3 py-1 bg-gray-700/80 rounded-md text-gray-300 text-sm">
                  {genre.name || genre}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {content.description && (
            <p className="text-lg text-gray-200 mb-4 max-w-2xl line-clamp-3">
              {content.description}
            </p>
          )}

          {/* Cast, Themes, Tags */}
          <div className="space-y-2 mb-6">
            {content.cast && (
              <div className="flex items-start space-x-2">
                <Users size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-gray-300 text-sm">
                  <span className="font-semibold text-white">Cast:</span> {content.cast}
                </p>
              </div>
            )}
            {content.matureThemes && (
              <div className="flex items-start space-x-2">
                <AlertTriangle size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-gray-400 text-sm">{content.matureThemes}</p>
              </div>
            )}
            {content.tags && (
              <div className="flex items-start space-x-2">
                <Tag size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-gray-300 text-sm">
                  <span className="font-semibold text-white">This {content.type === 'movie' ? 'Movie' : 'Series'} Is:</span> {content.tags}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <Button
              variant="primary"
              size="lg"
              onClick={handlePlayFull}
              className="flex items-center space-x-2"
            >
              <Play size={24} fill="currentColor" />
              <span className="font-bold">Play</span>
            </Button>
            <Link href={`/${content.type}/${content.id}`}>
              <Button
                variant="outline"
                size="lg"
                className="backdrop-blur-md border-white/30 hover:bg-white/10"
              >
                More Info
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
