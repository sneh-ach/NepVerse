'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Play, Info, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { getImageUrl } from '@/lib/utils'

interface HeroItem {
  id: string
  title: string
  description: string
  backdropUrl: string
  posterUrl: string
  contentType: 'movie' | 'series'
  rating?: number
  year?: number
}

interface HeroCarouselProps {
  items: HeroItem[]
  autoPlayInterval?: number // in milliseconds, default 12000 (12 seconds)
}

export function HeroCarousel({ items, autoPlayInterval = 12000 }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [imageLoaded, setImageLoaded] = useState<boolean[]>(items.map(() => false))
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 })
  const elementRef = useRef<HTMLDivElement>(null)
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  const currentItem = items[currentIndex]

  // Auto-play carousel
  useEffect(() => {
    if (items.length <= 1) return

    const startAutoPlay = () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length)
      }, autoPlayInterval)
    }

    startAutoPlay()

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }
  }, [items.length, autoPlayInterval])

  // Pause auto-play on hover
  const handleMouseEnter = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current)
    }
  }

  const handleMouseLeave = () => {
    if (items.length <= 1) return
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length)
    }, autoPlayInterval)
  }

  // Mouse position tracking for parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = elementRef.current?.getBoundingClientRect()
      if (rect) {
        setMousePosition({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        })
      }
    }

    const element = elementRef.current
    if (element) {
      element.addEventListener('mousemove', handleMouseMove)
      return () => element.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    // Reset auto-play timer
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current)
    }
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length)
    }, autoPlayInterval)
  }

  const goToPrevious = () => {
    goToSlide((currentIndex - 1 + items.length) % items.length)
  }

  const goToNext = () => {
    goToSlide((currentIndex + 1) % items.length)
  }

  if (!currentItem) return null

  const displayBackdropUrl = getImageUrl(currentItem.backdropUrl)
  const displayPosterUrl = getImageUrl(currentItem.posterUrl)

  return (
    <div 
      ref={elementRef}
      className="relative h-[90vh] min-h-[600px] max-h-[900px] flex items-end overflow-hidden group/carousel"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(229, 9, 20, 0.15) 0%, transparent 50%)`,
      }}
    >
      {/* Animated Background Gradient Overlay */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-br from-primary/20 via-transparent to-primary/10 animate-pulse-slow" />
      <div 
        className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_30%_70%,rgba(229,9,20,0.15)_0%,transparent_50%)] animate-pulse-slow" 
        style={{ animationDelay: '1s' }} 
      />
      <div 
        className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_70%_30%,rgba(244,6,18,0.1)_0%,transparent_50%)] animate-pulse-slow" 
        style={{ animationDelay: '2s' }} 
      />

      {/* Backdrop Images with Carousel Effect */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {items.map((item, index) => {
          const itemBackdropUrl = getImageUrl(item.backdropUrl)
          const isActive = index === currentIndex
          const isNext = index === (currentIndex + 1) % items.length
          const isPrevious = index === (currentIndex - 1 + items.length) % items.length
          
          return (
            <div
              key={item.id}
              className={`absolute inset-0 transform transition-all duration-[2000ms] ease-in-out ${
                isActive 
                  ? 'opacity-100 scale-100 z-10' 
                  : isNext || isPrevious
                  ? 'opacity-0 scale-105 z-0'
                  : 'opacity-0 scale-110 z-0'
              }`}
              style={{
                animation: isActive ? 'kenBurns 20s ease-in-out infinite' : 'none',
                transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
            >
              {itemBackdropUrl?.includes('r2.cloudflarestorage.com') || itemBackdropUrl?.includes('/api/storage/proxy') ? (
                <img
                  src={itemBackdropUrl}
                  alt={item.title}
                  className={`w-full h-full object-cover transition-opacity duration-1000 ${
                    imageLoaded[index] ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => {
                    setImageLoaded((prev) => {
                      const newState = [...prev]
                      newState[index] = true
                      return newState
                    })
                  }}
                  crossOrigin="anonymous"
                />
              ) : (
                <Image
                  src={itemBackdropUrl}
                  alt={item.title}
                  fill
                  className={`object-cover transition-opacity duration-1000 ${
                    imageLoaded[index] ? 'opacity-100' : 'opacity-0'
                  }`}
                  priority={index === 0}
                  sizes="100vw"
                  onLoad={() => {
                    setImageLoaded((prev) => {
                      const newState = [...prev]
                      newState[index] = true
                      return newState
                    })
                  }}
                  unoptimized={itemBackdropUrl?.startsWith('http://localhost')}
                />
              )}
              
              {/* Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 via-background/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/40" />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
              
              {/* Shimmer Effect */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" 
                style={{ backgroundSize: '200% 100%' }} 
              />
            </div>
          )
        })}
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Navigation Arrows */}
      {items.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-black/70 transition-all duration-300 opacity-0 group-hover/carousel:opacity-100"
            aria-label="Previous"
            type="button"
          >
            <ChevronLeft size={24} className="text-white" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-black/70 transition-all duration-300 opacity-0 group-hover/carousel:opacity-100"
            aria-label="Next"
            type="button"
          >
            <ChevronRight size={24} className="text-white" />
          </button>
        </>
      )}

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 lg:px-8 pb-20 lg:pb-24 w-full">
        <div className="max-w-4xl">
          {/* Badge Row */}
          <div 
            key={`badges-${currentIndex}`}
            className="flex flex-wrap items-center gap-3 mb-6"
            style={{
              animation: 'fadeIn 2s ease-in-out',
            }}
          >
            {currentItem.rating && (
              <div className="flex items-center space-x-1.5 px-4 py-2 bg-black/50 backdrop-blur-md rounded-lg border border-white/25 shadow-lg">
                <Star size={18} className="fill-yellow-400 text-yellow-400" />
                <span className="text-white font-bold text-base">
                  {(currentItem.rating > 5 ? currentItem.rating / 2 : currentItem.rating).toFixed(1)}/5
                </span>
              </div>
            )}
            
            {currentItem.year && (
              <div className="px-4 py-2 bg-black/50 backdrop-blur-md rounded-lg border border-white/25 shadow-lg">
                <span className="text-white font-bold text-base">
                  {currentItem.year}
                </span>
              </div>
            )}
            
            <div className="px-4 py-2 bg-black/50 backdrop-blur-md rounded-lg border border-white/25 shadow-lg">
              <span className="text-white font-bold text-base uppercase tracking-wider">
                {currentItem.contentType === 'movie' ? 'Movie' : 'Series'}
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 
            key={`title-${currentIndex}`}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg"
            style={{
              letterSpacing: '0.02em',
              textShadow: '0 2px 12px rgba(0,0,0,0.8)',
              lineHeight: '1.1',
              animation: 'fadeIn 2s ease-in-out',
            }}
          >
            {currentItem.title}
          </h1>

          {/* Description */}
          <p 
            key={`description-${currentIndex}`}
            className="text-lg md:text-xl text-gray-100 mb-6 max-w-3xl leading-relaxed drop-shadow-lg"
            style={{
              textShadow: '0 2px 10px rgba(0,0,0,0.6)',
              animation: 'fadeIn 2s ease-in-out',
            }}
          >
            {currentItem.description}
          </p>

          {/* Action Buttons */}
          <div 
            key={`buttons-${currentIndex}`}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
            style={{
              animation: 'fadeIn 2s ease-in-out',
            }}
          >
            <Link href={`/watch/${currentItem.contentType}/${currentItem.id}`} className="group relative inline-block">
              <Button 
                size="lg" 
                className="relative flex items-center px-7 py-3.5 text-base font-bold group/btn"
                style={{
                  background: 'linear-gradient(135deg, #e50914 0%, #b20710 100%)',
                  boxShadow: '0 10px 30px rgba(229, 9, 20, 0.4)',
                  gap: '12px',
                }}
              >
                <Play size={22} fill="currentColor" className="group-hover/btn:scale-110 transition-transform duration-300" />
                <span>Play</span>
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="flex items-center px-7 py-3.5 text-base font-semibold backdrop-blur-md border border-white/30 bg-white/5 hover:bg-white/10 hover:border-white/50 transition-all duration-300 group/btn"
              style={{
                gap: '12px',
              }}
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                router.push(`/${currentItem.contentType}/${currentItem.id}`)
              }}
            >
              <Info size={22} className="group-hover/btn:rotate-12 transition-transform duration-300" />
              <span>More Info</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Carousel Indicators */}
      {items.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'w-8 bg-primary'
                  : 'w-2 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${index + 1}`}
              type="button"
            />
          ))}
        </div>
      )}

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-[3] pointer-events-none" />
    </div>
  )
}
