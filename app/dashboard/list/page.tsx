'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { ContentCarousel } from '@/components/content/ContentCarousel'
import { Skeleton } from '@/components/ui/Skeleton'
import Link from 'next/link'
import { ArrowLeft, Heart } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { watchListService } from '@/lib/clientStorage'

export default function WatchListPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [watchList, setWatchList] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/dashboard/list')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      const loadWatchList = async () => {
        try {
          const list = await watchListService.getAll()
          setWatchList(list || [])
        } catch (error) {
          setWatchList([])
        } finally {
          setIsLoading(false)
        }
      }
      loadWatchList()
    }
  }, [user])

  if (loading || isLoading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-6 sm:py-8">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center space-x-3 sm:space-x-4 mb-6 sm:mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-sm">
              <ArrowLeft size={16} className="sm:w-[18px] sm:h-[18px] mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white flex items-center space-x-2">
              <Heart size={24} className="sm:w-8 sm:h-8 text-primary" fill="currentColor" />
              <span>My List</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-400 mt-1">
              {watchList.length} {watchList.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>
        </div>

        {watchList.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-lg">
            <Heart size={64} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold text-xl mb-2">Your Watchlist is Empty</h3>
            <p className="text-gray-400 text-lg mb-6 max-w-md mx-auto">
              Add movies and series to your list to watch later. Click the + button on any content card to add it.
            </p>
            <Link href="/browse">
              <Button variant="primary">Browse Content</Button>
            </Link>
          </div>
        ) : (
          <ContentCarousel
            title=""
            items={watchList.map((item) => ({
              id: item.movieId || item.seriesId || '',
              title: item.movie?.title || item.series?.title || 'Unknown',
              posterUrl: item.movie?.posterUrl || item.series?.posterUrl || '',
              type: item.movieId ? 'movie' : 'series',
              rating: item.movie?.rating || item.series?.rating,
              year: item.movie?.year || item.series?.year,
            }))}
          />
        )}
      </div>
    </div>
  )
}

