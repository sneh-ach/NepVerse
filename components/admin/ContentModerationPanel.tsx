'use client'

import { useState, useEffect } from 'react'
import { Flag, CheckCircle, XCircle, Eye } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface ContentFlag {
  id: string
  reason: string
  description?: string
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED'
  createdAt: string
  user: {
    email: string
  }
  movie?: {
    id: string
    title: string
  }
  series?: {
    id: string
    title: string
  }
}

export function ContentModerationPanel() {
  const [flags, setFlags] = useState<ContentFlag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED'>('all')

  useEffect(() => {
    fetchFlags()
  }, [filter])

  const fetchFlags = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/content-flags?status=${filter}`)
      if (response.ok) {
        const data = await response.json()
        setFlags(data)
      }
    } catch (error) {
      toast.error('Failed to load flags')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusUpdate = async (flagId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/content-flags/${flagId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) throw new Error('Failed to update')

      toast.success('Flag status updated')
      fetchFlags()
    } catch (error) {
      toast.error('Failed to update flag')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex space-x-2">
        {(['all', 'PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === status
                ? 'bg-primary text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Flags List */}
      <div className="space-y-4">
        {flags.map((flag) => (
          <div key={flag.id} className="bg-card p-4 rounded-lg">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Flag size={20} className="text-red-400" />
                <span className="text-white font-semibold">{flag.reason}</span>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    flag.status === 'PENDING'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : flag.status === 'RESOLVED'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {flag.status}
                </span>
              </div>
            </div>

            {flag.description && (
              <p className="text-gray-400 text-sm mb-3">{flag.description}</p>
            )}

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                <p>Reported by: {flag.user.email}</p>
                <p>Content: {flag.movie?.title || flag.series?.title}</p>
                <p>Date: {new Date(flag.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="flex space-x-2">
                {flag.movie && (
                  <a
                    href={`/movie/${flag.movie.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-light"
                  >
                    <Eye size={18} />
                  </a>
                )}
                {flag.series && (
                  <a
                    href={`/series/${flag.series.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-light"
                  >
                    <Eye size={18} />
                  </a>
                )}

                {flag.status === 'PENDING' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusUpdate(flag.id, 'RESOLVED')}
                    >
                      <CheckCircle size={16} className="mr-1" />
                      Resolve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusUpdate(flag.id, 'DISMISSED')}
                    >
                      <XCircle size={16} className="mr-1" />
                      Dismiss
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


