'use client'

import { useState, useEffect } from 'react'
import { Play, Plus, Share2, Heart, Film } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ShareModal } from '@/components/content/ShareModal'
import { TrailerPlayer } from '@/components/content/TrailerPlayer'
import Link from 'next/link'
import { watchListService } from '@/lib/clientStorage'
import toast from 'react-hot-toast'

interface SeriesDetailClientProps {
  series: {
    id: string
    title: string
    trailerUrl?: string
    episodes?: Array<{ id: string }>
    rating?: number
    year?: number
    description?: string
  }
}

export function SeriesDetailClient({ series }: SeriesDetailClientProps) {
  const [showShareModal, setShowShareModal] = useState(false)
  const [showTrailer, setShowTrailer] = useState(false)
  const [inWatchlist, setInWatchlist] = useState(false)

  // Check if series is in watchlist on mount
  useEffect(() => {
    const checkWatchlist = async () => {
      try {
        const list = await watchListService.getAll()
        const isInList = list.some((item: any) => item.seriesId === series.id)
        setInWatchlist(isInList)
      } catch (error) {
        // Ignore errors
      }
    }
    checkWatchlist()
  }, [series.id])

  const handleAddToList = async () => {
    try {
      if (inWatchlist) {
        await watchListService.remove(undefined, series.id)
        setInWatchlist(false)
        toast.success('Removed from My List', {
          duration: 2500,
        })
      } else {
        await watchListService.add(undefined, series.id)
        setInWatchlist(true)
        toast.success('Added to My List', {
          duration: 2500,
        })
      }
    } catch (error: any) {
      if (error.message?.includes('Already')) {
        toast.error('Already in your list', {
          duration: 2500,
        })
      } else {
        toast.error('Failed to update list. Please try again.', {
          duration: 3000,
        })
      }
    }
  }

  const handleLike = () => {
    // Like/Heart button - same as add to list functionality
    handleAddToList()
  }

  return (
    <>
      <div className="flex items-center space-x-4 mb-6 flex-wrap gap-3">
        {series.episodes && Array.isArray(series.episodes) && series.episodes.length > 0 && series.episodes[0]?.id && (
          <Link href={`/watch/series/${series.id}/episode/${series.episodes[0].id}`}>
            <Button size="lg" className="flex items-center space-x-2 group/btn">
              <Play size={24} fill="currentColor" className="group-hover/btn:scale-125 transition-transform duration-300" />
              <span className="font-bold">Play</span>
            </Button>
          </Link>
        )}
        {series.trailerUrl && (
          <Button
            variant="outline"
            size="lg"
            className="flex items-center space-x-2 group/btn backdrop-blur-md"
            onClick={() => setShowTrailer(true)}
          >
            <Film size={24} className="group-hover/btn:rotate-12 transition-transform duration-300" />
            <span className="font-semibold">Trailer</span>
          </Button>
        )}
        <Button
          variant="outline"
          size="lg"
          className="flex items-center space-x-2 group/btn backdrop-blur-md"
          onClick={handleAddToList}
        >
          {inWatchlist ? (
            <>
              <Plus size={24} className="rotate-45 group-hover/btn:rotate-90 transition-transform duration-300" />
              <span className="font-semibold">Remove from List</span>
            </>
          ) : (
            <>
              <Plus size={24} className="group-hover/btn:rotate-90 transition-transform duration-300" />
              <span className="font-semibold">My List</span>
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          size="lg"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setShowShareModal(true)
          }}
          className="group/btn"
          type="button"
          aria-label="Share"
        >
          <Share2 size={24} className="group-hover/btn:rotate-12 transition-transform duration-300" />
        </Button>
        <Button variant="ghost" size="lg" onClick={handleLike} className="group/btn">
          <Heart size={24} className={`group-hover/btn:scale-125 transition-transform duration-300 ${inWatchlist ? 'fill-primary text-primary animate-pulse' : ''}`} />
        </Button>
      </div>

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={series.title}
        contentId={series.id}
        contentType="series"
        rating={series.rating}
        year={series.year}
        description={series.description}
      />

      {series.trailerUrl && showTrailer && (
        <TrailerPlayer
          trailerUrl={series.trailerUrl}
          title={series.title}
          onClose={() => setShowTrailer(false)}
        />
      )}
    </>
  )
}

