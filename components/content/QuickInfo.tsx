'use client'

import React, { useState } from 'react'
import { Info } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'

interface QuickInfoProps {
  title: string
  titleNepali?: string
  description?: string
  descriptionNepali?: string
  releaseDate?: string | Date
  rating?: number
  ageRating?: string
  genres?: string[]
  duration?: number
  type: 'movie' | 'series'
}

export function QuickInfo({
  title,
  titleNepali,
  description,
  descriptionNepali,
  releaseDate,
  rating,
  ageRating,
  genres,
  duration,
  type,
}: QuickInfoProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Safe date formatting
  const formatReleaseDate = (date?: string | Date) => {
    if (!date) return null
    try {
      return formatDate(date)
    } catch (error) {
      console.error('Error formatting date:', error)
      return typeof date === 'string' ? date : date.toString()
    }
  }

  // Safe rating formatting - handles both old 10-point and new 5-point scale
  const formatRating = (rating?: number) => {
    if (rating === undefined || rating === null || isNaN(rating)) return null
    try {
      // If rating > 5, it's on old 10-point scale, convert it
      return (rating > 5 ? rating / 2 : rating).toFixed(1)
    } catch (error) {
      console.error('Error formatting rating:', error)
      return rating.toString()
    }
  }

  // Safe duration formatting
  const formatDuration = (duration?: number) => {
    if (!duration || isNaN(duration)) return null
    try {
      const hours = Math.floor(duration / 60)
      const minutes = duration % 60
      if (hours > 0) {
        return `${hours}h ${minutes}m`
      }
      return `${minutes}m`
    } catch (error) {
      console.error('Error formatting duration:', error)
      return `${duration}m`
    }
  }

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsOpen(true)
        }}
        className="p-2 hover:bg-gray-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="More info"
        type="button"
      >
        <Info size={20} className="text-white" />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={title || 'Content Info'} size="lg">
        <div className="space-y-6">
          {titleNepali && (
            <h3 className="text-xl text-gray-300 font-semibold">{titleNepali}</h3>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {rating !== undefined && rating !== null && (
              <Badge variant="primary">
                {formatRating(rating)}/5 ⭐
              </Badge>
            )}
            {releaseDate && (
              <Badge variant="default">
                {formatReleaseDate(releaseDate)}
              </Badge>
            )}
            {duration && (
              <Badge variant="default">
                {formatDuration(duration)}
              </Badge>
            )}
            {ageRating && (
              <Badge variant="default">{ageRating}</Badge>
            )}
            {type && (
              <Badge variant="default" className="capitalize">
                {type}
              </Badge>
            )}
          </div>

          {genres && Array.isArray(genres) && genres.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-2 font-medium">Genres</p>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre, index) => (
                  <Badge key={`${genre}-${index}`} variant="outline">
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {description && (
            <div>
              <p className="text-sm text-gray-400 mb-2 font-medium">Description</p>
              <p className="text-white leading-relaxed">{description}</p>
              {descriptionNepali && (
                <p className="text-gray-300 mt-2 leading-relaxed">{descriptionNepali}</p>
              )}
            </div>
          )}

          {!description && !titleNepali && !rating && !releaseDate && !duration && (!genres || genres.length === 0) && (
            <p className="text-gray-400 text-center py-4">No additional information available.</p>
          )}
        </div>
      </Modal>
    </>
  )
}




