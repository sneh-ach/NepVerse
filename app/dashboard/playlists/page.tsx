'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Plus, Edit, Trash2, Share2, Lock, Globe, Eye, Film, Tv } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Playlist {
  id: string
  name: string
  description?: string
  visibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED'
  coverImage?: string
  itemCount: number
  createdAt: string
  updatedAt: string
  isOwn: boolean
}

export default function PlaylistsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loadingPlaylists, setLoadingPlaylists] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('')
  const [newPlaylistVisibility, setNewPlaylistVisibility] = useState<'PUBLIC' | 'PRIVATE' | 'UNLISTED'>('PRIVATE')

  useEffect(() => {
    if (loading) return
    
    if (!user) {
      router.push('/login?redirect=/dashboard/playlists')
      return
    }

    loadPlaylists()
  }, [user, loading, router])

  const loadPlaylists = async () => {
    try {
      setLoadingPlaylists(true)
      const response = await fetch('/api/playlists', {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        setPlaylists(data.playlists || [])
      }
    } catch (error) {
      console.error('Error loading playlists:', error)
    } finally {
      setLoadingPlaylists(false)
    }
  }

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      toast.error('Please enter a playlist name')
      return
    }

    try {
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newPlaylistName.trim(),
          description: newPlaylistDescription.trim() || null,
          visibility: newPlaylistVisibility,
        }),
      })

      if (response.ok) {
        toast.success('Playlist created!')
        setShowCreateModal(false)
        setNewPlaylistName('')
        setNewPlaylistDescription('')
        setNewPlaylistVisibility('PRIVATE')
        loadPlaylists()
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create playlist')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create playlist')
    }
  }

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) {
      return
    }

    try {
      const response = await fetch(`/api/playlists/${playlistId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        toast.success('Playlist deleted')
        loadPlaylists()
      } else {
        throw new Error('Failed to delete playlist')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete playlist')
    }
  }

  const handleSharePlaylist = (playlistId: string) => {
    const url = `${window.location.origin}/playlists/${playlistId}`
    navigator.clipboard.writeText(url)
    toast.success('Playlist link copied to clipboard!')
  }

  if (loading || loadingPlaylists) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">My Playlists</h1>
            <p className="text-gray-400">Create and manage your custom playlists</p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Create Playlist</span>
          </Button>
        </div>

        {/* Playlists Grid */}
        {playlists.length === 0 ? (
          <div className="bg-card rounded-xl p-12 text-center border border-gray-800">
            <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold text-lg mb-2">No Playlists Yet</h3>
            <p className="text-gray-400 mb-4">Create your first playlist to organize your favorite content</p>
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
            >
              Create Playlist
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="bg-card rounded-xl overflow-hidden border border-gray-800 hover:border-primary/50 transition-all group"
              >
                <Link href={`/playlists/${playlist.id}`}>
                  <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
                    {playlist.coverImage ? (
                      <img
                        src={playlist.coverImage}
                        alt={playlist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="w-16 h-16 text-gray-600" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      {playlist.visibility === 'PUBLIC' ? (
                        <Globe className="w-5 h-5 text-green-500" />
                      ) : playlist.visibility === 'UNLISTED' ? (
                        <Eye className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <Lock className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  </div>
                </Link>
                <div className="p-4">
                  <Link href={`/playlists/${playlist.id}`}>
                    <h3 className="text-white font-semibold text-lg mb-1 hover:text-primary transition-colors">
                      {playlist.name}
                    </h3>
                  </Link>
                  {playlist.description && (
                    <p className="text-gray-400 text-sm mb-2 line-clamp-2">{playlist.description}</p>
                  )}
                  <p className="text-gray-500 text-xs mb-4">
                    {playlist.itemCount} {playlist.itemCount === 1 ? 'item' : 'items'}
                  </p>
                  {playlist.isOwn && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSharePlaylist(playlist.id)}
                        className="flex-1"
                      >
                        <Share2 size={14} className="mr-1" />
                        Share
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/playlists/${playlist.id}/edit`)}
                        className="flex-1"
                      >
                        <Edit size={14} className="mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePlaylist(playlist.id)}
                        className="text-red-500 hover:text-red-600 hover:border-red-500"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Playlist Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-card rounded-xl shadow-2xl w-full max-w-md p-6 border border-gray-800">
              <h2 className="text-2xl font-bold text-white mb-4">Create Playlist</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                  <input
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="My Favorites"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={newPlaylistDescription}
                    onChange={(e) => setNewPlaylistDescription(e.target.value)}
                    placeholder="Optional description..."
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                    maxLength={500}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Visibility</label>
                  <select
                    value={newPlaylistVisibility}
                    onChange={(e) => setNewPlaylistVisibility(e.target.value as any)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="PRIVATE">Private</option>
                    <option value="PUBLIC">Public</option>
                    <option value="UNLISTED">Unlisted</option>
                  </select>
                </div>

                <div className="flex items-center space-x-3">
                  <Button
                    variant="primary"
                    onClick={handleCreatePlaylist}
                    className="flex-1"
                  >
                    Create
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false)
                      setNewPlaylistName('')
                      setNewPlaylistDescription('')
                      setNewPlaylistVisibility('PRIVATE')
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
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
