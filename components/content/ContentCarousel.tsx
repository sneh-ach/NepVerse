'use client'

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ContentCard } from './ContentCard'
import { ContentCardSkeleton } from '@/components/ui/Skeleton'
// Removed mock data - using real API
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

interface ContentCarouselProps {
  title: string
  items: ContentItem[]
  className?: string
  showLoading?: boolean
  alwaysShow?: boolean // If true, show empty state instead of returning null
  emptyMessage?: string // Custom message when empty
}

export function ContentCarousel({ title, items, className, showLoading = false, alwaysShow = false, emptyMessage }: ContentCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(showLoading)
  const [watchlistItems, setWatchlistItems] = useState<Set<string>>(new Set())
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
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

  // Debounced scroll handler for performance
  const updateScrollButtons = useCallback(() => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }, [])

  useEffect(() => {
    const scrollElement = scrollRef.current
    if (!scrollElement) return

    updateScrollButtons()
    
    // Debounced scroll handler
    let scrollTimeout: NodeJS.Timeout | null = null
    const handleScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        updateScrollButtons()
      }, 100)
    }
    
    scrollElement.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', updateScrollButtons, { passive: true })

    return () => {
      if (scrollTimeout) clearTimeout(scrollTimeout)
      scrollElement.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', updateScrollButtons)
    }
  }, [updateScrollButtons])

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    
    // Prevent rapid clicking
    const button = scrollRef.current.closest('.carousel-wrapper')?.querySelector(`button[aria-label*="${direction}"]`) as HTMLButtonElement
    if (button?.hasAttribute('data-scrolling')) return
    if (button) {
      button.setAttribute('data-scrolling', 'true')
      setTimeout(() => button.removeAttribute('data-scrolling'), 500)
    }
    
    const scrollAmount = scrollRef.current.clientWidth * 0.8
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }, [])

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

  if (isLoading) {
    return (
      <div className={cn('mb-8', className)}>
        <h2 className="text-xl md:text-2xl font-bold text-white mb-4 px-4 lg:px-8">
          {title}
        </h2>
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide px-4 lg:px-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-48 md:w-56 lg:w-64">
              <ContentCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Show empty state if alwaysShow is true and no items
  if (!enrichedItems || enrichedItems.length === 0) {
    if (alwaysShow) {
      return (
        <div 
          ref={elementRef as any}
          className={cn(
            'mb-12 transition-all duration-1000',
            hasIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
            className
          )}
        >
          <div className="px-4 lg:px-8 mb-6">
            <h2 
              className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2" 
              style={{ 
                letterSpacing: '0.05em',
                textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              }}
            >
              {title}
            </h2>
            <div className="h-1 w-20 bg-gradient-to-r from-primary to-primary/50 rounded-full" />
          </div>
          <div className="px-4 lg:px-8">
            <div className="bg-card/60 backdrop-blur-sm rounded-xl p-8 text-center border border-gray-700/50 shadow-xl">
              <p className="text-gray-300 text-lg">
                {emptyMessage || 'No items to show. Start watching to see your progress here.'}
              </p>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div 
      ref={elementRef as any}
      className={cn(
        'mb-12 transition-all duration-1000',
        hasIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
    >
      <div className="px-4 lg:px-8 mb-6">
        <h2 
          className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2" 
          style={{ 
            fontFamily: 'var(--font-bebas), sans-serif',
            letterSpacing: '0.05em',
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
          }}
        >
          {title}
        </h2>
        <div className="h-1 w-20 bg-gradient-to-r from-primary to-primary/50 rounded-full" />
      </div>
      <div className="relative carousel-wrapper group/carousel">
        {canScrollLeft && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              scroll('left')
            }}
            className="absolute left-0 top-0 bottom-0 z-10 w-16 bg-gradient-to-r from-background via-background/90 to-transparent opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 flex items-center justify-center hover:bg-background/90 focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-primary rounded-r-md hover:scale-110"
            aria-label="Scroll left"
            type="button"
          >
            <ChevronLeft size={32} className="text-white drop-shadow-lg" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex space-x-4 overflow-x-auto scrollbar-hide px-4 lg:px-8 scroll-smooth momentum-scroll pb-4 overflow-y-visible"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            overscrollBehaviorX: 'contain',
            overflowY: 'visible',
          }}
          onWheel={(e) => {
            if (scrollRef.current && e.currentTarget === e.target) {
              e.preventDefault()
              scrollRef.current.scrollLeft += e.deltaY
            }
          }}
        >
          {enrichedItems.map((item, index) => (
            <div
              key={item.id}
              className="flex-shrink-0"
              style={{
                animationDelay: `${index * 50}ms`,
              }}
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
                className="w-52 md:w-60 lg:w-72"
              />
            </div>
          ))}
        </div>

        {canScrollRight && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              scroll('right')
            }}
            className="absolute right-0 top-0 bottom-0 z-10 w-16 bg-gradient-to-l from-background via-background/90 to-transparent opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 flex items-center justify-center hover:bg-background/90 focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-primary rounded-l-md hover:scale-110"
            aria-label="Scroll right"
            type="button"
          >
            <ChevronRight size={32} className="text-white drop-shadow-lg" />
          </button>
        )}
      </div>
    </div>
  )
}

