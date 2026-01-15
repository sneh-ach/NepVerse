'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { UserProfileCard } from '@/components/social/UserProfileCard'
import { ContentCard } from '@/components/content/ContentCard'
import { Film, Tv, Heart, Clock } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'

export default function UserProfilePage() {
  const params = useParams()
  const userId = params.id as string
  const { user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('watchlist')
  const [watchlist, setWatchlist] = useState<any[]>([])
  const [watchHistory, setWatchHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (activeTab === 'watchlist') {
      fetchWatchlist()
    } else if (activeTab === 'history') {
      fetchWatchHistory()
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

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 lg:px-8">
        <UserProfileCard userId={userId} />

        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="watchlist">
                <Heart size={18} className="mr-2" />
                Watchlist
              </TabsTrigger>
              <TabsTrigger value="history">
                <Clock size={18} className="mr-2" />
                Watch History
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
                  {watchlist.map((item) => (
                    <ContentCard
                      key={item.id}
                      content={item.movie || item.series}
                      type={item.movie ? 'movie' : 'series'}
                    />
                  ))}
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
                  {watchHistory.map((item) => (
                    <ContentCard
                      key={item.id}
                      content={item.movie || item.series}
                      type={item.movie ? 'movie' : 'series'}
                    />
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


