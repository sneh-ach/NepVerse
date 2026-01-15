'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MessageSquare, ThumbsUp, Reply, Send, MoreVertical } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

interface Comment {
  id: string
  content: string
  likes: number
  liked?: boolean
  createdAt: string
  user: {
    id: string
    email: string
    profile?: {
      firstName?: string
      lastName?: string
      avatar?: string
    }
  }
  replies?: Comment[]
}

interface CommentsSectionProps {
  contentId: string
  contentType: 'movie' | 'series'
}

export function CommentsSection({ contentId, contentType }: CommentsSectionProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [contentId, user])

  const fetchComments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/content/${contentId}/comments?type=${contentType}`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        // Map to include liked status from API
        setComments(data.map((c: Comment) => ({
          ...c,
          liked: c.liked || false,
          replies: c.replies?.map((r: Comment) => ({
            ...r,
            liked: r.liked || false,
          })),
        })))
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('Please login to comment')
      return
    }

    if (!newComment.trim()) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/content/${contentId}/comments?type=${contentType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          type: contentType,
        }),
      })

      if (!response.ok) throw new Error('Failed to post comment')

      const comment = await response.json()
      setComments([comment, ...comments])
      setNewComment('')
      toast.success('Comment posted')
    } catch (error) {
      toast.error('Failed to post comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!user) {
      toast.error('Please login to reply')
      return
    }

    if (!replyContent.trim()) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/content/${contentId}/comments?type=${contentType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          type: contentType,
          parentId,
        }),
      })

      if (!response.ok) throw new Error('Failed to post reply')

      await fetchComments()
      setReplyingTo(null)
      setReplyContent('')
      toast.success('Reply posted')
    } catch (error) {
      toast.error('Failed to post reply')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLike = async (commentId: string) => {
    if (!user) {
      toast.error('Please login to like comments')
      return
    }

    try {
      const response = await fetch(`/api/content/comments/${commentId}/like`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to like comment')
      }

      const data = await response.json()

      // Update local state - toggle like
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            return { ...c, likes: data.likes, liked: data.liked }
          }
          // Check replies
          if (c.replies?.some(r => r.id === commentId)) {
            return {
              ...c,
              replies: c.replies?.map((r) =>
                r.id === commentId ? { ...r, likes: data.likes, liked: data.liked } : r
              ),
            }
          }
          return c
        })
      )
    } catch (error: any) {
      toast.error(error.message || 'Failed to like comment')
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
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <MessageSquare size={24} className="text-primary" />
        <h2 className="text-2xl font-bold text-white">Comments</h2>
        <span className="text-gray-400">({comments.length})</span>
      </div>

      {/* Add Comment */}
      {user ? (
        <form onSubmit={handleSubmitComment} className="space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary resize-none"
          />
          <div className="flex justify-end">
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              <Send size={18} className="mr-2" />
              Post Comment
            </Button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-900/50 p-4 rounded-lg text-center">
          <p className="text-gray-400 mb-3">Please login to comment</p>
          <Button variant="primary" onClick={() => window.location.href = '/login'}>
            Login
          </Button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onLike={() => handleLike(comment.id)}
              onReply={() => setReplyingTo(comment.id)}
              replyingTo={replyingTo}
              replyContent={replyContent}
              onReplyChange={setReplyContent}
              onSubmitReply={() => handleSubmitReply(comment.id)}
              onCancelReply={() => {
                setReplyingTo(null)
                setReplyContent('')
              }}
            />
          ))
        )}
      </div>
    </div>
  )
}

function CommentItem({
  comment,
  onLike,
  onReply,
  replyingTo,
  replyContent,
  onReplyChange,
  onSubmitReply,
  onCancelReply,
}: {
  comment: Comment
  onLike: () => void
  onReply: () => void
  replyingTo: string | null
  replyContent: string
  onReplyChange: (value: string) => void
  onSubmitReply: () => void
  onCancelReply: () => void
}) {
  const userName = comment.user.profile?.firstName || comment.user.email.split('@')[0]
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <div className="bg-card rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <span className="text-primary font-semibold">{userInitial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-white font-semibold">{userName}</span>
            <span className="text-gray-500 text-sm">
              {formatDate(comment.createdAt)}
            </span>
          </div>
          <p className="text-gray-300 mb-3 whitespace-pre-wrap">{comment.content}</p>
          <div className="flex items-center space-x-4">
            <button
              onClick={onLike}
              className={`flex items-center space-x-1 transition-colors ${
                comment.liked 
                  ? 'text-primary' 
                  : 'text-gray-400 hover:text-primary'
              }`}
            >
              <ThumbsUp size={16} className={comment.liked ? 'fill-current' : ''} />
              <span>{comment.likes}</span>
            </button>
            <button
              onClick={onReply}
              className="flex items-center space-x-1 text-gray-400 hover:text-primary transition-colors"
            >
              <Reply size={16} />
              <span>Reply</span>
            </button>
          </div>

          {/* Reply Form */}
          {replyingTo === comment.id && (
            <div className="mt-4 pl-4 border-l-2 border-primary/30">
              <textarea
                value={replyContent}
                onChange={(e) => onReplyChange(e.target.value)}
                placeholder="Write a reply..."
                rows={2}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary resize-none text-sm"
              />
              <div className="flex space-x-2 mt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onSubmitReply}
                >
                  Reply
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCancelReply}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-700">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary text-xs font-semibold">
                      {(reply.user.profile?.firstName || reply.user.email.split('@')[0]).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-white text-sm font-semibold">
                        {reply.user.profile?.firstName || reply.user.email.split('@')[0]}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {formatDate(reply.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">{reply.content}</p>
                    <button
                      onClick={() => onLike()}
                      className="flex items-center space-x-1 text-gray-400 hover:text-primary transition-colors mt-2"
                    >
                      <ThumbsUp size={14} />
                      <span className="text-xs">{reply.likes}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


