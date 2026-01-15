'use client'

import React, { useState, useEffect } from 'react'
import { Star, ThumbsUp, ThumbsDown, Send, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

interface Review {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  rating: number
  comment: string
  helpful: number
  createdAt: string
  userHelpful?: boolean
}

interface ReviewSectionProps {
  contentId: string
  contentType: 'movie' | 'series'
}

export function ReviewSection({ contentId, contentType }: ReviewSectionProps) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')

  useEffect(() => {
    fetchReviews()
  }, [contentId, user])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const endpoint = contentType === 'movie' 
        ? `/api/content/movie/${contentId}/reviews`
        : `/api/content/series/${contentId}/reviews`
      
      const response = await fetch(endpoint, {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews || [])
      } else {
        // Fallback to localStorage
        const { reviewsService } = require('@/lib/clientStorage')
        const allReviews = reviewsService.getByContent(contentId, contentType)
        setReviews(allReviews)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
      // Fallback to localStorage
      try {
        const { reviewsService } = require('@/lib/clientStorage')
        const allReviews = reviewsService.getByContent(contentId, contentType)
        setReviews(allReviews)
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error('Please login to submit a review')
      return
    }

    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    if (!comment.trim()) {
      toast.error('Please write a comment')
      return
    }

    setSubmitting(true)
    try {
      const endpoint = contentType === 'movie' 
        ? `/api/content/movie/${contentId}/reviews`
        : `/api/content/series/${contentId}/reviews`
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rating, comment }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to submit review' }))
        const errorMessage = errorData.message || 'Failed to submit review'
        
        // If content not found, fallback to localStorage for mock data
        if (response.status === 404 && errorMessage.includes('not found in database')) {
          try {
            const { reviewsService } = require('@/lib/clientStorage')
            reviewsService.add(contentId, contentType, rating, comment)
            toast.success('Review saved locally!', {
              duration: 3000,
            })
            setRating(0)
            setComment('')
            await fetchReviews()
            return
          } catch (localError) {
            // If localStorage also fails, show the original error
            throw new Error(errorMessage)
          }
        }
        
        throw new Error(errorMessage)
      }

      const result = await response.json()
      
      toast.success(result.message || 'Review submitted successfully!', {
        duration: 3000,
      })
      setRating(0)
      setComment('')
      await fetchReviews()
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit review. Please try again.', {
        duration: 3000,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleHelpful = async (reviewId: string, helpful: boolean) => {
    if (!user) {
      toast.error('Please login to mark reviews as helpful', {
        duration: 3000,
      })
      return
    }

    try {
      const endpoint = contentType === 'movie'
        ? `/api/content/movie/${contentId}/reviews/${reviewId}/helpful`
        : `/api/content/series/${contentId}/reviews/${reviewId}/helpful`
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ helpful }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to mark review as helpful')
      }

      const data = await response.json()
      
      // Update local state - data.helpful is the count, data.userHelpful is the boolean
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { 
                ...r, 
                helpful: data.helpful || 0, // The count
                userHelpful: data.userHelpful || false, // Whether current user marked it helpful
              }
            : r
        )
      )
    } catch (error: any) {
      console.error('Error marking review as helpful:', error)
      toast.error(error.message || 'Failed to mark review as helpful', {
        duration: 3000,
      })
    }
  }

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0

  return (
    <div className="mt-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-4">Reviews & Ratings</h2>
        {reviews.length > 0 && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-3xl font-bold text-white">{averageRating.toFixed(1)}/5</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={20}
                    className={star <= averageRating ? 'fill-primary text-primary' : 'text-gray-600'}
                  />
                ))}
              </div>
            </div>
            <span className="text-gray-400">({reviews.length} reviews)</span>
          </div>
        )}
      </div>

      {/* Write Review */}
      {user && (
        <div className="bg-card p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Write a Review</h3>
          
          {/* Rating */}
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Your Rating</label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded transition-transform duration-150 hover:scale-110 active:scale-95"
                  aria-label={`Rate ${star} out of 5 stars`}
                >
                  <Star
                    size={32}
                    className={`transition-colors duration-150 ${
                      star <= (hoverRating || rating)
                        ? 'fill-primary text-primary'
                        : 'text-gray-600 hover:text-gray-400'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="mb-4">
            <textarea
              placeholder="Share your thoughts about this content..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 bg-background rounded-md border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-all duration-200 hover:border-gray-600 min-h-[100px] resize-none"
            />
          </div>

          <Button
            onClick={handleSubmitReview}
            isLoading={submitting}
            disabled={rating === 0 || !comment.trim()}
          >
            <Send size={16} className="mr-2" />
            Submit Review
          </Button>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg">
          <Star size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">No reviews yet</p>
          <p className="text-gray-500 text-sm">Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-card p-6 rounded-lg">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  {review.userAvatar ? (
                    <img src={review.userAvatar} alt={review.userName} className="w-full h-full rounded-full" />
                  ) : (
                    <User size={20} className="text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-white font-semibold">{review.userName}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={14}
                              className={
                                star <= review.rating
                                  ? 'fill-primary text-primary'
                                  : 'text-gray-600'
                              }
                            />
                          ))}
                        </div>
                        <span className="text-gray-400 text-sm">
                          {formatDate(new Date(review.createdAt))}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-3">{review.comment}</p>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleHelpful(review.id, true)}
                      className={`flex items-center space-x-1 text-sm transition-all duration-200 hover:scale-110 active:scale-95 ${
                        review.userHelpful ? 'text-primary' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <ThumbsUp size={16} className={review.userHelpful ? 'fill-current' : ''} />
                      <span>{review.helpful}</span>
                    </button>
                    <button
                      onClick={() => handleHelpful(review.id, false)}
                      className="flex items-center space-x-1 text-sm text-gray-400 hover:text-white transition-all duration-200 hover:scale-110 active:scale-95"
                    >
                      <ThumbsDown size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

