'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Award, Trophy, Star, Zap, Target } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Achievement {
  id: string
  type: string
  name: string
  description: string
  icon: string
  points: number
  earned: boolean
  earnedAt: string | null
}

export default function AchievementsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [totalPoints, setTotalPoints] = useState(0)
  const [earnedCount, setEarnedCount] = useState(0)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    if (loading) return
    
    if (!user) {
      router.push('/login?redirect=/dashboard/achievements')
      return
    }

    loadAchievements()
  }, [user, loading, router])

  const loadAchievements = useCallback(async () => {
    try {
      setLoadingStats(true)
      const response = await fetch('/api/user/achievements', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'max-age=600', // Client-side cache
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setAchievements(data.achievements || [])
        setTotalPoints(data.totalPoints || 0)
        setEarnedCount(data.earnedCount || 0)
      }
    } catch (error) {
      console.error('Error loading achievements:', error)
    } finally {
      setLoadingStats(false)
    }
  }, [])

  const checkAchievements = async () => {
    try {
      const response = await fetch('/api/user/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'check' }),
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.newlyAwarded && data.newlyAwarded.length > 0) {
          // Reload to show new achievements
          await loadAchievements()
          // Show notification for new achievements
          // You could add a toast here
        }
      }
    } catch (error) {
      console.error('Error checking achievements:', error)
    }
  }

  if (loading || loadingStats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const earnedAchievements = useMemo(() => achievements.filter(a => a.earned), [achievements])
  const unearnedAchievements = useMemo(() => achievements.filter(a => !a.earned), [achievements])

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Achievements</h1>
          <p className="text-gray-400">Unlock achievements by watching, reviewing, and engaging</p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-xl p-6 border border-gray-800">
            <div className="flex items-center space-x-3 mb-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <h3 className="text-gray-400 text-sm">Total Points</h3>
            </div>
            <p className="text-3xl font-bold text-white">{totalPoints}</p>
          </div>
          <div className="bg-card rounded-xl p-6 border border-gray-800">
            <div className="flex items-center space-x-3 mb-2">
              <Award className="w-6 h-6 text-primary" />
              <h3 className="text-gray-400 text-sm">Achievements Earned</h3>
            </div>
            <p className="text-3xl font-bold text-white">{earnedCount} / {achievements.length}</p>
          </div>
          <div className="bg-card rounded-xl p-6 border border-gray-800">
            <div className="flex items-center space-x-3 mb-2">
              <Target className="w-6 h-6 text-green-500" />
              <h3 className="text-gray-400 text-sm">Progress</h3>
            </div>
            <p className="text-3xl font-bold text-white">
              {achievements.length > 0 ? Math.round((earnedCount / achievements.length) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Check for new achievements */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={checkAchievements}
            className="flex items-center space-x-2"
          >
            <Zap size={16} />
            <span>Check for New Achievements</span>
          </Button>
        </div>

        {/* Earned Achievements */}
        {earnedAchievements.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center space-x-2">
              <Star className="w-6 h-6 text-yellow-500" />
              <span>Earned ({earnedAchievements.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {earnedAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="bg-card rounded-xl p-6 border-2 border-primary/50 hover:border-primary transition-all"
                >
                  <div className="flex items-start space-x-4">
                    <div className="text-4xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white font-semibold text-lg">{achievement.name}</h3>
                        <span className="text-primary text-sm font-bold">{achievement.points} pts</span>
                      </div>
                      <p className="text-gray-400 text-sm mb-2">{achievement.description}</p>
                      {achievement.earnedAt && (
                        <p className="text-gray-500 text-xs">
                          Earned {new Date(achievement.earnedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unearned Achievements */}
        {unearnedAchievements.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center space-x-2">
              <Target className="w-6 h-6 text-gray-500" />
              <span>Locked ({unearnedAchievements.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unearnedAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="bg-card rounded-xl p-6 border border-gray-800 opacity-60"
                >
                  <div className="flex items-start space-x-4">
                    <div className="text-4xl grayscale">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-500 font-semibold text-lg">{achievement.name}</h3>
                        <span className="text-gray-600 text-sm font-bold">{achievement.points} pts</span>
                      </div>
                      <p className="text-gray-600 text-sm">{achievement.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
