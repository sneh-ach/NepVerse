'use client'

import { useState, useEffect } from 'react'
import { Play, Plus, Share2, Heart, Film } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ShareModal } from '@/components/content/ShareModal'
import { TrailerPlayer } from '@/components/content/TrailerPlayer'
import Link from 'next/link'
import { watchListService } from '@/lib/clientStorage'
import toast from 'react-hot-toast'

interface MovieDetailClientProps {
  movie: {
    id: string
    title: string
    trailerUrl?: string
    rating?: number
    year?: number
    description?: string
  }
}

export function MovieDetailClient({ movie }: MovieDetailClientProps) {
  const [showShareModal, setShowShareModal] = useState(false)
  const [showTrailer, setShowTrailer] = useState(false)
  const [inWatchlist, setInWatchlist] = useState(false)

  // Check if movie is in watchlist on mount
  useEffect(() => {
    const checkWatchlist = async () => {
      try {
        const list = await watchListService.getAll()
        const isInList = list.some((item: any) => item.movieId === movie.id)
        setInWatchlist(isInList)
      } catch (error) {
        // Ignore errors
      }
    }
    checkWatchlist()
  }, [movie.id])

  const handleAddToList = async () => {
    try {
      if (inWatchlist) {
        await watchListService.remove(movie.id, undefined)
        setInWatchlist(false)
        toast.success('Removed from My List', {
          duration: 2500,
        })
      } else {
        await watchListService.add(movie.id, undefined)
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

  return (
    <>
      <div className="flex items-center space-x-2 sm:space-x-4 mb-4 sm:mb-6 flex-wrap gap-2 sm:gap-3">
        <Link href={`/watch/movie/${movie.id}`} className="group/play-link">
          <Button 
            size="lg" 
            className="relative flex items-center space-x-2 px-4 sm:px-7 py-2.5 sm:py-3.5 text-sm sm:text-base font-bold"
            style={{
              background: 'linear-gradient(135deg, #e50914 0%, #b20710 100%)',
              boxShadow: '0 10px 30px rgba(229, 9, 20, 0.4)',
            }}
          >
            <Play size={18} className="sm:w-[22px] sm:h-[22px] group-hover/play-link:scale-110 transition-transform duration-300" fill="currentColor" />
            <span>Play</span>
          </Button>
        </Link>
        {movie.trailerUrl && (
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
        <Button 
          variant="ghost" 
          size="lg"
          onClick={handleAddToList}
          className="group/btn w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/20 hover:bg-black/60 hover:border-white/40 transition-all duration-300"
        >
          <Heart size={18} className={`sm:w-[22px] sm:h-[22px] group-hover/btn:scale-125 transition-transform duration-300 ${inWatchlist ? 'fill-primary text-primary' : ''}`} />
        </Button>
      </div>

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={movie.title}
        contentId={movie.id}
        contentType="movie"
        rating={movie.rating}
        year={movie.year}
        description={movie.description}
      />

      {movie.trailerUrl && showTrailer && (
        <TrailerPlayer
          trailerUrl={movie.trailerUrl}
          title={movie.title}
          onClose={() => setShowTrailer(false)}
        />
      )}
    </>
  )
}

