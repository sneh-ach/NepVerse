'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Plus, Film, Tv, Upload, Calendar, Image as ImageIcon, X, Edit, Trash2, Eye, EyeOff, Star, Clock, Users, Tag, AlertTriangle, Video, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate, formatFileSize, formatDuration } from '@/lib/utils'
import Link from 'next/link'

type ContentType = 'movie' | 'series'
type TabType = 'movies' | 'series' | 'upload'

interface ContentItem {
  id: string
  title: string
  titleNepali?: string
  description: string
  descriptionNepali?: string
  posterUrl: string
  backdropUrl?: string
  releaseDate: string
  duration?: number
  rating?: number
  ageRating?: string
  quality?: string
  cast?: string
  matureThemes?: string
  tags?: string
  isPublished: boolean
  isFeatured: boolean
  type: ContentType
  genres?: Array<{ name: string }>
  viewCount?: number
}

export default function AdminContentPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('movies')
  const [movies, setMovies] = useState<ContentItem[]>([])
  const [series, setSeries] = useState<ContentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/admin/content')
      return
    }

    if (user) {
      fetchContent()
    }
  }, [user, loading, router])

  const fetchContent = async () => {
    try {
      setIsLoading(true)
      const [moviesRes, seriesRes] = await Promise.all([
        fetch('/api/admin/content/movies'),
        fetch('/api/admin/content/series'),
      ])

      if (moviesRes.ok) {
        const moviesData = await moviesRes.json()
        setMovies(moviesData.map((m: any) => ({
          ...m,
          type: 'movie' as ContentType,
          releaseDate: m.releaseDate,
        })))
      }

      if (seriesRes.ok) {
        const seriesData = await seriesRes.json()
        setSeries(seriesData.map((s: any) => ({
          ...s,
          type: 'series' as ContentType,
          releaseDate: s.releaseDate,
        })))
      }
    } catch (error) {
      console.error('Error fetching content:', error)
      toast.error('Failed to load content')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTogglePublish = async (id: string, type: ContentType, currentStatus: boolean) => {
    try {
      const endpoint = type === 'movie' ? `/api/admin/content/movies/${id}` : `/api/admin/content/series/${id}`
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !currentStatus }),
      })

      if (!response.ok) throw new Error('Failed to update')

      toast.success(currentStatus ? 'Content unpublished' : 'Content published')
      fetchContent()
    } catch (error) {
      toast.error('Failed to update content')
    }
  }

  const handleDelete = async (id: string, type: ContentType) => {
    if (!confirm('Are you sure you want to delete this content?')) return

    try {
      const endpoint = type === 'movie' ? `/api/admin/content/movies/${id}` : `/api/admin/content/series/${id}`
      const response = await fetch(endpoint, { method: 'DELETE' })

      if (!response.ok) throw new Error('Failed to delete')

      toast.success('Content deleted')
      fetchContent()
    } catch (error) {
      toast.error('Failed to delete content')
    }
  }

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const currentContent = activeTab === 'movies' ? movies : series

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Content Management</h1>
            <p className="text-gray-400">Manage movies, series, and upload new content</p>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              setEditingContent(null)
              setShowUploadModal(true)
            }}
          >
            <Plus size={20} className="mr-2" />
            Upload Content
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-gray-800">
          {(['movies', 'series', 'upload'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'movies' && <Film size={18} className="inline mr-2" />}
              {tab === 'series' && <Tv size={18} className="inline mr-2" />}
              {tab === 'upload' && <Upload size={18} className="inline mr-2" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
          <a
            href="/admin/content/bulk-import"
            className="px-6 py-3 font-semibold text-gray-400 hover:text-white transition-colors ml-auto"
          >
            Bulk Import
          </a>
        </div>

        {/* Content List - Enhanced with visible info */}
        {activeTab !== 'upload' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentContent.map((item) => (
              <div
                key={item.id}
                className="bg-card rounded-lg overflow-hidden hover:bg-card-hover transition-all hover:scale-105 hover:shadow-2xl"
              >
                <div className="relative aspect-[2/3] bg-gray-800">
                  <img
                    src={item.posterUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-poster.jpg'
                    }}
                  />
                  <div className="absolute top-2 right-2 flex flex-col space-y-1">
                    {item.isPublished ? (
                      <span className="bg-green-500/90 text-white text-xs px-2 py-1 rounded">Published</span>
                    ) : (
                      <span className="bg-gray-500/90 text-white text-xs px-2 py-1 rounded">Draft</span>
                    )}
                    {item.isFeatured && (
                      <span className="bg-yellow-500/90 text-white text-xs px-2 py-1 rounded">Featured</span>
                    )}
                  </div>
                  {/* Rating overlay - always visible */}
                  {item.rating && item.rating > 0 && (() => {
                    // ALWAYS convert from 10-point scale (database) to 5-point scale (display)
                    const ratingNum = Number(item.rating)
                    // Handle both old 10-point scale and new 5-point scale ratings
                    const displayRating = isNaN(ratingNum) ? '0.0' : (ratingNum > 5 ? (ratingNum / 2).toFixed(1) : ratingNum.toFixed(1))
                    return (
                      <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded flex items-center space-x-1">
                        <Star size={14} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-white text-sm font-bold">{displayRating}</span>
                        <span className="text-gray-400 text-xs">/5</span>
                      </div>
                    )
                  })()}
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold mb-1 truncate">{item.title}</h3>
                  {item.titleNepali && (
                    <p className="text-gray-400 text-sm mb-2 truncate">{item.titleNepali}</p>
                  )}
                  {/* Info always visible - no hover needed */}
                  <div className="flex items-center space-x-3 mb-3 text-xs text-gray-400">
                    <span>{new Date(item.releaseDate).getFullYear()}</span>
                    {item.duration && (
                      <>
                        <span>•</span>
                        <span>{Math.floor(item.duration / 60)}h {item.duration % 60}m</span>
                      </>
                    )}
                    {item.quality && (
                      <>
                        <span>•</span>
                        <span className="text-primary">{item.quality}</span>
                      </>
                    )}
                    {item.ageRating && (
                      <>
                        <span>•</span>
                        <span>{item.ageRating}</span>
                      </>
                    )}
                  </div>
                  {/* Genres visible */}
                  {item.genres && item.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.genres.slice(0, 2).map((genre: any, idx: number) => (
                        <span key={idx} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                          {genre.name || genre}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingContent(item)
                        setShowEditModal(true)
                      }}
                      className="flex-1"
                    >
                      <Edit size={14} className="mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTogglePublish(item.id, item.type, item.isPublished)}
                    >
                      {item.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item.id, item.type)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <ContentUploadForm
            onSuccess={() => {
              fetchContent()
              setActiveTab('movies')
            }}
            uploadProgress={uploadProgress}
            setUploadProgress={setUploadProgress}
          />
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <ContentUploadModal
            isOpen={showUploadModal}
            onClose={() => setShowUploadModal(false)}
            onSuccess={() => {
              setShowUploadModal(false)
              fetchContent()
            }}
            editingContent={editingContent}
          />
        )}

        {/* Edit Modal */}
        {showEditModal && editingContent && (
          <ContentEditModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false)
              setEditingContent(null)
            }}
            content={editingContent}
            onSuccess={() => {
              setShowEditModal(false)
              setEditingContent(null)
              fetchContent()
            }}
          />
        )}
      </div>
    </div>
  )
}

