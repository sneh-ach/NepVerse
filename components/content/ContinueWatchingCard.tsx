'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Play, Clock } from 'lucide-react'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatDuration } from '@/lib/utils'

interface ContinueWatchingCardProps {
  id: string
  title: string
  posterUrl: string
  progress: number
  duration: number
  currentTime: number
  type: 'movie' | 'series'
  episodeTitle?: string
  episodeNumber?: number
}

export function ContinueWatchingCard({
  id,
  title,
  posterUrl,
  progress,
  duration,
  currentTime,
  type,
  episodeTitle,
  episodeNumber,
}: ContinueWatchingCardProps) {
  const watchUrl =
    type === 'movie'
      ? `/watch/movie/${id}`
      : `/watch/series/${id}/episode/${id}` // Would need episode ID

  return (
    <Link href={watchUrl} className="group block">
      <div className="relative aspect-video rounded-lg overflow-hidden bg-card card-3d transition-all duration-500 group-hover:scale-105 group-hover:shadow-2xl">
        {(posterUrl?.includes('r2.cloudflarestorage.com') || posterUrl?.includes('/api/storage/proxy')) ? (
          <img
            src={posterUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            crossOrigin="anonymous"
          />
        ) : (
          <Image
            src={posterUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            unoptimized={posterUrl?.startsWith('http://localhost')}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        
        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <ProgressBar progress={progress} size="sm" className="mb-2" />
          <div className="flex items-center justify-between text-white text-sm">
            <div className="flex items-center space-x-2">
              <Clock size={14} />
              <span>{formatDuration(duration - currentTime)} left</span>
            </div>
            {type === 'series' && episodeNumber && (
              <span className="text-gray-300">Episode {episodeNumber}</span>
            )}
          </div>
        </div>

        {/* Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
            <Play size={24} className="text-white ml-1" fill="currentColor" />
          </div>
        </div>
      </div>
      
      <div className="mt-3">
        <h3 className="text-white font-semibold mb-1 group-hover:text-primary transition-colors">
          {title}
        </h3>
        {episodeTitle && (
          <p className="text-gray-400 text-sm">{episodeTitle}</p>
        )}
      </div>
    </Link>
  )
}



