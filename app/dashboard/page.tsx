'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { ContentCarousel } from '@/components/content/ContentCarousel'
import Link from 'next/link'
import { Settings, History, Heart, CreditCard, Crown, Zap, Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { profileStorage } from '@/lib/localStorage'
import { watchHistoryService, watchListService } from '@/lib/clientStorage'
// Removed mock data - using real API

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  interface WatchHistoryItem {
    movieId?: string
    seriesId?: string
    progress: number
    currentTime: number
    duration: number
    completed: boolean
    movie?: { title: string; posterUrl: string; rating?: number; year?: number }
    series?: { title: string; posterUrl: string; rating?: number; year?: number }
  }

  interface WatchListItem {
    movieId?: string
    seriesId?: string
    movie?: { title: string; posterUrl: string; rating?: number; year?: number }
    series?: { title: string; posterUrl: string; rating?: number; year?: number }
  }

  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([])
  const [watchList, setWatchList] = useState<WatchListItem[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [currentProfile, setCurrentProfile] = useState<{ name: string } | null>(null)
  const [recommended, setRecommended] = useState<any[]>([])

  useEffect(() => {
    if (loading) return // Wait for auth to finish loading
    
    if (!user) {
      router.push('/login?redirect=/dashboard')
      return
    }

    // Get current profile from API
    const loadCurrentProfile = async () => {
      try {
        const response = await fetch('/api/profiles/current', {
          credentials: 'include',
        })
        if (response.ok) {
          const profile = await response.json()
          if (profile) {
            setCurrentProfile(profile)
          } else {
            // No profile found - redirect to create one
            router.push('/profiles?redirect=/dashboard')
            return
          }
        } else {
          // Fallback to localStorage
          const profile = profileStorage.getCurrentProfile(user.id)
          if (!profile) {
            router.push('/profiles?redirect=/dashboard')
            return
          }
          setCurrentProfile(profile)
        }
      } catch (error) {
        // Fallback to localStorage
        try {
          const profile = profileStorage.getCurrentProfile(user.id)
          if (!profile) {
            router.push('/profiles?redirect=/dashboard')
            return
          }
          setCurrentProfile(profile)
        } catch (fallbackError) {
          router.push('/profiles?redirect=/dashboard')
        }
      }
    }
    loadCurrentProfile()
  }, [user?.id, loading]) // Only depend on user.id, not the whole user object

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        try {
          setIsLoadingData(true)
          // Use API services
          const [history, list, recommendedRes] = await Promise.all([
            watchHistoryService.getAll(),
            watchListService.getAll(),
            fetch('/api/content/recommended?limit=10'),
          ])
          
          // Handle paginated responses
          setWatchHistory(Array.isArray(history) ? history : (typeof history === 'object' && history !== null && 'history' in history ? (history as any).history : []))
          setWatchList(Array.isArray(list) ? list : (typeof list === 'object' && list !== null && 'watchList' in list ? (list as any).watchList : []))
          
          // Load recommended content
          if (recommendedRes.ok) {
            const recommendedData = await recommendedRes.json()
            setRecommended(recommendedData)
          }
        } catch (error) {
          // Error loading dashboard data - set empty arrays
          setWatchHistory([])
          setWatchList([])
          setRecommended([])
        } finally {
          setIsLoadingData(false)
        }
      }
      loadData()
    }
  }, [user])

  if (loading || isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen py-6 sm:py-8">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
            <span className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent">
              Welcome back{currentProfile?.name ? `, ${currentProfile.name}` : user.profile?.firstName ? `, ${user.profile.firstName}` : ''}!
            </span>
          </h1>
          <p className="text-sm sm:text-base text-gray-400">Manage your account and continue watching</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link
            href="/dashboard/settings"
            className="bg-card p-4 sm:p-6 rounded-lg hover:bg-card-hover transition-colors"
          >
            <Settings size={24} className="sm:w-8 sm:h-8 text-primary mb-2" />
            <h3 className="text-white font-semibold text-sm sm:text-base">Settings</h3>
            <p className="text-gray-400 text-xs sm:text-sm">Manage your profile</p>
          </Link>

          <Link
            href="/dashboard/history"
            className="bg-card p-4 sm:p-6 rounded-lg hover:bg-card-hover transition-colors"
          >
            <History size={24} className="sm:w-8 sm:h-8 text-primary mb-2" />
            <h3 className="text-white font-semibold text-sm sm:text-base">Watch History</h3>
            <p className="text-gray-400 text-xs sm:text-sm">Continue watching</p>
          </Link>

          <Link
            href="/dashboard/list"
            className="bg-card p-4 sm:p-6 rounded-lg hover:bg-card-hover transition-colors"
          >
            <Heart size={24} className="sm:w-8 sm:h-8 text-primary mb-2" />
            <h3 className="text-white font-semibold text-sm sm:text-base">My List</h3>
            <p className="text-gray-400 text-xs sm:text-sm">Saved content</p>
          </Link>

          <Link
            href="/dashboard/subscription"
            className="bg-card p-4 sm:p-6 rounded-lg hover:bg-card-hover transition-colors"
          >
            <CreditCard size={24} className="sm:w-8 sm:h-8 text-primary mb-2" />
            <h3 className="text-white font-semibold text-sm sm:text-base">Subscription</h3>
            <p className="text-gray-400 text-xs sm:text-sm">Manage plan</p>
          </Link>
        </div>

        {/* Continue Watching */}
        {watchHistory.length > 0 ? (
          <div className="mb-8">
            <ContentCarousel
              title="Continue Watching"
              items={(watchHistory || [])
                .filter((item: any) => !item.completed && item.progress > 0)
                .map((item: any) => ({
                  id: item.movieId || item.seriesId || item.id,
                  title: item.movie?.title || item.series?.title || item.movieId || item.seriesId || 'Unknown',
                  posterUrl: item.movie?.posterUrl || item.series?.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500',
                  type: item.movieId ? 'movie' : 'series',
                  progress: item.progress || 0,
                  rating: item.movie?.rating || item.series?.rating,
                  year: item.movie?.year || item.series?.year,
                }))}
            />
          </div>
        ) : (
          <div className="mb-8 bg-card p-8 rounded-lg text-center">
            <History size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold text-lg mb-2">No Watch History</h3>
            <p className="text-gray-400 mb-4">Start watching to see your progress here</p>
            <Link href="/browse">
              <Button variant="primary">Browse Content</Button>
            </Link>
          </div>
        )}

        {/* My List */}
        {watchList.length > 0 ? (
          <div className="mb-8">
            <ContentCarousel 
              title="My List"
              items={(watchList || [])
                .filter((item) => item.movieId || item.seriesId) // Filter out items without IDs
                .map((item) => ({
                  id: item.movieId || item.seriesId || '',
                  title: item.movie?.title || item.series?.title || 'Unknown',
                  posterUrl: item.movie?.posterUrl || item.series?.posterUrl || '',
                  type: (item.movieId ? 'movie' : 'series') as 'movie' | 'series',
                  rating: item.movie?.rating || item.series?.rating,
                  year: item.movie?.year || item.series?.year,
                }))}
            />
          </div>
        ) : (
          <div className="mb-8 bg-card p-8 rounded-lg text-center">
            <Heart size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold text-lg mb-2">Your List is Empty</h3>
            <p className="text-gray-400 mb-4">Add movies and series to watch later</p>
            <Link href="/browse">
              <Button variant="primary">Browse Content</Button>
            </Link>
          </div>
        )}

        {/* Recommendations - Show popular content */}
        {recommended.length > 0 && (
          <div className="mb-8">
            <ContentCarousel
              title="Recommended for You"
              items={recommended}
              showLoading={false}
            />
          </div>
        )}

        {/* Subscription Status */}
        <div className="mt-8 bg-card p-6 rounded-lg border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
            <CreditCard size={24} className="text-primary" />
            <span>Subscription Status</span>
          </h2>
          {user.subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    user.subscription.planId === 'premium' ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30' :
                    user.subscription.planId === 'standard' ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30' :
                    'bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30'
                  }`}>
                    {user.subscription.planId === 'premium' ? (
                      <Crown size={24} className="text-yellow-400" fill="currentColor" />
                    ) : user.subscription.planId === 'standard' ? (
                      <Zap size={24} className="text-blue-400" fill="currentColor" />
                    ) : (
                      <Star size={24} className="text-primary" fill="currentColor" />
                    )}
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1 uppercase tracking-wide">Current Plan</p>
                    <p className={`text-2xl font-bold capitalize ${
                      user.subscription.planId === 'premium' ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent' :
                      user.subscription.planId === 'standard' ? 'text-blue-400' :
                      'text-primary'
                    }`}>
                      {user.subscription.planId === 'basic' ? 'Basic' : 
                       user.subscription.planId === 'standard' ? 'Standard' : 
                       user.subscription.planId === 'premium' ? 'Premium' : 
                       user.subscription.planId}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm mb-1">Status</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                    user.subscription.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    user.subscription.status === 'CANCELED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {user.subscription.status}
                  </span>
                </div>
              </div>
              <Link href="/dashboard/subscription">
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  Manage Subscription
                </Button>
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-gray-400 mb-4">You don't have an active subscription.</p>
              <Link href="/pricing">
                <Button variant="primary" className="group/btn font-bold">
                  <span className="group-hover/btn:scale-105 transition-transform duration-300 inline-block">Subscribe Now</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

