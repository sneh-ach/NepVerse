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
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft size={18} className="mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Watch History</h1>
              <p className="text-gray-400 mt-1">
                {watchHistory.length} {watchHistory.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
          {watchHistory.length > 0 && (
            <Button variant="outline" onClick={clearHistory}>
              <Trash2 size={18} className="mr-2" />
              Clear All
            </Button>
          )}
        </div>

        {watchHistory.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-lg">
            <History size={64} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold text-xl mb-2">No Watch History Yet</h3>
            <p className="text-gray-400 text-lg mb-6 max-w-md mx-auto">
              Start watching movies and series to see your progress here. Your watch history will appear automatically.
            </p>
            <Link href="/browse">
              <Button variant="primary">Browse Content</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

