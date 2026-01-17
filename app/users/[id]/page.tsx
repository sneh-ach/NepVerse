'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { UserProfileCard } from '@/components/social/UserProfileCard'
import { ContentCard } from '@/components/content/ContentCard'
import { Film, Tv, Heart, Clock, BarChart3, Star, ListMusic, Activity } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import Link from 'next/link'

export default function UserProfilePage() {
  const params = useParams()
  const userId = params.id as string
  const { user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('watchlist')
  const [watchlist, setWatchlist] = useState<any[]>([])
  const [watchHistory, setWatchHistory] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [playlists, setPlaylists] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (activeTab === 'watchlist') {
      fetchWatchlist()
    } else if (activeTab === 'history') {
      fetchWatchHistory()
    } else if (activeTab === 'stats') {
      fetchStats()
    } else if (activeTab === 'reviews') {
      fetchReviews()
    } else if (activeTab === 'playlists') {
      fetchPlaylists()
    } else if (activeTab === 'activity') {
      fetchActivity()
    }
  }, [activeTab, userId])

  const fetchWatchlist = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/users/${userId}/watchlist`)
      if (response.ok) {
        const data = await response.json()
        setWatchlist(data)
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchWatchHistory = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/users/${userId}/watch-history`)
      if (response.ok) {
        const data = await response.json()
        setWatchHistory(data)
      }
    } catch (error) {
      console.error('Error fetching watch history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      // For other users, we'll need a public stats endpoint or show limited info
      // For now, just show basic info
      setStats({ message: 'Stats available for your own profile' })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/users/${userId}/reviews`)
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews || [])
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPlaylists = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/playlists?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setPlaylists(data.playlists || [])
      }
    } catch (error) {
      console.error('Error fetching playlists:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchActivity = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/user/activity?limit=20`)
      if (response.ok) {
        const data = await response.json()
        // Filter to this user's activities
        const userActivities = (data.activities || []).filter((a: any) => 
          a.userName.includes(userId) || a.userId === userId
        )
        setActivities(userActivities)
      }
    } catch (error) {
      console.error('Error fetching activity:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 lg:px-8">
        <UserProfileCard userId={userId} />

        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex-wrap">
              <TabsTrigger value="watchlist">
                <Heart size={18} className="mr-2" />
                Watchlist
              </TabsTrigger>
              <TabsTrigger value="history">
                <Clock size={18} className="mr-2" />
                History
              </TabsTrigger>
              <TabsTrigger value="stats">
                <BarChart3 size={18} className="mr-2" />
                Stats
              </TabsTrigger>
              <TabsTrigger value="reviews">
                <Star size={18} className="mr-2" />
                Reviews
              </TabsTrigger>
              <TabsTrigger value="playlists">
                <ListMusic size={18} className="mr-2" />
                Playlists
              </TabsTrigger>
              <TabsTrigger value="activity">
                <Activity size={18} className="mr-2" />
                Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="watchlist" className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : watchlist.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Heart size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No items in watchlist</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {watchlist.map((item) => {
                    const content = item.movie || item.series
                    if (!content) return null
                    return (
                      <ContentCard
                        key={item.id}
                        id={content.id}
                        title={content.title || 'Unknown'}
                        posterUrl={content.posterUrl || ''}
                        type={item.movie ? 'movie' : 'series'}
                        rating={content.rating ?? undefined}
                        year={content.releaseDate ? new Date(content.releaseDate).getFullYear() : undefined}
                      />
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : watchHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Clock size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No watch history</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {watchHistory.map((item) => {
                    const content = item.movie || item.series
                    if (!content) return null
                    return (
                      <ContentCard
                        key={item.id}
                        id={content.id}
                        title={content.title || 'Unknown'}
                        posterUrl={content.posterUrl || ''}
                        type={item.movie ? 'movie' : 'series'}
                        rating={content.rating ?? undefined}
                        year={content.releaseDate ? new Date(content.releaseDate).getFullYear() : undefined}
                        progress={item.progress}
                      />
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="stats" className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="bg-card rounded-xl p-8 text-center border border-gray-800">
                  <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">
                    {currentUser?.id === userId
                      ? 'View your detailed statistics in your dashboard'
                      : 'Statistics are private'}
                  </p>
                  {currentUser?.id === userId && (
                    <Link href="/dashboard/stats" className="mt-4 inline-block">
                      <button className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-light transition-colors">
                        View My Stats
                      </button>
                    </Link>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Star size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No reviews yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-card rounded-lg p-4 border border-gray-800"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                            <Star className="w-6 h-6 text-yellow-500 fill-current" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-yellow-500 font-bold">{review.rating}/5</span>
                            {review.movieId && (
                              <Link
                                href={`/movie/${review.movieId}`}
                                className="text-primary hover:text-primary-light text-sm"
                              >
                                View Movie →
                              </Link>
                            )}
                            {review.seriesId && (
                              <Link
                                href={`/series/${review.seriesId}`}
                                className="text-primary hover:text-primary-light text-sm"
                              >
                                View Series →
                              </Link>
                            )}
                          </div>
                          <p className="text-white mb-2">{review.comment}</p>
                          <p className="text-gray-500 text-xs">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="playlists" className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : playlists.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ListMusic size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No public playlists</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {playlists.map((playlist) => (
                    <Link
                      key={playlist.id}
                      href={`/playlists/${playlist.id}`}
                      className="bg-card rounded-xl overflow-hidden border border-gray-800 hover:border-primary/50 transition-all"
                    >
                      <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                        {playlist.coverImage ? (
                          <img
                            src={playlist.coverImage}
                            alt={playlist.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ListMusic className="w-16 h-16 text-gray-600" />
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-white font-semibold mb-1">{playlist.name}</h3>
                        {playlist.description && (
                          <p className="text-gray-400 text-sm line-clamp-2 mb-2">{playlist.description}</p>
                        )}
                        <p className="text-gray-500 text-xs">{playlist.itemCount} items</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Activity size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="bg-card rounded-lg p-4 border border-gray-800"
                    >
                      <p className="text-white">
                        {activity.userName} {activity.type.toLowerCase()}
                        {activity.contentId && (
                          <Link
                            href={`/${activity.contentType}/${activity.contentId}`}
                            className="text-primary hover:text-primary-light ml-2"
                          >
                            View →
                          </Link>
                        )}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}


