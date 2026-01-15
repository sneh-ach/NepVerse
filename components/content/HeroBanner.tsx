'use client'

import React, { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Play, Info, Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { truncateText } from '@/lib/utils'
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

  return (
    <div 
      ref={elementRef as any}
      className={`relative h-[80vh] min-h-[500px] flex items-end transition-all duration-1000 ${
        hasIntersected ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Backdrop Image */}
      <div className="absolute inset-0 z-0">
        {(backdropUrl?.includes('r2.cloudflarestorage.com') || backdropUrl?.includes('/api/storage/proxy')) ? (
          <img
            src={backdropUrl}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920'
            }}
            crossOrigin="anonymous"
          />
        ) : (
          <Image
            src={backdropUrl}
            alt={title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920'
            }}
            unoptimized={backdropUrl?.startsWith('http://localhost')}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 lg:px-8 pb-16">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            {title}
          </h1>

          <div className="flex items-center space-x-4 mb-4 text-white">
            {rating && (
              <span className="px-3 py-1 bg-primary rounded-md font-semibold flex items-center space-x-1">
                <Star size={16} className="fill-white" />
                <span>{(rating > 5 ? rating / 2 : rating).toFixed(1)}/5</span>
              </span>
            )}
            {year && <span>{year}</span>}
            <span className="px-3 py-1 bg-gray-700 rounded-md">
              {contentType === 'movie' ? 'Movie' : 'Series'}
            </span>
          </div>

          <p className="text-lg text-gray-200 mb-6 drop-shadow-lg">
            {truncateText(description, 200)}
          </p>

          <div className="flex items-center space-x-4">
            <Link href={`/watch/${contentType}/${contentId}`} className="inline-block">
              <Button size="lg" className="flex items-center space-x-2 group/btn">
                <Play size={24} fill="currentColor" className="group-hover/btn:scale-110 transition-transform duration-300" />
                <span className="font-bold">Watch Now</span>
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="flex items-center space-x-2 group/btn backdrop-blur-md"
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                router.push(`/${contentType}/${contentId}`)
              }}
            >
              <Info size={24} className="group-hover/btn:rotate-12 transition-transform duration-300" />
              <span className="font-semibold">More Info</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}



