'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { UserPlus, UserMinus, Users, Film, Tv } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface UserProfileCardProps {
  userId: string
  showFollowButton?: boolean
}

export function UserProfileCard({ userId, showFollowButton = true }: UserProfileCardProps) {
  const { user: currentUser } = useAuth()
  const [profileUser, setProfileUser] = useState<any>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUserProfile()
  }, [userId])

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/users/${userId}/profile`)
      if (response.ok) {
        const data = await response.json()
        setProfileUser(data.user)
        setIsFollowing(data.isFollowing)
        setFollowersCount(data.followersCount)
        setFollowingCount(data.followingCount)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFollow = async () => {
    if (!currentUser) {
      toast.error('Please login to follow users')
      return
    }

    try {
      const response = await fetch('/api/social/follow', {
        method: isFollowing ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followingId: userId }),
      })

      if (!response.ok) throw new Error('Failed to follow/unfollow')

      setIsFollowing(!isFollowing)
      setFollowersCount((prev) => (isFollowing ? prev - 1 : prev + 1))
      toast.success(isFollowing ? 'Unfollowed' : 'Following')
    } catch (error) {
      toast.error('Failed to follow/unfollow')
    }
  }

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg p-6 animate-pulse">
        <div className="h-20 bg-gray-800 rounded mb-4" />
        <div className="h-4 bg-gray-800 rounded w-2/3" />
      </div>
    )
  }

  if (!profileUser) {
    return null
  }

  const userName = profileUser.profile?.firstName || profileUser.email?.split('@')[0] || 'User'
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <div className="bg-card rounded-lg p-6">
      <div className="flex items-start space-x-4">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          {profileUser.profile?.avatar ? (
            <img
              src={profileUser.profile.avatar}
              alt={userName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-primary text-2xl font-bold">{userInitial}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-white mb-1">{userName}</h3>
          {profileUser.profile?.lastName && (
            <p className="text-gray-400 text-sm mb-3">{profileUser.profile.lastName}</p>
          )}
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-1 text-gray-400">
              <Users size={16} />
              <span className="text-sm">{followersCount} followers</span>
            </div>
            <div className="flex items-center space-x-1 text-gray-400">
              <UserPlus size={16} />
              <span className="text-sm">{followingCount} following</span>
            </div>
          </div>
          {showFollowButton && currentUser && currentUser.id !== userId && (
            <Button
              variant={isFollowing ? 'outline' : 'primary'}
              onClick={handleFollow}
              size="sm"
            >
              {isFollowing ? (
                <>
                  <UserMinus size={16} className="mr-2" />
                  Unfollow
                </>
              ) : (
                <>
                  <UserPlus size={16} className="mr-2" />
                  Follow
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}


