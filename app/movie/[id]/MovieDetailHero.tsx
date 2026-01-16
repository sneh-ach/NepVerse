'use client'

import React, { useEffect, useRef, useState } from 'react'
import { AutoPlayPreview } from '@/components/content/AutoPlayPreview'

interface MovieDetailHeroProps {
  videoUrl: string
  trailerUrl?: string | null
  backdropUrl: string
  posterUrl: string
  title: string
  previewDuration?: number
  children: React.ReactNode
}

export function MovieDetailHero({
  videoUrl,
  trailerUrl,
  backdropUrl,
  posterUrl,
  title,
  previewDuration = 12,
  children,
}: MovieDetailHeroProps) {
  const elementRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 })

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

  return (
    <div 
      ref={elementRef}
      className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] min-h-[400px] sm:min-h-[450px] md:min-h-[500px] overflow-hidden"
      style={{
        background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(229, 9, 20, 0.15) 0%, transparent 50%)`,
      }}
    >
      {/* Animated Background Gradient Overlay - Multiple Layers */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-br from-primary/20 via-transparent to-primary/10 animate-pulse-slow" />
      <div 
        className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_30%_70%,rgba(229,9,20,0.15)_0%,transparent_50%)] animate-pulse-slow" 
        style={{ animationDelay: '1s' }} 
      />
      <div 
        className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_70%_30%,rgba(244,6,18,0.1)_0%,transparent_50%)] animate-pulse-slow" 
        style={{ animationDelay: '2s' }} 
      />

      {/* AutoPlayPreview with Smooth Ken Burns Effect */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          animation: 'kenBurns 20s ease-in-out infinite',
        }}
      >
        <AutoPlayPreview
          videoUrl={videoUrl}
          trailerUrl={trailerUrl}
          backdropUrl={backdropUrl}
          posterUrl={posterUrl}
          title={title}
          previewDuration={previewDuration}
        />
        
        {/* Multi-layer Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
        
        {/* Animated Shimmer Effect - Flickering Style */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" 
          style={{ 
            backgroundSize: '200% 100%',
          }} 
        />
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

      {/* Smooth Bottom Fade to Black */}
      <div 
        className="absolute bottom-0 left-0 right-0 z-[3] pointer-events-none"
        style={{
          height: '200px',
          background: 'linear-gradient(to bottom, transparent 0%, rgba(11, 11, 11, 0.3) 30%, rgba(11, 11, 11, 0.7) 60%, rgba(11, 11, 11, 0.95) 85%, #0b0b0b 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  )
}
