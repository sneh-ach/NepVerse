'use client'

import React, { useState, useEffect, useMemo, memo } from 'react'
import { cn } from '@/lib/utils'
import { ContentCard } from './ContentCard'
import { ContentCardSkeleton } from '@/components/ui/Skeleton'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'

interface ContentItem {
  id: string
  title: string
  titleNepali?: string
  description?: string
  descriptionNepali?: string
  posterUrl: string
  backdropUrl?: string
  videoUrl?: string
  trailerUrl?: string
  type: 'movie' | 'series'
  rating?: number
  year?: number
  duration?: number
  quality?: string
  ageRating?: string
  cast?: string
  matureThemes?: string
  tags?: string
  genres?: Array<{ name: string }>
  progress?: number
}

interface ContentGridProps {
  title: string
  items: ContentItem[]
  className?: string
  showLoading?: boolean
  rows?: number // Number of rows to show (default: 3)
  columns?: { mobile?: number; tablet?: number; desktop?: number } // Responsive columns
}

export function ContentGrid({ 
  title, 
  items, 
  className, 
  showLoading = false,
  rows = 3,
  columns = { mobile: 2, tablet: 3, desktop: 4 }
}: ContentGridProps) {
  const [isLoading, setIsLoading] = useState(showLoading)
  const [watchlistItems, setWatchlistItems] = useState<Set<string>>(new Set())
  const { elementRef, hasIntersected } = useIntersectionObserver({ triggerOnce: true })

  useEffect(() => {
    let mounted = true
    let timer: NodeJS.Timeout | null = null
    
    // Load watchlist status
    const loadWatchlist = async () => {
      try {
        const { watchListService } = await import('@/lib/clientStorage')
        const list = await watchListService.getAll()
        if (mounted) {
          const ids = new Set((list || []).map((item: any) => item.movieId || item.seriesId).filter(Boolean))
          setWatchlistItems(ids)
        }
      } catch (error) {
        // Ignore errors
      }
    }
    loadWatchlist()
    
    // Simulate loading for better UX
    if (showLoading) {
      timer = setTimeout(() => {
        if (mounted) {
          setIsLoading(false)
        }
      }, 500)
    } else {
      setIsLoading(false)
    }
    
    return () => {
      mounted = false
      if (timer) clearTimeout(timer)
    }
  }, [showLoading, items])

  // Memoize enriched items to prevent unnecessary recalculations
  const enrichedItems = useMemo(() => {
    return items.map(item => {
      return {
        ...item,
        rating: item.rating,
        year: item.year,
        duration: item.duration,
        inWatchlist: watchlistItems.has(item.id),
      }
    })
  }, [items, watchlistItems])

  // Calculate items to show based on rows and columns
  const itemsToShow = useMemo(() => {
    // For mobile (2 cols) * 3 rows = 6 items
    // For tablet (3 cols) * 3 rows = 9 items
    // For desktop (4 cols) * 3 rows = 12 items
    // Show max based on desktop (most items)
    const maxItems = (columns.desktop || 4) * rows
    return enrichedItems.slice(0, maxItems)
  }, [enrichedItems, rows, columns])

  // Get column classes based on responsive breakpoints
  const getGridCols = () => {
    const mobile = columns.mobile || 2
    const tablet = columns.tablet || 3
    const desktop = columns.desktop || 4
    
    // Map numbers to Tailwind classes
    const colsMap: Record<number, string> = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
    }
    
    return cn(
      'grid gap-4 sm:gap-6 px-4 lg:px-8',
      colsMap[mobile] || 'grid-cols-2',
      `sm:${colsMap[tablet] || 'grid-cols-3'}`,
      `lg:${colsMap[desktop] || 'grid-cols-4'}`
    )
  }

  if (isLoading) {
    return (
      <div className={cn('mb-8', className)}>
        <h2 className="text-xl md:text-2xl font-bold text-white mb-4 px-4 lg:px-8">
          {title}
        </h2>
        <div className={getGridCols()}>
          {[...Array((columns.desktop || 4) * rows)].map((_, i) => (
            <ContentCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (!itemsToShow || itemsToShow.length === 0) {
    return null
  }

  return (
    <div 
      ref={elementRef as any}
      className={cn(
        'mb-12 transition-all duration-1000',
        hasIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        className
      )}
    >
      <div className="px-4 lg:px-8 mb-4 sm:mb-6">
        <h2 
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4" 
          style={{ 
            letterSpacing: '0.03em',
            textShadow: '0 2px 12px rgba(0,0,0,0.8)',
            lineHeight: '1.1',
          }}
        >
          {title}
        </h2>
        <div className="h-1.5 sm:h-2 w-24 sm:w-32 bg-gradient-to-r from-primary to-primary/50 rounded-full" />
      </div>
      
      <div className={getGridCols()}>
        {itemsToShow.map((item, index) => (
          <div
            key={item.id}
            style={{
              animationDelay: `${index * 50}ms`,
            }}
            className="animate-fade-in"
          >
            <ContentCard
              id={item.id}
              title={item.title}
              titleNepali={item.titleNepali}
              description={item.description}
              descriptionNepali={item.descriptionNepali}
              posterUrl={item.posterUrl}
              backdropUrl={item.backdropUrl}
              videoUrl={item.videoUrl}
              trailerUrl={item.trailerUrl}
              type={item.type}
              rating={item.rating}
              year={item.year}
              duration={item.duration}
              quality={item.quality}
              ageRating={item.ageRating}
              cast={item.cast}
              matureThemes={item.matureThemes}
              tags={item.tags}
              genres={item.genres}
              progress={item.progress}
              inWatchlist={item.inWatchlist}
              className="w-full"
            />
          </div>
        ))}
      </div>
    </div>
  )
})
