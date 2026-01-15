'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { 
  Users, Film, Tv, DollarSign, TrendingUp, 
  Eye, Heart, MessageSquare, Flag, Download,
  BarChart3, Activity, Clock, Star
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Analytics {
  totalUsers: number
  totalMovies: number
  totalSeries: number
  totalRevenue: number
  activeSubscriptions: number
  totalViews: number
  totalWatchlist: number
  totalComments: number
  flaggedContent: number
  totalDownloads: number
  recentActivity: Array<{
    id: string
    type: string
    description: string
    timestamp: string
  }>
}

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // TEMPORARY: Allow access for testing - remove in production
    if (user && (user as any).role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
    fetchAnalytics()
  }, [user, router])

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // TEMPORARY: Allow access for testing - remove in production
  if (!user || (user as any).role !== 'ADMIN') {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const stats = [
    {
      label: 'Total Users',
      value: analytics?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      label: 'Total Movies',
      value: analytics?.totalMovies || 0,
      icon: Film,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
    },
    {
      label: 'Total Series',
      value: analytics?.totalSeries || 0,
      icon: Tv,
      color: 'text-pink-400',
      bgColor: 'bg-pink-400/10',
    },
    {
      label: 'Total Revenue',
      value: `NPR ${(analytics?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
    },
    {
      label: 'Active Subscriptions',
      value: analytics?.activeSubscriptions || 0,
      icon: TrendingUp,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
    },
    {
      label: 'Total Views',
      value: (analytics?.totalViews || 0).toLocaleString(),
      icon: Eye,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-400/10',
    },
    {
      label: 'Watchlist Items',
      value: analytics?.totalWatchlist || 0,
      icon: Heart,
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
    },
    {
      label: 'Comments',
      value: analytics?.totalComments || 0,
      icon: MessageSquare,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-400/10',
    },
    {
      label: 'Flagged Content',
      value: analytics?.flaggedContent || 0,
      icon: Flag,
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10',
    },
    {
      label: 'Downloads',
      value: analytics?.totalDownloads || 0,
      icon: Download,
      color: 'text-teal-400',
      bgColor: 'bg-teal-400/10',
    },
  ]

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">Overview of your platform</p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="primary"
              onClick={() => router.push('/admin/content')}
            >
              Manage Content
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/moderation')}
            >
              Content Moderation
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className={`${stat.bgColor} rounded-lg p-6 border border-gray-800`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`${stat.color} w-6 h-6`} />
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            )
          })}
        </div>

        {/* Recent Activity */}
        <div className="bg-card rounded-lg p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Activity className="mr-2" size={24} />
              Recent Activity
            </h2>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
              analytics.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center space-x-4 p-3 bg-gray-900 rounded-lg"
                >
                  <Clock size={16} className="text-gray-400" />
                  <div className="flex-1">
                    <p className="text-white text-sm">{activity.description}</p>
                    <p className="text-gray-500 text-xs">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Activity size={48} className="mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

