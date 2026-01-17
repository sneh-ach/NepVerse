'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Clock, Film, Tv, TrendingUp, Award, Calendar, Target, BarChart3, Zap, Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Stats {
  totalHours: number
  totalMinutes: number
  totalItems: number
  completedItems: number
  completionRate: number
  movies: number
  series: number
  moviesPercentage: number
  seriesPercentage: number
  favoriteGenres: Array<{ name: string; count: number }>
  currentStreak: number
  mostWatchedMonth: string | null
  averageWatchTimeMinutes: number
  uniqueContent: number
  uniqueMovies: number
  uniqueSeries: number
  recentActivity: number
}

export default function StatsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    if (loading) return
    
    if (!user) {
      router.push('/login?redirect=/dashboard/stats')
      return
    }

    loadStats()
  }, [user, loading, router, loadStats])

  const loadStats = useCallback(async () => {
    try {
      setLoadingStats(true)
      const response = await fetch('/api/user/stats', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'max-age=300', // Client-side cache
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        console.error('Failed to load stats:', response.status)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }, [])

  if (loading || loadingStats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center py-12">
            <p className="text-gray-400">No watch history found. Start watching to see your statistics!</p>
            <Button
              variant="primary"
              onClick={() => router.push('/browse')}
              className="mt-4"
            >
              Browse Content
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">My Watch Statistics</h1>
          <p className="text-gray-400">Your personal viewing insights and achievements</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Hours Watched */}
          <div className="bg-card rounded-xl p-6 border border-gray-800 hover:border-primary/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-primary/20 rounded-lg">
                <Clock className="w-6 h-6 text-primary" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Total Time Watched</h3>
            <p className="text-3xl font-bold text-white">{stats.totalHours.toFixed(1)}</p>
            <p className="text-gray-500 text-sm mt-1">hours ({stats.totalMinutes.toLocaleString()} minutes)</p>
          </div>

          {/* Total Content */}
          <div className="bg-card rounded-xl p-6 border border-gray-800 hover:border-primary/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Film className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Total Content Watched</h3>
            <p className="text-3xl font-bold text-white">{stats.totalItems}</p>
            <p className="text-gray-500 text-sm mt-1">{stats.uniqueContent} unique titles</p>
          </div>

          {/* Completion Rate */}
          <div className="bg-card rounded-xl p-6 border border-gray-800 hover:border-primary/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Target className="w-6 h-6 text-green-500" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Completion Rate</h3>
            <p className="text-3xl font-bold text-white">{stats.completionRate.toFixed(1)}%</p>
            <p className="text-gray-500 text-sm mt-1">{stats.completedItems} of {stats.totalItems} completed</p>
          </div>

          {/* Watch Streak */}
          <div className="bg-card rounded-xl p-6 border border-gray-800 hover:border-primary/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <Zap className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Current Streak</h3>
            <p className="text-3xl font-bold text-white">{stats.currentStreak}</p>
            <p className="text-gray-500 text-sm mt-1">consecutive days</p>
          </div>

          {/* Movies vs Series */}
          <div className="bg-card rounded-xl p-6 border border-gray-800 hover:border-primary/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-500" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Movies vs Series</h3>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Film className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300 text-sm">Movies</span>
                </div>
                <span className="text-white font-semibold">{stats.movies} ({stats.moviesPercentage.toFixed(0)}%)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Tv className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-300 text-sm">Series</span>
                </div>
                <span className="text-white font-semibold">{stats.series} ({stats.seriesPercentage.toFixed(0)}%)</span>
              </div>
            </div>
          </div>

          {/* Average Watch Time */}
          <div className="bg-card rounded-xl p-6 border border-gray-800 hover:border-primary/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-500" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Average Watch Time</h3>
            <p className="text-3xl font-bold text-white">{stats.averageWatchTimeMinutes.toFixed(0)}</p>
            <p className="text-gray-500 text-sm mt-1">minutes per session</p>
          </div>
        </div>

        {/* Favorite Genres */}
        {stats.favoriteGenres.length > 0 && (
          <div className="bg-card rounded-xl p-6 border border-gray-800 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-white">Favorite Genres</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {stats.favoriteGenres.map((genre, index) => (
                <div
                  key={genre.name}
                  className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-primary/50 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-semibold text-sm">{genre.name}</span>
                    <span className="text-primary text-xs font-bold">#{index + 1}</span>
                  </div>
                  <p className="text-gray-400 text-xs">{genre.count} {genre.count === 1 ? 'title' : 'titles'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Most Watched Month */}
          {stats.mostWatchedMonth && (
            <div className="bg-card rounded-xl p-6 border border-gray-800">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-white">Most Active Month</h3>
              </div>
              <p className="text-2xl font-bold text-white">{stats.mostWatchedMonth}</p>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-card rounded-xl p-6 border border-gray-800">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Award className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
            </div>
            <p className="text-2xl font-bold text-white">{stats.recentActivity}</p>
            <p className="text-gray-500 text-sm mt-1">items watched in last 7 days</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap gap-4">
          <Button
            variant="primary"
            onClick={() => router.push('/browse')}
          >
            Continue Watching
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
