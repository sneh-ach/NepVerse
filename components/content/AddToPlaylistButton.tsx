'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { ListMusic, Plus, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface Playlist {
  id: string
  name: string
  itemCount: number
}

interface AddToPlaylistButtonProps {
  movieId?: string
  seriesId?: string
  className?: string
}

export function AddToPlaylistButton({ movieId, seriesId, className }: AddToPlaylistButtonProps) {
  const { user } = useAuth()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [showMenu, setShowMenu] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user && showMenu) {
      loadPlaylists()
    }
  }, [user, showMenu])

  const loadPlaylists = async () => {
    try {
      const response = await fetch('/api/playlists', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setPlaylists(data.playlists || [])
      }
    } catch (error) {
      console.error('Error loading playlists:', error)
    }
  }

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!user) {
      toast.error('Please login to add to playlist')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/playlists/${playlistId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          movieId: movieId || undefined,
          seriesId: seriesId || undefined,
        }),
      })

      if (response.ok) {
        const playlist = playlists.find(p => p.id === playlistId)
        toast.success(`Added to "${playlist?.name}"`)
        setShowMenu(false)
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to add to playlist')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to add to playlist')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center space-x-2"
        disabled={loading}
      >
        <ListMusic size={16} />
        <span>Add to Playlist</span>
      </Button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-card rounded-lg shadow-2xl border border-gray-800 z-50 max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-white font-semibold">Your Playlists</h3>
            </div>
            <div className="p-2">
              {playlists.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  <p className="text-sm mb-2">No playlists yet</p>
                  <a
                    href="/dashboard/playlists"
                    className="text-primary hover:text-primary-light text-sm"
                  >
                    Create one →
                  </a>
                </div>
              ) : (
                playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => handleAddToPlaylist(playlist.id)}
                    className="w-full text-left px-4 py-2 rounded hover:bg-gray-800 transition-colors flex items-center justify-between text-white"
                    disabled={loading}
                  >
                    <div>
                      <p className="font-medium">{playlist.name}</p>
                      <p className="text-xs text-gray-400">{playlist.itemCount} items</p>
                    </div>
                    <Plus size={16} className="text-gray-400" />
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
