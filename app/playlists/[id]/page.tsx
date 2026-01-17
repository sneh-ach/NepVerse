'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { ContentGrid } from '@/components/content/ContentGrid'
import { Button } from '@/components/ui/Button'
import { Share2, Edit, Trash2, Plus, Lock, Globe, Eye } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface PlaylistItem {
  id: string
  movie?: {
    id: string
    title: string
    posterUrl: string
  } | null
  series?: {
    id: string
    title: string
    posterUrl: string
  } | null
  order: number
  addedAt: string
}

interface Playlist {
  id: string
  name: string
  description?: string
  visibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED'
  coverImage?: string
  createdAt: string
  updatedAt: string
  userName: string
  userAvatar?: string
  isOwn: boolean
  items: PlaylistItem[]
}

export default function PlaylistDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const playlistId = params.id as string
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlaylist()
  }, [playlistId])

  const loadPlaylist = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/playlists/${playlistId}`, {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        setPlaylist(data)
      } else if (response.status === 403) {
        toast.error('This playlist is private')
        router.push('/dashboard/playlists')
      } else {
        toast.error('Playlist not found')
        router.push('/dashboard/playlists')
      }
    } catch (error) {
      console.error('Error loading playlist:', error)
      toast.error('Failed to load playlist')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!playlist?.isOwn) return

    try {
      const response = await fetch(`/api/playlists/${playlistId}/items?itemId=${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        toast.success('Item removed')
        loadPlaylist()
      } else {
        throw new Error('Failed to remove item')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove item')
    }
  }

  const handleShare = () => {
    const url = `${window.location.origin}/playlists/${playlistId}`
    navigator.clipboard.writeText(url)
    toast.success('Playlist link copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!playlist) {
    return null
  }

  const contentItems = playlist.items.map(item => ({
    id: item.movie?.id || item.series?.id || '',
    title: item.movie?.title || item.series?.title || 'Unknown',
    posterUrl: item.movie?.posterUrl || item.series?.posterUrl || '',
    type: (item.movie ? 'movie' : 'series') as 'movie' | 'series',
  }))

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-white">{playlist.name}</h1>
                {playlist.visibility === 'PUBLIC' ? (
                  <Globe className="w-5 h-5 text-green-500" />
                ) : playlist.visibility === 'UNLISTED' ? (
                  <Eye className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Lock className="w-5 h-5 text-gray-500" />
                )}
              </div>
              {playlist.description && (
                <p className="text-gray-400 mb-2">{playlist.description}</p>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>By {playlist.userName}</span>
                <span>•</span>
                <span>{playlist.items.length} {playlist.items.length === 1 ? 'item' : 'items'}</span>
                <span>•</span>
                <span>Updated {new Date(playlist.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
            {playlist.isOwn && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="flex items-center space-x-2"
                >
                  <Share2 size={16} />
                  <span>Share</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/playlists/${playlistId}/edit`)}
                  className="flex items-center space-x-2"
                >
                  <Edit size={16} />
                  <span>Edit</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Content Grid */}
        {contentItems.length === 0 ? (
          <div className="bg-card rounded-xl p-12 text-center border border-gray-800">
            <Plus className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold text-lg mb-2">Empty Playlist</h3>
            <p className="text-gray-400 mb-4">Add movies or series to this playlist</p>
            {playlist.isOwn && (
              <Button
                variant="primary"
                onClick={() => router.push('/browse')}
              >
                Browse Content
              </Button>
            )}
          </div>
        ) : (
          <ContentGrid
            title=""
            items={contentItems}
            showLoading={false}
            rows={Math.ceil(contentItems.length / 4)}
            columns={{ mobile: 2, tablet: 3, desktop: 4 }}
          />
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap gap-4">
          <Button
            variant="primary"
            onClick={() => router.push('/dashboard/playlists')}
          >
            Back to Playlists
          </Button>
        </div>
      </div>
    </div>
  )
}
