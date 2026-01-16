'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { ContinueWatchingCard } from '@/components/content/ContinueWatchingCard'
import { Skeleton } from '@/components/ui/Skeleton'
import Link from 'next/link'
import { ArrowLeft, Trash2, History } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { watchHistoryService } from '@/lib/clientStorage'
import toast from 'react-hot-toast'

export default function WatchHistoryPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [watchHistory, setWatchHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/dashboard/history')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      const loadHistory = async () => {
        try {
          const history = await watchHistoryService.getAll()
          setWatchHistory(history || [])
        } catch (error) {
          setWatchHistory([])
        } finally {
          setIsLoading(false)
        }
      }
      loadHistory()
    }
  }, [user])

  const clearHistory = () => {
    if (!confirm('Are you sure you want to clear all watch history?')) return

    try {
      watchHistoryService.clear()
      setWatchHistory([])
      toast.success('Watch history cleared successfully', {
        duration: 3000,
      })
    } catch (error) {
      toast.error('Failed to clear history. Please try again.', {
        duration: 3000,
      })
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="aspect-video w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-6 sm:py-8">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-sm">
                <ArrowLeft size={16} className="sm:w-[18px] sm:h-[18px] mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">Watch History</h1>
              <p className="text-sm sm:text-base text-gray-400 mt-1">
                {watchHistory.length} {watchHistory.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
          {watchHistory.length > 0 && (
            <Button variant="outline" onClick={clearHistory} className="text-sm">
              <Trash2 size={16} className="sm:w-[18px] sm:h-[18px] mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Clear All</span>
              <span className="sm:hidden">Clear</span>
            </Button>
          )}
        </div>

        {watchHistory.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-card rounded-lg">
            <History size={48} className="sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold text-lg sm:text-xl mb-2">No Watch History Yet</h3>
            <p className="text-sm sm:text-base md:text-lg text-gray-400 mb-6 max-w-md mx-auto px-4">
              Start watching movies and series to see your progress here. Your watch history will appear automatically.
            </p>
            <Link href="/browse">
              <Button variant="primary">Browse Content</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {watchHistory.map((item) => (
              <ContinueWatchingCard
                key={item.id}
                id={item.movieId || item.seriesId || item.id || ''}
                title={item.movie?.title || item.series?.title || item.movieId || item.seriesId || 'Unknown'}
                posterUrl={item.movie?.posterUrl || item.series?.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500'}
                progress={item.progress || 0}
                duration={item.duration || 0}
                currentTime={item.currentTime || 0}
                type={item.movieId ? 'movie' : 'series'}
                episodeTitle={item.episode?.title}
                episodeNumber={item.episode?.episodeNumber}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

