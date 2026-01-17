'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Activity, Film, Tv, Star, Heart, Users, Award, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

interface ActivityItem {
  id: string
  type: string
  userName: string
  userAvatar?: string
  contentId?: string
  contentType?: string
  metadata?: any
  createdAt: string
}

export default function ActivityPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [followingOnly, setFollowingOnly] = useState(false)
  const [loadingActivities, setLoadingActivities] = useState(true)

  useEffect(() => {
    if (loading) return
    
    if (!user) {
      router.push('/login?redirect=/dashboard/activity')
      return
    }

    loadActivities()
  }, [user, loading, router, followingOnly])

  const loadActivities = async () => {
    try {
      setLoadingActivities(true)
      const response = await fetch(`/api/user/activity?following=${followingOnly}&limit=50`, {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Error loading activities:', error)
    } finally {
      setLoadingActivities(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'WATCHED':
        return <Film className="w-5 h-5 text-blue-500" />
      case 'REVIEWED':
        return <Star className="w-5 h-5 text-yellow-500" />
      case 'ADDED_TO_LIST':
        return <Heart className="w-5 h-5 text-red-500" />
      case 'CREATED_PLAYLIST':
        return <Film className="w-5 h-5 text-purple-500" />
      case 'FOLLOWED_USER':
        return <Users className="w-5 h-5 text-green-500" />
      case 'EARNED_ACHIEVEMENT':
        return <Award className="w-5 h-5 text-yellow-500" />
      case 'SHARED_CONTENT':
        return <Share2 className="w-5 h-5 text-blue-400" />
      default:
        return <Activity className="w-5 h-5 text-gray-500" />
    }
  }

  const getActivityText = (activity: ActivityItem) => {
    const userName = activity.userName
    const metadata = activity.metadata || {}

    switch (activity.type) {
      case 'WATCHED':
        return `${userName} watched ${activity.contentType === 'movie' ? 'a movie' : 'a series'}`
      case 'REVIEWED':
        return `${userName} reviewed ${activity.contentType === 'movie' ? 'a movie' : 'a series'}`
      case 'ADDED_TO_LIST':
        return `${userName} added ${activity.contentType === 'movie' ? 'a movie' : 'a series'} to their list`
      case 'CREATED_PLAYLIST':
        return `${userName} created playlist "${metadata.playlistName || 'Untitled'}"`
      case 'FOLLOWED_USER':
        return `${userName} followed a user`
      case 'EARNED_ACHIEVEMENT':
        return `${userName} earned achievement "${metadata.achievementName || 'Achievement'}"`
      case 'SHARED_CONTENT':
        return `${userName} shared ${activity.contentType === 'movie' ? 'a movie' : 'a series'}`
      default:
        return `${userName} performed an action`
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  if (loading || loadingActivities) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Activity Feed</h1>
          <p className="text-gray-400">See what's happening in the community</p>
        </div>

        {/* Filter */}
        <div className="mb-6 flex items-center space-x-4">
          <Button
            variant={followingOnly ? 'outline' : 'primary'}
            onClick={() => setFollowingOnly(false)}
            size="sm"
          >
            All Activity
          </Button>
          <Button
            variant={followingOnly ? 'primary' : 'outline'}
            onClick={() => setFollowingOnly(true)}
            size="sm"
          >
            Following Only
          </Button>
        </div>

        {/* Activities */}
        {activities.length === 0 ? (
          <div className="bg-card rounded-xl p-12 text-center border border-gray-800">
            <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold text-lg mb-2">No Activity Yet</h3>
            <p className="text-gray-400 mb-4">
              {followingOnly
                ? 'No activity from users you follow. Start following users to see their activity!'
                : 'Start watching, reviewing, and engaging to see activity here!'}
            </p>
            {!followingOnly && (
              <Button
                variant="primary"
                onClick={() => router.push('/browse')}
              >
                Browse Content
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="bg-card rounded-xl p-6 border border-gray-800 hover:border-primary/50 transition-all"
              >
                <div className="flex items-start space-x-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {activity.userAvatar ? (
                      <img
                        src={activity.userAvatar}
                        alt={activity.userName}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary text-lg">
                          {activity.userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {getActivityIcon(activity.type)}
                      <p className="text-white">
                        {getActivityText(activity)}
                      </p>
                    </div>
                    <p className="text-gray-500 text-sm">
                      {formatTimeAgo(activity.createdAt)}
                    </p>
                    {activity.contentId && (
                      <Link
                        href={`/${activity.contentType}/${activity.contentId}`}
                        className="text-primary hover:text-primary-light text-sm mt-2 inline-block"
                      >
                        View {activity.contentType === 'movie' ? 'Movie' : 'Series'} →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap gap-4">
          <Button
            variant="primary"
            onClick={() => router.push('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
