'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Play, Info, Star, Sparkles, TrendingUp, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { truncateText, getImageUrl } from '@/lib/utils'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'

interface HeroBannerProps {
  title: string
  description: string
  backdropUrl: string
  posterUrl: string
  contentId: string
  contentType: 'movie' | 'series'
  rating?: number
  year?: number
}

export function HeroBanner({
  title,
  description,
  backdropUrl,
  posterUrl,
  contentId,
  contentType,
  rating,
  year,
}: HeroBannerProps) {
  const { elementRef, hasIntersected } = useIntersectionObserver({ triggerOnce: true })
  const router = useRouter()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 })
  const [kenBurnsScale, setKenBurnsScale] = useState(1)
  
  // Rewrite Vercel URLs to localhost in development
  const displayBackdropUrl = getImageUrl(backdropUrl)
  const displayPosterUrl = getImageUrl(posterUrl)
  
  // Ken Burns effect - subtle zoom animation
  useEffect(() => {
    const interval = setInterval(() => {
      setKenBurnsScale(prev => {
        if (prev >= 1.1) return 1.05
        return prev + 0.001
      })
    }, 50)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = (elementRef.current as HTMLElement)?.getBoundingClientRect()
      if (rect) {
        setMousePosition({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        })
      }
    }

    const element = elementRef.current as HTMLElement
    if (element) {
      element.addEventListener('mousemove', handleMouseMove)
      return () => element.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <div 
      ref={elementRef as any}
      className={`relative h-[90vh] min-h-[600px] max-h-[900px] flex items-end overflow-hidden transition-all duration-1000 ${
        hasIntersected ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(229, 9, 20, 0.15) 0%, transparent 50%)`,
      }}
    >
      {/* Animated Background Gradient Overlay - Multiple Layers */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-br from-primary/20 via-transparent to-primary/10 animate-pulse-slow" />
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_30%_70%,rgba(229,9,20,0.15)_0%,transparent_50%)] animate-pulse-slow" 
           style={{ animationDelay: '1s' }} />
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_70%_30%,rgba(244,6,18,0.1)_0%,transparent_50%)] animate-pulse-slow" 
           style={{ animationDelay: '2s' }} />
      
      {/* Backdrop Image with Parallax Effect */}
      <div className="absolute inset-0 z-0 transform transition-transform duration-700 ease-out" 
           style={{ 
             transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px) scale(1.05)`,
           }}>
        {(displayBackdropUrl?.includes('r2.cloudflarestorage.com') || displayBackdropUrl?.includes('/api/storage/proxy')) ? (
          <img
            src={displayBackdropUrl}
            alt={title}
            className={`w-full h-full object-cover transition-opacity duration-1000 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = displayPosterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920'
            }}
            crossOrigin="anonymous"
          />
        ) : (
          <Image
            src={displayBackdropUrl}
            alt={title}
            fill
            className={`object-cover transition-opacity duration-1000 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            priority
            sizes="100vw"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = displayPosterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920'
            }}
            unoptimized={displayBackdropUrl?.startsWith('http://localhost')}
          />
        )}
        
        {/* Multi-layer Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
        
        {/* Animated Shimmer Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" 
             style={{ 
               backgroundSize: '200% 100%',
             }} />
      </div>

      {/* Floating Particles Effect */}
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

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 lg:px-8 pb-20 lg:pb-24 w-full">
        <div className="max-w-4xl">
          {/* Badge Row - Enhanced Style */}
          <div className="flex flex-wrap items-center gap-3 mb-6 animate-fade-in">
            {rating && (
              <div className="flex items-center space-x-1.5 px-4 py-2 bg-black/50 backdrop-blur-md rounded-lg border border-white/25 shadow-lg">
                <Star size={18} className="fill-yellow-400 text-yellow-400" />
                <span className="text-white font-bold text-base">
                  {(rating > 5 ? rating / 2 : rating).toFixed(1)}/5
                </span>
              </div>
            )}
            
            {year && (
              <div className="px-4 py-2 bg-black/50 backdrop-blur-md rounded-lg border border-white/25 shadow-lg">
                <span className="text-white font-bold text-base">
                  {year}
                </span>
              </div>
            )}
            
            <div className="px-4 py-2 bg-black/50 backdrop-blur-md rounded-lg border border-white/25 shadow-lg">
              <span className="text-white font-bold text-base uppercase tracking-wider">
                {contentType === 'movie' ? 'Movie' : 'Series'}
              </span>
            </div>
            
            {contentType === 'series' && (
              <div className="px-4 py-2 bg-primary/30 backdrop-blur-md rounded-lg border border-primary/40 shadow-lg">
                <span className="text-white font-bold text-sm uppercase">
                  Original
                </span>
              </div>
            )}
          </div>

          {/* Title - Movie Detail Style */}
          <h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg animate-slide-up"
            style={{
              letterSpacing: '0.02em',
              textShadow: '0 2px 12px rgba(0,0,0,0.8)',
              lineHeight: '1.1',
            }}
          >
            {title}
          </h1>

          {/* Description - Movie Detail Style */}
          <p 
            className="text-lg md:text-xl text-gray-100 mb-6 max-w-3xl leading-relaxed drop-shadow-lg animate-fade-in"
            style={{
              textShadow: '0 2px 10px rgba(0,0,0,0.6)',
              animationDelay: '0.2s',
            }}
          >
            {description}
          </p>

          {/* Action Buttons - Movie Detail Style */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Link href={`/watch/${contentType}/${contentId}`} className="group relative inline-block">
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
                router.push(`/${contentType}/${contentId}`)
              }}
            >
              <Info size={22} className="group-hover/btn:rotate-12 transition-transform duration-300" />
              <span>More Info</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Fade Edge */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-[3] pointer-events-none" />
    </div>
  )
}
