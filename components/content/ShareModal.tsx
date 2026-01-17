'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Copy, Facebook, Twitter, MessageCircle, Mail, Share2, Check, Linkedin, Link2, Globe } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  contentId: string
  contentType: 'movie' | 'series'
  rating?: number
  year?: number
  description?: string
}

export function ShareModal({ 
  isOpen, 
  onClose, 
  title, 
  contentId, 
  contentType,
  rating,
  year,
  description 
}: ShareModalProps) {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)
  const [shareText, setShareText] = useState('')
  const [supportsNativeShare, setSupportsNativeShare] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/${contentType}/${contentId}`
    : ''

  // Auto-generate share text with all available info
  useEffect(() => {
    let text = `🎬 Check out "${title}"`
    
    if (year) {
      text += ` (${year})`
    }
    
    if (rating) {
      const displayRating = (rating > 5 ? rating / 2 : rating).toFixed(1)
      text += ` ⭐ ${displayRating}/5`
    }
    
    text += ` on NepVerse!`
    
    if (description) {
      const shortDesc = description.length > 100 ? description.substring(0, 100) + '...' : description
      text += `\n\n${shortDesc}`
    }
    
    text += `\n\n${shareUrl}`
    
    setShareText(text)
  }, [title, year, rating, description, shareUrl])

  // Check for native share API support
  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setSupportsNativeShare(true)
    }
  }, [])

  // Auto-select text when input is focused
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select()
  }

  const handleCopy = async () => {
    try {
      // Copy the full share text (not just URL)
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      toast.success('Share text copied to clipboard!', {
        duration: 2500,
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy. Please try again.', {
        duration: 3000,
      })
    }
  }

  const trackShare = async (platform?: string) => {
    if (!user) return
    
    try {
      const { createActivity } = await import('@/lib/achievements')
      await createActivity(
        user.id,
        'SHARED_CONTENT',
        contentId,
        contentType,
        { platform: platform || 'native' }
      )
    } catch (error) {
      console.error('Error tracking share:', error)
    }
  }

  const handleNativeShare = async () => {
    if (!navigator.share) {
      toast.error('Sharing is not supported on this device.', {
        duration: 3000,
      })
      return
    }

    try {
      await navigator.share({
        title: `${title}${year ? ` (${year})` : ''} - NepVerse`,
        url: shareUrl,
      })
      await trackShare('native')
      toast.success('Shared successfully!', {
        duration: 2000,
      })
    } catch (error: any) {
      // User cancelled or error occurred
      if (error.name !== 'AbortError') {
        toast.error('Failed to share. Please try again.', {
          duration: 3000,
        })
      }
    }
  }

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(shareUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    reddit: `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(`${title}${year ? ` (${year})` : ''} - NepVerse`)}`,
    email: `mailto:?subject=${encodeURIComponent(`${title}${year ? ` (${year})` : ''} - NepVerse`)}&body=${encodeURIComponent(shareUrl)}`,
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share">
      <div className="space-y-6">
        {/* Preview Card */}
        <div className="bg-gradient-to-br from-card to-card/80 rounded-xl p-4 border border-gray-700">
          <div className="flex items-start space-x-3">
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg mb-1">{title}</h3>
              <div className="flex items-center space-x-3 text-sm text-gray-400 mb-2">
                {year && <span>{year}</span>}
                {rating && (
                  <span className="flex items-center space-x-1">
                    <span className="text-yellow-400">⭐</span>
                    <span>{(rating > 5 ? rating / 2 : rating).toFixed(1)}/5</span>
                  </span>
                )}
                <span className="capitalize">{contentType}</span>
              </div>
              {description && (
                <p className="text-gray-300 text-sm line-clamp-2">{description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Native Share Button (if supported) */}
        {supportsNativeShare && (
          <Button
            onClick={handleNativeShare}
            variant="primary"
            className="w-full flex items-center justify-center space-x-2 group/btn"
          >
            <Share2 size={20} className="group-hover/btn:rotate-12 transition-transform duration-300" />
            <span className="font-semibold">Share via...</span>
          </Button>
        )}

        {/* Share Text Input (Auto-populated) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Share Text (Auto-filled)
          </label>
          <div className="flex flex-col space-y-2">
            <textarea
              value={shareText}
              onChange={(e) => setShareText(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 bg-card border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="Share text will be auto-filled..."
            />
            <Button
              onClick={async () => {
                await handleCopy()
                await trackShare('copy')
              }}
              variant="outline"
              className="w-full flex items-center justify-center space-x-2 group/btn"
            >
              {copied ? (
                <>
                  <Check size={18} className="text-green-400 group-hover/btn:scale-125 transition-transform duration-300" />
                  <span className="font-semibold text-green-400">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy size={18} className="group-hover/btn:rotate-12 transition-transform duration-300" />
                  <span className="font-semibold">Copy Share Text</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Social Share Buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Share on Social Media
          </label>
          <div className="grid grid-cols-3 gap-3">
            <a
              href={shareLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackShare('facebook')}
              className="group relative flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#1877F2] to-[#0d5fcc] rounded-xl hover:scale-110 active:scale-100 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 shadow-lg hover:shadow-2xl hover:shadow-[#1877F2]/50 transform-gpu overflow-hidden"
              aria-label="Share on Facebook"
            >
              <span className="absolute inset-0 bg-white/20 rounded-xl scale-0 group-hover:scale-150 transition-transform duration-500 opacity-0 group-hover:opacity-100" />
              <Facebook size={24} className="text-white mb-1 relative z-10 group-hover:scale-125 transition-transform duration-300" />
              <span className="text-white text-xs font-bold relative z-10">Facebook</span>
            </a>

            <a
              href={shareLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackShare('twitter')}
              className="group relative flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#1DA1F2] to-[#0c85d0] rounded-xl hover:scale-110 active:scale-100 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 shadow-lg hover:shadow-2xl hover:shadow-[#1DA1F2]/50 transform-gpu overflow-hidden"
              aria-label="Share on Twitter"
            >
              <span className="absolute inset-0 bg-white/20 rounded-xl scale-0 group-hover:scale-150 transition-transform duration-500 opacity-0 group-hover:opacity-100" />
              <Twitter size={24} className="text-white mb-1 relative z-10 group-hover:scale-125 transition-transform duration-300" />
              <span className="text-white text-xs font-bold relative z-10">Twitter</span>
            </a>

            <a
              href={shareLinks.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackShare('whatsapp')}
              className="group relative flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#25D366] to-[#1da851] rounded-xl hover:scale-110 active:scale-100 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 shadow-lg hover:shadow-2xl hover:shadow-[#25D366]/50 transform-gpu overflow-hidden"
              aria-label="Share on WhatsApp"
            >
              <span className="absolute inset-0 bg-white/20 rounded-xl scale-0 group-hover:scale-150 transition-transform duration-500 opacity-0 group-hover:opacity-100" />
              <MessageCircle size={24} className="text-white mb-1 relative z-10 group-hover:scale-125 transition-transform duration-300" />
              <span className="text-white text-xs font-bold relative z-10">WhatsApp</span>
            </a>

            <a
              href={shareLinks.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#0077B5] to-[#005885] rounded-xl hover:scale-110 active:scale-100 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 shadow-lg hover:shadow-2xl hover:shadow-[#0077B5]/50 transform-gpu overflow-hidden"
              aria-label="Share on LinkedIn"
            >
              <span className="absolute inset-0 bg-white/20 rounded-xl scale-0 group-hover:scale-150 transition-transform duration-500 opacity-0 group-hover:opacity-100" />
              <Linkedin size={24} className="text-white mb-1 relative z-10 group-hover:scale-125 transition-transform duration-300" />
              <span className="text-white text-xs font-bold relative z-10">LinkedIn</span>
            </a>

            <a
              href={shareLinks.reddit}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#FF4500] to-[#cc3700] rounded-xl hover:scale-110 active:scale-100 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 shadow-lg hover:shadow-2xl hover:shadow-[#FF4500]/50 transform-gpu overflow-hidden"
              aria-label="Share on Reddit"
            >
              <span className="absolute inset-0 bg-white/20 rounded-xl scale-0 group-hover:scale-150 transition-transform duration-500 opacity-0 group-hover:opacity-100" />
              <Globe size={24} className="text-white mb-1 relative z-10 group-hover:scale-125 transition-transform duration-300" />
              <span className="text-white text-xs font-bold relative z-10">Reddit</span>
            </a>

            <a
              href={shareLinks.email}
              className="group relative flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl hover:scale-110 active:scale-100 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 shadow-lg hover:shadow-2xl hover:shadow-gray-600/50 transform-gpu overflow-hidden"
              aria-label="Share via Email"
            >
              <span className="absolute inset-0 bg-white/20 rounded-xl scale-0 group-hover:scale-150 transition-transform duration-500 opacity-0 group-hover:opacity-100" />
              <Mail size={24} className="text-white mb-1 relative z-10 group-hover:scale-125 transition-transform duration-300" />
              <span className="text-white text-xs font-bold relative z-10">Email</span>
            </a>
          </div>
        </div>

        {/* Quick Link Copy */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Direct Link
          </label>
          <div className="flex items-center space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={shareUrl}
              readOnly
              onFocus={handleInputFocus}
              className="flex-1 px-4 py-2 bg-card border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button
              onClick={() => {
                inputRef.current?.select()
                handleCopy()
              }}
              variant="ghost"
              size="sm"
              className="flex items-center space-x-1"
              aria-label="Copy link"
            >
              <Link2 size={16} />
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

