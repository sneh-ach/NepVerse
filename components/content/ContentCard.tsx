'use client'

import React, { useState, useCallback, memo, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Play, Plus, Heart, MoreVertical, Star, Clock, Film } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getImageUrl } from '@/lib/utils'
import toast from 'react-hot-toast'

interface ContentCardProps {
  id: string
  title: string
  posterUrl: string
  backdropUrl?: string
  type: 'movie' | 'series'
  rating?: number
  year?: number
  duration?: number
  quality?: string
  ageRating?: string
  progress?: number
  inWatchlist?: boolean
  className?: string
  showQuickActions?: boolean
  onAddToList?: () => void
  onRemoveFromList?: () => void
  // For preview modal
  description?: string
  descriptionNepali?: string
  titleNepali?: string
  videoUrl?: string
  trailerUrl?: string
  cast?: string
  matureThemes?: string
  tags?: string
  genres?: Array<{ name: string }>
}

export const ContentCard = memo(function ContentCard({
  id,
  title,
  posterUrl,
  backdropUrl,
  type,
  rating,
  year,
  duration,
  quality,
  ageRating,
  progress,
  inWatchlist = false,
  className = '',
  showQuickActions = true,
  onAddToList,
  onRemoveFromList,
  description,
  descriptionNepali,
  titleNepali,
  videoUrl,
  trailerUrl,
  cast,
  matureThemes,
  tags,
  genres,
}: ContentCardProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [isInWatchlist, setIsInWatchlist] = useState(inWatchlist)
  const [imageError, setImageError] = useState(false)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Rewrite Vercel URLs to localhost in development
  const displayPosterUrl = getImageUrl(posterUrl)

  const handleAddToList = useCallback(async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    // Prevent double-clicks
    if (e) {
      const target = e.currentTarget as HTMLButtonElement
      if (target.hasAttribute('data-processing')) return
      target.setAttribute('data-processing', 'true')
      setTimeout(() => target.removeAttribute('data-processing'), 1000)
    }
    
    if (!user) {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
        router.push(`/login?redirect=/${type}/${id}`)
        toast.error('Please login to add content to your list', {
          duration: 3000,
        })
      }
      return
    }

    try {
      const { watchListService } = await import('@/lib/clientStorage')
      if (isInWatchlist) {
        await watchListService.remove(type === 'movie' ? id : undefined, type === 'series' ? id : undefined)
        setIsInWatchlist(false)
        if (e) {
          toast.success('Removed from My List', {
            duration: 2500,
          })
        }
        onRemoveFromList?.()
      } else {
        await watchListService.add(type === 'movie' ? id : undefined, type === 'series' ? id : undefined)
        setIsInWatchlist(true)
        if (e) {
          toast.success('Added to My List', {
            duration: 2500,
          })
        }
        onAddToList?.()
      }
    } catch (error: any) {
      if (e) {
        toast.error(error.message || 'Failed to update list. Please try again.', {
          duration: 3000,
        })
      }
    }
  }, [user, isInWatchlist, type, id, onAddToList, onRemoveFromList])
  
  // Handle hover to add to list
  const handleMouseEnter = useCallback(() => {
    // Only add on hover if not already in list and user is logged in
    if (user && !isInWatchlist) {
      // Clear any existing timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
      // Small delay to avoid accidental adds
      hoverTimeoutRef.current = setTimeout(() => {
        handleAddToList()
      }, 1000) // 1 second hover before adding
    }
  }, [user, isInWatchlist, handleAddToList])
  
  const handleMouseLeave = useCallback(() => {
    // Clear hover timeout if user moves away
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
  }, [])

  const detailUrl = `/${type}/${id}`

  const handleCardClick = (e: React.MouseEvent) => {
    // Navigate to detail page instead of showing preview modal
    router.push(detailUrl)
  }

  return (
    <>
      <div 
        className={`relative flex-shrink-0 ${className}`} 
        style={{ willChange: 'transform', transformOrigin: 'center center', padding: '8px' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div 
          onClick={handleCardClick}
          className="block group/card cursor-pointer"
        >
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-card transition-all duration-500 ease-out group-hover/card:scale-105 group-hover/card:z-40 group-hover/card:shadow-[0_20px_60px_rgba(0,0,0,0.8)] origin-center border border-white/10 group-hover/card:border-white/30">
          {!imageError ? (
            // Always use regular img for R2 images and proxy URLs
            (displayPosterUrl?.includes('r2.cloudflarestorage.com') || displayPosterUrl?.includes('/api/storage/proxy')) ? (
              <img
                src={displayPosterUrl}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover/card:scale-105"
                onError={() => setImageError(true)}
                loading="lazy"
                crossOrigin="anonymous"
              />
            ) : (
              <Image
                src={displayPosterUrl}
                alt={title}
                fill
                className="object-cover transition-transform duration-500 ease-out group-hover/card:scale-105"
                sizes="(max-width: 768px) 192px, (max-width: 1024px) 224px, 256px"
                onError={() => setImageError(true)}
                loading="lazy"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                unoptimized={displayPosterUrl?.startsWith('http://localhost')}
              />
            )
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <div className="text-center p-4">
                <Film className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-xs">{title}</p>
              </div>
            </div>
          )}

          {/* Subtle Overlay on Hover - Not Faded */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-200" />

          {/* Progress Bar */}
          {progress !== undefined && progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-800/80 z-30">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Quick Actions Overlay - Clean & Premium */}
          {showQuickActions && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all duration-300 pointer-events-none z-20">
              <div className="absolute inset-0 bg-black/30 transition-all duration-300" />
              <div className="flex items-center space-x-6 pointer-events-auto relative z-10">
                <button
                  className="rounded-full bg-gradient-to-br from-primary via-primary-light to-primary-dark flex items-center justify-center shadow-[0_20px_60px_rgba(229,9,20,0.7)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transform-gpu group/play relative overflow-hidden border-2 border-white/50 transition-all duration-300"
                  style={{ width: '90px', height: '90px' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.15)'
                    e.currentTarget.style.boxShadow = '0 25px 80px rgba(229,9,20,0.9)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.8)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = '0 20px 60px rgba(229,9,20,0.7)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'
                  }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const target = e.currentTarget as HTMLButtonElement
                    if (target.hasAttribute('data-navigating')) return
                    target.setAttribute('data-navigating', 'true')
                    setTimeout(() => target.removeAttribute('data-navigating'), 1000)
                    router.push(type === 'movie' ? `/watch/movie/${id}` : `/series/${id}`)
                  }}
                  aria-label={`Play ${title}`}
                >
                  <span className="absolute inset-0 bg-white/40 rounded-full scale-0 group-hover/play:scale-125 transition-transform duration-300 opacity-0 group-hover/play:opacity-100 z-0" />
                  <Play size={40} className="text-white ml-1 fill-current relative z-10 group-hover/play:scale-110 transition-transform duration-300 drop-shadow-2xl" />
                </button>
                <button
                  onClick={handleAddToList}
                  className="rounded-full bg-black/95 backdrop-blur-2xl flex items-center justify-center border-2 border-white/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transform-gpu group/list relative overflow-hidden shadow-2xl transition-all duration-300"
                  style={{ width: '80px', height: '80px' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.15)'
                    e.currentTarget.style.backgroundColor = 'rgba(229,9,20,0.9)'
                    e.currentTarget.style.borderColor = 'rgba(229,9,20,0.9)'
                    e.currentTarget.style.boxShadow = '0 20px 60px rgba(229,9,20,0.7)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.95)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)'
                    e.currentTarget.style.boxShadow = '0 0 0 rgba(229,9,20,0)'
                  }}
                  aria-label={isInWatchlist ? `Remove ${title} from list` : `Add ${title} to list`}
                >
                  <span className="absolute inset-0 bg-primary/50 rounded-full scale-0 group-hover/list:scale-125 transition-transform duration-300 opacity-0 group-hover/list:opacity-100 z-0" />
                  {isInWatchlist ? (
                    <Heart size={32} className="text-primary fill-current relative z-10 group-hover/list:scale-110 transition-transform duration-300 drop-shadow-2xl" />
                  ) : (
                    <Plus size={32} className="text-white relative z-10 group-hover/list:rotate-90 group-hover/list:scale-110 transition-all duration-300 drop-shadow-2xl" />
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
        </div>
      </div>
    </>
  )
}, (prevProps, nextProps) => {
  // Custom comparison for memoization
  return (
    prevProps.id === nextProps.id &&
    prevProps.title === nextProps.title &&
    prevProps.posterUrl === nextProps.posterUrl &&
    prevProps.type === nextProps.type &&
    prevProps.rating === nextProps.rating &&
    prevProps.year === nextProps.year &&
    prevProps.duration === nextProps.duration &&
    prevProps.quality === nextProps.quality &&
    prevProps.ageRating === nextProps.ageRating &&
    prevProps.progress === nextProps.progress &&
    prevProps.inWatchlist === nextProps.inWatchlist &&
    prevProps.className === nextProps.className &&
    prevProps.videoUrl === nextProps.videoUrl &&
    prevProps.backdropUrl === nextProps.backdropUrl
  )
})


