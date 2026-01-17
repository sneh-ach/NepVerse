'use client'

import { useState } from 'react'
import { Share2, Copy, Check, Facebook, Twitter, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface ShareButtonProps {
  contentId: string
  contentType: 'movie' | 'series'
  title: string
  posterUrl?: string
  className?: string
}

export function ShareButton({ contentId, contentType, title, posterUrl, className }: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [copied, setCopied] = useState(false)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const shareUrl = `${baseUrl}/${contentType}/${contentId}`
  const shareText = `Check out "${title}" on NepVerse!`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
      setShowMenu(false)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleShare = async (platform: 'facebook' | 'twitter' | 'whatsapp') => {
    let url = ''
    
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        break
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
        break
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`
        break
    }

    window.open(url, '_blank', 'noopener,noreferrer')
    setShowMenu(false)
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareText,
          text: shareText,
          url: shareUrl,
        })
        setShowMenu(false)
      } catch (error) {
        // User cancelled or error
      }
    }
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center space-x-2"
      >
        <Share2 size={16} />
        <span>Share</span>
      </Button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-card rounded-lg shadow-2xl border border-gray-800 z-50 animate-scale-in">
            <div className="p-2">
              {navigator.share && (
                <button
                  onClick={handleNativeShare}
                  className="w-full text-left px-4 py-2 rounded hover:bg-gray-800 transition-colors flex items-center space-x-2 text-white"
                >
                  <Share2 size={16} />
                  <span>Share via...</span>
                </button>
              )}
              <button
                onClick={handleCopyLink}
                className="w-full text-left px-4 py-2 rounded hover:bg-gray-800 transition-colors flex items-center space-x-2 text-white"
              >
                {copied ? (
                  <>
                    <Check size={16} className="text-green-500" />
                    <span className="text-green-500">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
              <div className="border-t border-gray-800 my-1" />
              <button
                onClick={() => handleShare('facebook')}
                className="w-full text-left px-4 py-2 rounded hover:bg-gray-800 transition-colors flex items-center space-x-2 text-white"
              >
                <Facebook size={16} className="text-blue-500" />
                <span>Facebook</span>
              </button>
              <button
                onClick={() => handleShare('twitter')}
                className="w-full text-left px-4 py-2 rounded hover:bg-gray-800 transition-colors flex items-center space-x-2 text-white"
              >
                <Twitter size={16} className="text-blue-400" />
                <span>Twitter</span>
              </button>
              <button
                onClick={() => handleShare('whatsapp')}
                className="w-full text-left px-4 py-2 rounded hover:bg-gray-800 transition-colors flex items-center space-x-2 text-white"
              >
                <MessageCircle size={16} className="text-green-500" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