// Enhanced Content Upload Form with all new fields
function ContentUploadForm({
  onSuccess,
  uploadProgress,
  setUploadProgress,
}: {
  onSuccess: () => void
  uploadProgress: number
  setUploadProgress: (progress: number) => void
}) {
  const [contentType, setContentType] = useState<'movie' | 'series'>('movie')
  const [formData, setFormData] = useState({
    title: '',
    titleNepali: '',
    description: '',
    descriptionNepali: '',
    releaseDate: '',
    duration: '',
    rating: '',
    ageRating: 'PG',
    quality: 'HD',
    cast: '',
    matureThemes: '',
    tags: '',
    isPublished: false,
    isFeatured: false,
    publishDate: '',
  })
  const [files, setFiles] = useState({
    poster: null as File | null,
    backdrop: null as File | null,
    video: null as File | null,
    trailer: null as File | null,
  })
  const [fileSizes, setFileSizes] = useState({
    poster: '',
    backdrop: '',
    video: '',
    trailer: '',
  })
  const [isUploading, setIsUploading] = useState(false)
  const [detectingDuration, setDetectingDuration] = useState(false)
  const [availableGenres, setAvailableGenres] = useState<Array<{ id: string; name: string }>>([])
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)

  // Load genres on mount
  useEffect(() => {
    const loadGenres = async () => {
      try {
        const res = await fetch('/api/genres')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            setAvailableGenres(data)
          }
        }
      } catch (error) {
        console.error('Error loading genres:', error)
      }
    }
    loadGenres()
  }, [])

  // Auto-detect video duration
  const detectVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src)
        const duration = Math.floor(video.duration / 60) // Convert to minutes
        resolve(duration)
      }
      
      video.onerror = () => {
        window.URL.revokeObjectURL(video.src)
        reject(new Error('Could not load video metadata'))
      }
      
      video.src = URL.createObjectURL(file)
    })
  }

  const handleFileChange = async (field: keyof typeof files, file: File | null) => {
    setFiles((prev) => ({ ...prev, [field]: file }))
    
    if (file) {
      // Update file size display
      setFileSizes((prev) => ({ ...prev, [field]: formatFileSize(file.size) }))
      
      // Auto-detect duration for video files
      if (field === 'video' && contentType === 'movie' && file.type.startsWith('video/')) {
        setDetectingDuration(true)
        try {
          const duration = await detectVideoDuration(file)
          setFormData((prev) => ({ ...prev, duration: duration.toString() }))
          toast.success(`Auto-detected duration: ${duration} minutes`)
        } catch (error) {
          console.error('Failed to detect duration:', error)
          toast.error('Could not auto-detect duration. Please enter manually.')
        } finally {
          setDetectingDuration(false)
        }
      }
    } else {
      setFileSizes((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formDataToSend = new FormData()
      
      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== false) {
          formDataToSend.append(key, String(value))
        }
      })
      
      formDataToSend.append('contentType', contentType)
      
      // Add genres as JSON array
      if (selectedGenres.length > 0) {
        formDataToSend.append('genres', JSON.stringify(selectedGenres))
      }
      
      // Add files
      if (files.poster) formDataToSend.append('poster', files.poster)
      if (files.backdrop) formDataToSend.append('backdrop', files.backdrop)
      if (files.video) formDataToSend.append('video', files.video)
      if (files.trailer) formDataToSend.append('trailer', files.trailer)

      const response = await fetch('/api/admin/content/upload', {
        method: 'POST',
        body: formDataToSend,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Upload failed')
      }

      toast.success('Content uploaded successfully!')
      // Reset form
      setFormData({
        title: '',
        titleNepali: '',
        description: '',
        descriptionNepali: '',
        releaseDate: '',
        duration: '',
        rating: '',
        ageRating: 'PG',
        quality: 'HD',
        cast: '',
        matureThemes: '',
        tags: '',
        isPublished: false,
        isFeatured: false,
        publishDate: '',
      })
      setFiles({
        poster: null,
        backdrop: null,
        video: null,
        trailer: null,
      })
      setFileSizes({
        poster: '',
        backdrop: '',
        video: '',
        trailer: '',
      })
      setSelectedGenres([])
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Upload failed')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="bg-card rounded-lg p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Content Type */}
        <div>
          <label className="block text-white font-semibold mb-2">Content Type</label>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setContentType('movie')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                contentType === 'movie'
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-700 bg-gray-800/50'
              }`}
            >
              <Film size={24} className="mx-auto mb-2 text-primary" />
              <span className="text-white font-semibold">Movie</span>
            </button>
            <button
              type="button"
              onClick={() => setContentType('series')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                contentType === 'series'
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-700 bg-gray-800/50'
              }`}
            >
              <Tv size={24} className="mx-auto mb-2 text-primary" />
              <span className="text-white font-semibold">Series</span>
            </button>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Title (English) *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="Enter title"
          />
          <Input
            label="Title (Nepali)"
            value={formData.titleNepali}
            onChange={(e) => setFormData({ ...formData, titleNepali: e.target.value })}
            placeholder="Enter Nepali title"
          />
        </div>

        <div>
          <label className="block text-white font-semibold mb-2">Description *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            rows={4}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
            placeholder="Enter description"
          />
        </div>

        <div>
          <label className="block text-white font-semibold mb-2">Description (Nepali)</label>
          <textarea
            value={formData.descriptionNepali}
            onChange={(e) => setFormData({ ...formData, descriptionNepali: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
            placeholder="Enter Nepali description"
          />
        </div>

        {/* Release Date, Duration, Rating */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            type="date"
            label="Release Date *"
            value={formData.releaseDate}
            onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
            required
          />
          {contentType === 'movie' && (
            <div>
              <label className="block text-white font-semibold mb-2">
                Duration (minutes) *
                {detectingDuration && <span className="ml-2 text-xs text-primary">Detecting...</span>}
              </label>
              <Input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
                placeholder="Auto-detected from video"
                disabled={detectingDuration}
              />
              <p className="text-xs text-gray-500 mt-1">Will auto-detect from video file</p>
            </div>
          )}
          <div>
            <label className="block text-white font-semibold mb-2">Rating (out of 5) *</label>
            <Input
              type="number"
              value={formData.rating}
              onChange={(e) => {
                const value = e.target.value
                // Ensure value is between 0 and 5
                if (value === '') {
                  setFormData({ ...formData, rating: '' })
                  return
                }
                const numValue = parseFloat(value)
                if (!isNaN(numValue)) {
                  // Clamp between 0 and 5
                  const clampedValue = Math.min(5, Math.max(0, numValue))
                  setFormData({ ...formData, rating: clampedValue.toFixed(1) })
                }
              }}
              min="0"
              max="5"
              step="0.1"
              placeholder="4.5"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Enter rating from 0 to 5</p>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="border-t border-gray-800 pt-6">
          <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
            <Info size={20} />
            <span>Additional Information</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-semibold mb-2">Quality</label>
              <select
                value={formData.quality}
                onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary"
              >
                <option value="">Select Quality</option>
                <option value="480p">480p SD</option>
                <option value="720p">720p HD</option>
                <option value="1080p">1080p Full HD</option>
                <option value="4K">4K Ultra HD</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Required for quality filtering</p>
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">Age Rating</label>
              <select
                value={formData.ageRating}
                onChange={(e) => setFormData({ ...formData, ageRating: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary"
              >
                <option value="G">G - General</option>
                <option value="PG">PG - Parental Guidance</option>
                <option value="PG-13">PG-13</option>
                <option value="R">R - Restricted</option>
                <option value="18+">18+</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Required for age rating filtering</p>
            </div>
            <div>
              <label className="block text-white font-semibold mb-2 flex items-center space-x-2">
                <Users size={16} />
                <span>Cast</span>
              </label>
              <Input
                value={formData.cast}
                onChange={(e) => setFormData({ ...formData, cast: e.target.value })}
                placeholder="Ajay Devgn, Rakul Preet Singh, R. Madhavan"
              />
              <p className="text-xs text-gray-500 mt-1">Comma-separated names</p>
            </div>
            <div>
              <label className="block text-white font-semibold mb-2 flex items-center space-x-2">
                <AlertTriangle size={16} />
                <span>Mature Themes</span>
              </label>
              <Input
                value={formData.matureThemes}
                onChange={(e) => setFormData({ ...formData, matureThemes: e.target.value })}
                placeholder="mature themes, violence, language"
              />
              <p className="text-xs text-gray-500 mt-1">Comma-separated themes</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-white font-semibold mb-2 flex items-center space-x-2">
                <Tag size={16} />
                <span>Tags / Attributes</span>
              </label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Irreverent, Romantic, Suspenseful"
              />
              <p className="text-xs text-gray-500 mt-1">Comma-separated tags (e.g., "This Movie Is: Irreverent")</p>
            </div>
          </div>
        </div>

        {/* Genres Selection */}
        <div className="border-t border-gray-800 pt-6">
          <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
            <Tag size={20} />
            <span>Genres *</span>
          </h3>
          <div className="flex flex-wrap gap-2 p-3 bg-gray-900 border border-gray-700 rounded-lg min-h-[60px]">
            {availableGenres.length === 0 ? (
              <p className="text-gray-500 text-sm">Loading genres...</p>
            ) : (
              availableGenres.map((genre) => {
                const isSelected = selectedGenres.includes(genre.id)
                return (
                  <button
                    key={genre.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedGenres(selectedGenres.filter((id) => id !== genre.id))
                      } else {
                        setSelectedGenres([...selectedGenres, genre.id])
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-primary text-white border-2 border-primary'
                        : 'bg-gray-800 text-gray-300 border-2 border-gray-700 hover:border-primary/50'
                    }`}
                  >
                    {genre.name}
                  </button>
                )
              })
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">Select one or more genres (required for filtering)</p>
        </div>

        {/* File Uploads with Size Display */}
        <div className="border-t border-gray-800 pt-6">
          <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
            <Upload size={20} />
            <span>Media Files</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-semibold mb-2">Poster Image *</label>
              <FileUpload
                file={files.poster}
                onChange={(file) => handleFileChange('poster', file)}
                accept="image/*"
                label="Upload Poster"
                fileSize={fileSizes.poster}
                recommendedSize="800x1200px"
              />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">Backdrop Image</label>
              <FileUpload
                file={files.backdrop}
                onChange={(file) => handleFileChange('backdrop', file)}
                accept="image/*"
                label="Upload Backdrop"
                fileSize={fileSizes.backdrop}
                recommendedSize="1920x1080px"
              />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">Video File *</label>
              <FileUpload
                file={files.video}
                onChange={(file) => handleFileChange('video', file)}
                accept="video/*"
                label="Upload Video"
                fileSize={fileSizes.video}
                recommendedSize="MP4, MKV, or M3U8"
              />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">Trailer Video</label>
              <FileUpload
                file={files.trailer}
                onChange={(file) => handleFileChange('trailer', file)}
                accept="video/*"
                label="Upload Trailer"
                fileSize={fileSizes.trailer}
                recommendedSize="MP4 format"
              />
            </div>
          </div>
        </div>

        {/* Publishing Options */}
        <div className="border-t border-gray-800 pt-6">
          <h3 className="text-white font-semibold mb-4">Publishing Options</h3>
          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="w-5 h-5 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary"
              />
              <span className="text-white">Publish immediately</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="w-5 h-5 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary"
              />
              <span className="text-white">Feature on homepage</span>
            </label>
            <Input
              type="datetime-local"
              label="Schedule Publish Date (optional)"
              value={formData.publishDate}
              onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
            />
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-sm">Uploading...</span>
              <span className="text-gray-400 text-sm">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <Button type="submit" variant="primary" className="w-full" isLoading={isUploading}>
          <Upload size={20} className="mr-2" />
          Upload Content
        </Button>
      </form>
    </div>
  )
}

// Enhanced File Upload Component with size display
function FileUpload({
  file,
  onChange,
  accept,
  label,
  fileSize,
  recommendedSize,
}: {
  file: File | null
  onChange: (file: File | null) => void
  accept: string
  label: string
  fileSize?: string
  recommendedSize?: string
}) {
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      onChange(selectedFile)
    }
  }

  return (
    <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 hover:border-primary transition-colors">
      <input
        type="file"
        id={`file-${label}`}
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
      <label
        htmlFor={`file-${label}`}
        className="cursor-pointer flex flex-col items-center justify-center"
      >
        {file ? (
          <>
            <ImageIcon size={32} className="text-primary mb-2" />
            <p className="text-white text-sm font-semibold truncate max-w-full">{file.name}</p>
            <p className="text-primary text-xs mt-1 font-semibold">
              {fileSize || formatFileSize(file.size)}
            </p>
            {recommendedSize && (
              <p className="text-gray-500 text-xs mt-1">Recommended: {recommendedSize}</p>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange(null)
              }}
              className="mt-2 text-red-400 hover:text-red-300 text-sm"
            >
              Remove
            </button>
          </>
        ) : (
          <>
            <Upload size={32} className="text-gray-500 mb-2" />
            <p className="text-white text-sm font-semibold">{label}</p>
            {recommendedSize && (
              <p className="text-gray-500 text-xs mt-1">Recommended: {recommendedSize}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">Click to select file</p>
          </>
        )}
      </label>
    </div>
  )
}

// Content Upload Modal
function ContentUploadModal({
  isOpen,
  onClose,
  onSuccess,
  editingContent,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editingContent: ContentItem | null
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6">
          {editingContent ? 'Edit Content' : 'Upload New Content'}
        </h2>
        <ContentUploadForm
          onSuccess={() => {
            onSuccess()
            onClose()
          }}
          uploadProgress={0}
          setUploadProgress={() => {}}
        />
      </div>
    </Modal>
  )
}

// Comprehensive Edit Modal - ALL fields editable
function ContentEditModal({
  isOpen,
  onClose,
  content,
  onSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  content: ContentItem
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    title: content.title,
    titleNepali: content.titleNepali || '',
    description: content.description,
    descriptionNepali: content.descriptionNepali || '',
    releaseDate: new Date(content.releaseDate).toISOString().split('T')[0],
    duration: content.duration?.toString() || '',
    rating: content.rating ? (content.rating > 5 ? (content.rating / 2).toFixed(1) : content.rating.toFixed(1)) : '',
    ageRating: content.ageRating || 'PG',
    quality: content.quality || 'HD',
    cast: content.cast || '',
    matureThemes: content.matureThemes || '',
    tags: content.tags || '',
    genres: content.genres?.map((g: any) => g.id || g) || [],
    isPublished: content.isPublished,
    isFeatured: content.isFeatured,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [availableGenres, setAvailableGenres] = useState<Array<{ id: string; name: string }>>([])
  const [showPreview, setShowPreview] = useState(false)
  const [files, setFiles] = useState({
    poster: null as File | null,
    backdrop: null as File | null,
    video: null as File | null,
    trailer: null as File | null,
  })
  const [currentFiles, setCurrentFiles] = useState({
    posterUrl: content.posterUrl,
    backdropUrl: content.backdropUrl || '',
    videoUrl: '',
    trailerUrl: '',
  })
  const [fileSizes, setFileSizes] = useState({
    poster: '',
    backdrop: '',
    video: '',
    trailer: '',
  })
  const [previewUrls, setPreviewUrls] = useState<{
    poster?: string
    backdrop?: string
  }>({})
  const previewUrlsRef = useRef<{ poster?: string; backdrop?: string }>({})

  // Fetch full content data and genres when modal opens
  useEffect(() => {
    if (isOpen && content.id) {
      // Reset files when modal opens
      setFiles({
        poster: null,
        backdrop: null,
        video: null,
        trailer: null,
      })
      setFileSizes({
        poster: '',
        backdrop: '',
        video: '',
        trailer: '',
      })
      setPreviewUrls({})

      const fetchData = async () => {
        try {
          // Fetch content
          const endpoint = content.type === 'movie' 
            ? `/api/admin/content/movies/${content.id}`
            : `/api/admin/content/series/${content.id}`
          
          const [contentRes, genresRes] = await Promise.all([
            fetch(endpoint),
            fetch('/api/genres', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            }),
          ])
          
          if (contentRes.ok) {
            const fullContent = await contentRes.json()
            // Handle both old 10-point and new 5-point scale ratings
            let ratingValue = ''
            if (fullContent.rating !== null && fullContent.rating !== undefined) {
              const ratingNum = typeof fullContent.rating === 'string' ? parseFloat(fullContent.rating) : fullContent.rating
              if (!isNaN(ratingNum)) {
                // If > 5, it's old 10-point scale, convert it
                ratingValue = ratingNum > 5 ? (ratingNum / 2).toFixed(1) : ratingNum.toFixed(1)
              }
            }
            setFormData({
              title: fullContent.title,
              titleNepali: fullContent.titleNepali || '',
              description: fullContent.description,
              descriptionNepali: fullContent.descriptionNepali || '',
              releaseDate: new Date(fullContent.releaseDate).toISOString().split('T')[0],
              duration: fullContent.duration?.toString() || '',
              rating: ratingValue,
              ageRating: fullContent.ageRating || 'PG',
              quality: fullContent.quality || 'HD',
              cast: fullContent.cast || '',
              matureThemes: fullContent.matureThemes || '',
              tags: fullContent.tags || '',
              genres: fullContent.genres?.map((g: any) => g.id) || [],
              isPublished: fullContent.isPublished,
              isFeatured: fullContent.isFeatured,
            })
            // Set current file URLs
            setCurrentFiles({
              posterUrl: fullContent.posterUrl || content.posterUrl || '',
              backdropUrl: fullContent.backdropUrl || content.backdropUrl || '',
              videoUrl: fullContent.videoUrl || '',
              trailerUrl: fullContent.trailerUrl || '',
            })
          } else {
            console.error('Failed to fetch content:', contentRes.status, contentRes.statusText)
          }
          
          if (genresRes.ok) {
            const genres = await genresRes.json()
            console.log('Fetched genres:', genres)
            if (Array.isArray(genres) && genres.length > 0) {
              setAvailableGenres(genres)
            } else {
              console.warn('No genres found in response or empty array')
              setAvailableGenres([])
            }
          } else {
            console.error('Failed to fetch genres:', genresRes.status, genresRes.statusText)
            const errorText = await genresRes.text()
            console.error('Genres API error:', errorText)
            toast.error('Failed to load genres. Please refresh the page.')
            setAvailableGenres([])
          }
        } catch (error) {
          console.error('Failed to fetch data:', error)
          toast.error('Failed to load content data')
        } finally {
          setIsLoading(false)
        }
      }
      fetchData()
    }

    // Cleanup preview URLs on unmount
    return () => {
      Object.values(previewUrlsRef.current).forEach(url => {
        if (url) URL.revokeObjectURL(url)
      })
      previewUrlsRef.current = {}
    }
  }, [isOpen, content.id, content.type])

  // Ensure rating is always on 5-point scale (safety check - clamp to 0-5)
  useEffect(() => {
    if (formData.rating && formData.rating !== '') {
      const ratingNum = parseFloat(formData.rating)
      if (!isNaN(ratingNum)) {
        // Clamp rating between 0 and 5
        if (ratingNum > 5) {
          setFormData(prev => ({
            ...prev,
            rating: '5.0'
          }))
        } else if (ratingNum < 0) {
          setFormData(prev => ({
            ...prev,
            rating: '0.0'
          }))
        }
      }
    }
  }, [formData.rating])

  const handleFileChange = (field: keyof typeof files, file: File | null) => {
    // Cleanup old preview URL if exists
    const oldUrl = previewUrlsRef.current[field as 'poster' | 'backdrop']
    if (oldUrl) {
      URL.revokeObjectURL(oldUrl)
      delete previewUrlsRef.current[field as 'poster' | 'backdrop']
    }
    
    setFiles((prev) => ({ ...prev, [field]: file }))
    if (file) {
      setFileSizes((prev) => ({ ...prev, [field]: formatFileSize(file.size) }))
      // Create preview URL for images
      if (field === 'poster' || field === 'backdrop') {
        const url = URL.createObjectURL(file)
        previewUrlsRef.current[field] = url
        setPreviewUrls((prev) => ({ ...prev, [field]: url }))
      }
    } else {
      setFileSizes((prev) => ({ ...prev, [field]: '' }))
      setPreviewUrls((prev) => {
        const newUrls = { ...prev }
        delete newUrls[field as 'poster' | 'backdrop']
        return newUrls
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const endpoint = content.type === 'movie' 
        ? `/api/admin/content/movies/${content.id}`
        : `/api/admin/content/series/${content.id}`

      // Check if we have files to upload - if so, use FormData
      const hasFiles = files.poster || files.backdrop || files.video || files.trailer

      if (hasFiles) {
        // Use FormData for file uploads
        const formDataToSend = new FormData()
        
        // Add all form fields
        formDataToSend.append('title', formData.title)
        if (formData.titleNepali) formDataToSend.append('titleNepali', formData.titleNepali)
        formDataToSend.append('description', formData.description)
        if (formData.descriptionNepali) formDataToSend.append('descriptionNepali', formData.descriptionNepali)
        formDataToSend.append('releaseDate', formData.releaseDate)
        if (formData.rating) formDataToSend.append('rating', parseFloat(formData.rating).toString())
        formDataToSend.append('ageRating', formData.ageRating)
        if (formData.quality) formDataToSend.append('quality', formData.quality)
        if (formData.cast) formDataToSend.append('cast', formData.cast)
        if (formData.matureThemes) formDataToSend.append('matureThemes', formData.matureThemes)
        if (formData.tags) formDataToSend.append('tags', formData.tags)
        formDataToSend.append('isPublished', formData.isPublished.toString())
        formDataToSend.append('isFeatured', formData.isFeatured.toString())
        
        // Add genres as JSON array
        if (formData.genres.length > 0) {
          formDataToSend.append('genres', JSON.stringify(formData.genres))
        }
        
        if (content.type === 'movie' && formData.duration) {
          formDataToSend.append('duration', formData.duration)
        }

        // Add files if provided
        if (files.poster) formDataToSend.append('poster', files.poster)
        if (files.backdrop) formDataToSend.append('backdrop', files.backdrop)
        if (files.video) formDataToSend.append('video', files.video)
        if (files.trailer) formDataToSend.append('trailer', files.trailer)

        const response = await fetch(endpoint, {
          method: 'PATCH',
          credentials: 'include',
          body: formDataToSend,
        })

        if (!response.ok) {
          let errorMessage = 'Failed to update content'
          try {
            const errorData = await response.json()
            errorMessage = errorData.message || errorMessage
          } catch (e) {
            errorMessage = response.statusText || errorMessage
          }
          throw new Error(errorMessage)
        }

        toast.success('Content updated successfully')
        onSuccess()
      } else {
        // Use JSON for metadata-only updates
        const updateData: any = {
          title: formData.title,
          titleNepali: formData.titleNepali || null,
          description: formData.description,
          descriptionNepali: formData.descriptionNepali || null,
          releaseDate: formData.releaseDate,
          rating: formData.rating ? parseFloat(formData.rating) : null,
          ageRating: formData.ageRating,
          quality: formData.quality || null,
          cast: formData.cast || null,
          matureThemes: formData.matureThemes || null,
          tags: formData.tags || null,
          genres: formData.genres || [],
          isPublished: formData.isPublished,
          isFeatured: formData.isFeatured,
        }
        
        if (content.type === 'movie') {
          if (formData.duration) {
            updateData.duration = parseInt(formData.duration)
          } else {
            toast.error('Duration is required for movies')
            setIsSaving(false)
            return
          }
        }

        const response = await fetch(endpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updateData),
        })

        if (!response.ok) {
          let errorMessage = 'Failed to update content'
          try {
            const errorData = await response.json()
            errorMessage = errorData.message || errorMessage
          } catch (e) {
            errorMessage = response.statusText || errorMessage
          }
          throw new Error(errorMessage)
        }

        toast.success('Content updated successfully')
        onSuccess()
      }
    } catch (error: any) {
      console.error('Update error:', error)
      toast.error(error.message || 'Failed to update content')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Edit Content</h2>
          <div className="flex items-center space-x-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? <EyeOff size={16} className="mr-2" /> : <Eye size={16} className="mr-2" />}
              {showPreview ? 'Hide Preview' : 'Preview'}
            </Button>
            <Link 
              href={`/${content.type}/${content.id}`}
              target="_blank"
              className="text-primary hover:text-primary-light text-sm"
            >
              View Page →
            </Link>
          </div>
        </div>

        {/* Preview Section */}
        {showPreview && (
          <div className="border border-primary/30 rounded-lg p-6 bg-gray-900/50 mb-6">
            <h3 className="text-white font-semibold mb-4">Preview</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                  {(previewUrls.poster || currentFiles.posterUrl || content.posterUrl) && (
                  <img
                    src={previewUrls.poster || currentFiles.posterUrl || content.posterUrl}
                    alt={formData.title}
                    className="w-24 h-36 object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-poster.jpg'
                    }}
                  />
                )}
                <div className="flex-1">
                  <h4 className="text-white text-xl font-bold">{formData.title}</h4>
                  {formData.titleNepali && (
                    <p className="text-gray-400 text-sm">{formData.titleNepali}</p>
                  )}
                  <div className="flex items-center space-x-3 mt-2 text-sm text-gray-400">
                    <span>{new Date(formData.releaseDate).getFullYear()}</span>
                    {formData.duration && (
                      <>
                        <span>•</span>
                        <span>{Math.floor(parseInt(formData.duration) / 60)}h {parseInt(formData.duration) % 60}m</span>
                      </>
                    )}
                    {formData.quality && (
                      <>
                        <span>•</span>
                        <span className="text-primary">{formData.quality}</span>
                      </>
                    )}
                    {formData.ageRating && (
                      <>
                        <span>•</span>
                        <span>{formData.ageRating}</span>
                      </>
                    )}
                    {formData.rating && (
                      <>
                        <span>•</span>
                        <span className="flex items-center">
                          <Star size={14} className="text-yellow-400 fill-yellow-400 mr-1" />
                          {formData.rating}/5
                        </span>
                      </>
                    )}
                  </div>
                  {formData.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.genres.map((genreId) => {
                        const genre = availableGenres.find((g) => g.id === genreId)
                        return genre ? (
                          <span
                            key={genreId}
                            className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded"
                          >
                            {genre.name}
                          </span>
                        ) : null
                      })}
                    </div>
                  )}
                </div>
              </div>
              {formData.description && (
                <p className="text-gray-300 text-sm line-clamp-3">{formData.description}</p>
              )}
              {formData.cast && (
                <div>
                  <span className="text-gray-400 text-sm">Cast: </span>
                  <span className="text-gray-300 text-sm">{formData.cast}</span>
                </div>
              )}
              {formData.matureThemes && (
                <div>
                  <span className="text-gray-400 text-sm">Mature Themes: </span>
                  <span className="text-gray-300 text-sm">{formData.matureThemes}</span>
                </div>
              )}
              {formData.tags && (
                <div>
                  <span className="text-gray-400 text-sm">Tags: </span>
                  <span className="text-gray-300 text-sm">{formData.tags}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Title *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <Input
            label="Title (Nepali)"
            value={formData.titleNepali}
            onChange={(e) => setFormData({ ...formData, titleNepali: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-white font-semibold mb-2">Description *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            rows={4}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
          />
        </div>

        <div>
          <label className="block text-white font-semibold mb-2">Description (Nepali)</label>
          <textarea
            value={formData.descriptionNepali}
            onChange={(e) => setFormData({ ...formData, descriptionNepali: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
          />
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            type="date"
            label="Release Date *"
            value={formData.releaseDate}
            onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
            required
          />
          {content.type === 'movie' && (
            <Input
              type="number"
              label="Duration (minutes) *"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              required
            />
          )}
          <div>
            <label className="block text-white font-semibold mb-2">Rating (out of 5) *</label>
            <Input
              type="number"
              value={formData.rating}
              onChange={(e) => {
                const value = e.target.value
                // Ensure value is between 0 and 5
                if (value === '') {
                  setFormData({ ...formData, rating: '' })
                  return
                }
                const numValue = parseFloat(value)
                if (!isNaN(numValue)) {
                  // Clamp between 0 and 5
                  const clampedValue = Math.min(5, Math.max(0, numValue))
                  setFormData({ ...formData, rating: clampedValue.toFixed(1) })
                }
              }}
              min="0"
              max="5"
              step="0.1"
              required
            />
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white font-semibold mb-2">Quality</label>
            <select
              value={formData.quality}
              onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
            >
              <option value="SD">SD</option>
              <option value="HD">HD</option>
              <option value="Full HD">Full HD</option>
              <option value="4K">4K</option>
              <option value="8K">8K</option>
            </select>
          </div>
          <div>
            <label className="block text-white font-semibold mb-2">Age Rating</label>
            <select
              value={formData.ageRating}
              onChange={(e) => setFormData({ ...formData, ageRating: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
            >
              <option value="G">G</option>
              <option value="PG">PG</option>
              <option value="PG-13">PG-13</option>
              <option value="R">R</option>
              <option value="TV-14">TV-14</option>
              <option value="TV-MA">TV-MA</option>
            </select>
          </div>
          <div>
            <label className="block text-white font-semibold mb-2">Cast</label>
            <Input
              value={formData.cast}
              onChange={(e) => setFormData({ ...formData, cast: e.target.value })}
              placeholder="Comma-separated names"
            />
          </div>
          <div>
            <label className="block text-white font-semibold mb-2">Mature Themes</label>
            <Input
              value={formData.matureThemes}
              onChange={(e) => setFormData({ ...formData, matureThemes: e.target.value })}
              placeholder="Comma-separated themes"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-white font-semibold mb-2">Tags</label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="Comma-separated tags"
            />
          </div>
          {/* Genres Selection */}
          <div className="md:col-span-2">
            <label className="block text-white font-semibold mb-2 flex items-center space-x-2">
              <Tag size={16} />
              <span>Genres</span>
            </label>
            <div className="flex flex-wrap gap-2 p-3 bg-gray-900 border border-gray-700 rounded-lg min-h-[60px]">
              {isLoading ? (
                <p className="text-gray-500 text-sm">Loading genres...</p>
              ) : availableGenres.length === 0 ? (
                <div className="w-full">
                  <p className="text-yellow-500 text-sm mb-2">No genres available</p>
                  <p className="text-gray-500 text-xs">Please ensure genres are seeded in the database.</p>
                </div>
              ) : (
                availableGenres.map((genre) => {
                  const isSelected = formData.genres.includes(genre.id)
                  return (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setFormData({
                            ...formData,
                            genres: formData.genres.filter((id) => id !== genre.id),
                          })
                        } else {
                          setFormData({
                            ...formData,
                            genres: [...formData.genres, genre.id],
                          })
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-primary text-white border-2 border-primary'
                          : 'bg-gray-800 text-gray-300 border-2 border-gray-700 hover:border-primary/50'
                      }`}
                    >
                      {genre.name}
                    </button>
                  )
                })
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Select one or more genres</p>
          </div>
        </div>

        {/* File Uploads Section */}
        <div className="border-t border-gray-800 pt-6">
          <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
            <Upload size={20} />
            <span>Update Media Files</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-semibold mb-2">Poster Image</label>
              {currentFiles.posterUrl && !files.poster && (
                <div className="mb-2">
                  <img
                    src={currentFiles.posterUrl}
                    alt="Current poster"
                    className="w-full h-48 object-cover rounded-lg mb-2"
                  />
                  <p className="text-xs text-gray-500">Current poster</p>
                </div>
              )}
              <FileUpload
                file={files.poster}
                onChange={(file) => handleFileChange('poster', file)}
                accept="image/*"
                label="Upload New Poster"
                fileSize={fileSizes.poster}
                recommendedSize="800x1200px"
              />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">Backdrop Image</label>
              {currentFiles.backdropUrl && !files.backdrop && (
                <div className="mb-2">
                  <img
                    src={currentFiles.backdropUrl}
                    alt="Current backdrop"
                    className="w-full h-32 object-cover rounded-lg mb-2"
                  />
                  <p className="text-xs text-gray-500">Current backdrop</p>
                </div>
              )}
              <FileUpload
                file={files.backdrop}
                onChange={(file) => handleFileChange('backdrop', file)}
                accept="image/*"
                label="Upload New Backdrop"
                fileSize={fileSizes.backdrop}
                recommendedSize="1920x1080px"
              />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">Video File</label>
              {currentFiles.videoUrl && !files.video && (
                <div className="mb-2 p-3 bg-gray-800 rounded-lg">
                  <Video size={20} className="text-primary mb-1" />
                  <p className="text-xs text-gray-400 truncate">{currentFiles.videoUrl}</p>
                  <p className="text-xs text-gray-500 mt-1">Current video</p>
                </div>
              )}
              <FileUpload
                file={files.video}
                onChange={(file) => handleFileChange('video', file)}
                accept="video/*"
                label="Upload New Video"
                fileSize={fileSizes.video}
                recommendedSize="MP4, MKV, or M3U8"
              />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">Trailer Video</label>
              {currentFiles.trailerUrl && !files.trailer && (
                <div className="mb-2 p-3 bg-gray-800 rounded-lg">
                  <Video size={20} className="text-primary mb-1" />
                  <p className="text-xs text-gray-400 truncate">{currentFiles.trailerUrl}</p>
                  <p className="text-xs text-gray-500 mt-1">Current trailer</p>
                </div>
              )}
              <FileUpload
                file={files.trailer}
                onChange={(file) => handleFileChange('trailer', file)}
                accept="video/*"
                label="Upload New Trailer"
                fileSize={fileSizes.trailer}
                recommendedSize="MP4 format"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Leave files empty to keep current files. Upload new files to replace them.
          </p>
        </div>

        {/* Publishing Options */}
        <div className="space-y-2">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={formData.isPublished}
              onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
              className="w-5 h-5 text-primary bg-gray-700 border-gray-600 rounded"
            />
            <span className="text-white">Published</span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              className="w-5 h-5 text-primary bg-gray-700 border-gray-600 rounded"
            />
            <span className="text-white">Featured</span>
          </label>
        </div>

        <div className="flex space-x-3 pt-4 border-t border-gray-800">
          <Button type="submit" variant="primary" isLoading={isSaving} className="flex-1">
            Save Changes
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}
