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
        style={{ willChange: 'transform', transformOrigin: 'center center' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div 
          onClick={handleCardClick}
          className="block group/card cursor-pointer"
        >
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-card transition-all duration-300 ease-out group-hover/card:scale-105 group-hover/card:z-40 group-hover/card:shadow-2xl origin-center">
          {!imageError ? (
            // Always use regular img for R2 images and proxy URLs
            (posterUrl?.includes('r2.cloudflarestorage.com') || posterUrl?.includes('/api/storage/proxy')) ? (
              <img
                src={posterUrl}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                onError={() => setImageError(true)}
                loading="lazy"
                crossOrigin="anonymous"
              />
            ) : (
              <Image
                src={posterUrl}
                alt={title}
                fill
                className="object-cover transition-transform duration-300 group-hover/card:scale-105"
                sizes="(max-width: 768px) 192px, (max-width: 1024px) 224px, 256px"
                onError={() => setImageError(true)}
                loading="lazy"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                unoptimized={posterUrl?.startsWith('http://localhost')}
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

          {/* Quick Actions Overlay - Better Visibility */}
          {showQuickActions && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all duration-200 pointer-events-none z-20">
              <div className="flex items-center space-x-3 pointer-events-auto">
                <button
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-primary via-primary-light to-primary-dark flex items-center justify-center shadow-2xl hover:shadow-primary/70 hover:scale-110 active:scale-95 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transform-gpu group relative overflow-hidden border-2 border-white/20"
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
                  <span className="absolute inset-0 bg-white/30 rounded-full scale-0 group-hover:scale-150 transition-transform duration-300 opacity-0 group-hover:opacity-100" />
                  <Play size={28} className="text-white ml-1 fill-current relative z-10 group-hover:scale-110 transition-transform duration-200" />
                </button>
                <button
                  onClick={handleAddToList}
                  className="w-14 h-14 rounded-full bg-black/90 backdrop-blur-md flex items-center justify-center hover:bg-primary/90 hover:scale-110 active:scale-95 transition-all duration-200 border-2 border-white/40 hover:border-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transform-gpu group relative overflow-hidden shadow-xl hover:shadow-primary/40"
                  aria-label={isInWatchlist ? `Remove ${title} from list` : `Add ${title} to list`}
                >
                  <span className="absolute inset-0 bg-primary/40 rounded-full scale-0 group-hover:scale-150 transition-transform duration-300 opacity-0 group-hover:opacity-100" />
                  {isInWatchlist ? (
                    <Heart size={22} className="text-primary fill-current relative z-10 group-hover:scale-125 transition-transform duration-200" />
                  ) : (
                    <Plus size={22} className="text-white relative z-10 group-hover:rotate-90 group-hover:scale-125 transition-all duration-200" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Rating Badge - Always Visible - Larger */}
          {rating !== undefined && (
            <div className="absolute top-3 left-3 bg-black/95 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center space-x-1.5 z-20 shadow-lg border border-yellow-400/30">
              <Star size={16} className="text-yellow-400 fill-yellow-400" />
              <span className="text-white text-sm font-bold">
                {(rating > 5 ? rating / 2 : rating).toFixed(1)}/5
              </span>
            </div>
          )}

          {/* Bottom Info - Always Visible - Larger and More Prominent */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/95 to-black/70 z-10">
            <h3 className="text-white font-bold text-base mb-2 line-clamp-1 drop-shadow-lg">{title}</h3>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap text-sm">
                {year && (
                  <span className="text-white font-semibold">{year}</span>
                )}
                {duration && (
                  <div className="flex items-center space-x-1.5 text-white">
                    <Clock size={14} />
                    <span className="font-medium">{Math.floor(duration / 60)}h {duration % 60}m</span>
                  </div>
                )}
                {quality && (
                  <span className="px-2 py-0.5 bg-primary/90 rounded text-white text-xs font-bold">{quality}</span>
                )}
                {ageRating && (
                  <span className="px-2 py-0.5 bg-gray-700 rounded text-white text-xs font-semibold">{ageRating}</span>
                )}
              </div>
            </div>
          </div>
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


