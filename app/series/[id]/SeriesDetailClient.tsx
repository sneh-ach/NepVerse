'use client'

import { useState, useEffect } from 'react'
import { Play, Plus, Share2, Heart, Film } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ShareModal } from '@/components/content/ShareModal'
import { TrailerPlayer } from '@/components/content/TrailerPlayer'
import { AddToPlaylistButton } from '@/components/content/AddToPlaylistButton'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
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
  const router = useRouter()
  const { user } = useAuth()
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
    if (!user) {
      router.push(`/login?redirect=/series/${series.id}`)
      toast.error('Please login to add content to your list', {
        duration: 3000,
      })
      return
    }

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

  const handlePlayClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault()
      if (series.episodes && series.episodes.length > 0 && series.episodes[0]?.id) {
        router.push(`/login?redirect=/watch/series/${series.id}/episode/${series.episodes[0].id}`)
      } else {
        router.push(`/login?redirect=/series/${series.id}`)
      }
      toast.error('Please login to watch series', {
        duration: 3000,
      })
    }
  }

  const handleLike = () => {
    // Like/Heart button - same as add to list functionality
    handleAddToList()
  }

  return (
    <>
      <div className="flex items-center space-x-2 sm:space-x-4 mb-4 sm:mb-6 flex-wrap gap-2 sm:gap-3">
        {series.episodes && Array.isArray(series.episodes) && series.episodes.length > 0 && series.episodes[0]?.id && (
          <Link 
            href={`/watch/series/${series.id}/episode/${series.episodes[0].id}`} 
            className="group/play-link"
            onClick={handlePlayClick}
          >
            <Button size="lg" className="relative flex items-center space-x-2 px-4 sm:px-7 py-2.5 sm:py-3.5 text-sm sm:text-base font-bold">
              <Play size={18} className="sm:w-[22px] sm:h-[22px] group-hover/play-link:scale-110 transition-transform duration-300" fill="currentColor" />
              <span>Play</span>
            </Button>
          </Link>
        )}
        {series.trailerUrl && (
          <Button
            variant="outline"
            size="lg"
            className="flex items-center space-x-2 px-4 sm:px-7 py-2.5 sm:py-3.5 text-sm sm:text-base font-semibold group/trailer backdrop-blur-md border border-white/30 bg-white/5 hover:bg-white/10 hover:border-white/50 transition-all duration-300"
            onClick={() => setShowTrailer(true)}
          >
            <Film size={18} className="sm:w-[22px] sm:h-[22px] group-hover/trailer:rotate-12 transition-transform duration-300" />
            <span className="hidden sm:inline">Trailer</span>
          </Button>
        )}
        <Button
          variant="outline"
          size="lg"
          className="flex items-center space-x-2 px-4 sm:px-7 py-2.5 sm:py-3.5 text-sm sm:text-base font-semibold group/list-btn backdrop-blur-md border border-white/30 bg-white/5 hover:bg-white/10 hover:border-white/50 transition-all duration-300"
          onClick={handleAddToList}
        >
          {inWatchlist ? (
            <>
              <Plus size={18} className="sm:w-[22px] sm:h-[22px] rotate-45 group-hover/list-btn:rotate-90 transition-transform duration-300" />
              <span className="hidden sm:inline">Remove from List</span>
              <span className="sm:hidden">Remove</span>
            </>
          ) : (
            <>
              <Plus size={18} className="sm:w-[22px] sm:h-[22px] group-hover/list-btn:rotate-90 transition-transform duration-300" />
              <span>My List</span>
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
          className="group/btn w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/20 hover:bg-black/60 hover:border-white/40 transition-all duration-300"
          type="button"
          aria-label="Share"
        >
          <Share2 size={18} className="sm:w-[22px] sm:h-[22px] group-hover/btn:rotate-12 transition-transform duration-300" />
        </Button>
        {user && (
          <div className="hidden sm:block">
            <AddToPlaylistButton seriesId={series.id} />
          </div>
        )}
        <Button variant="ghost" size="lg" onClick={handleLike} className="group/btn w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/20 hover:bg-black/60 hover:border-white/40 transition-all duration-300">
          <Heart size={18} className={`sm:w-[22px] sm:h-[22px] group-hover/btn:scale-125 transition-transform duration-300 ${inWatchlist ? 'fill-primary text-primary' : ''}`} />
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

