'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Play, X, Volume2, VolumeX, Maximize, SkipForward, SkipBack } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface TrailerPlayerProps {
  trailerUrl: string
  title: string
  onClose: () => void
}

export function TrailerPlayer({ trailerUrl, title, onClose }: TrailerPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [showSkipIndicator, setShowSkipIndicator] = useState<'forward' | 'back' | null>(null)

  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setPlaying(!playing)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted
      setMuted(!muted)
    }
  }

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!fullscreen) {
        videoRef.current.requestFullscreen()
      } else {
        document.exitFullscreen()
      }
      setFullscreen(!fullscreen)
    }
  }

  const skip = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(videoRef.current.duration, videoRef.current.currentTime + seconds))
      videoRef.current.currentTime = newTime
      
      // Show skip indicator
      setShowSkipIndicator(seconds > 0 ? 'forward' : 'back')
      setTimeout(() => setShowSkipIndicator(null), 1000)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          skip(-10)
          break
        case 'ArrowRight':
          e.preventDefault()
          skip(10)
          break
        case 'm':
        case 'M':
          e.preventDefault()
          toggleMute()
          break
        case 'f':
        case 'F':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'Escape':
          if (fullscreen) {
            e.preventDefault()
            toggleFullscreen()
          } else {
            e.preventDefault()
            onClose()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, muted, fullscreen])

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center animate-fade-in">
      <div className="relative w-full h-full max-w-7xl max-h-[90vh] flex items-center justify-center animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
        >
          <X size={24} className="text-white" />
        </button>

        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            src={trailerUrl}
            className="w-full h-full object-contain"
            onClick={togglePlay}
            onEnded={() => setPlaying(false)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onLoadedMetadata={() => {
              if (videoRef.current) {
                videoRef.current.muted = muted
              }
            }}
          />

          {/* Skip Indicator */}
          {showSkipIndicator && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/70 backdrop-blur-sm rounded-lg px-6 py-4 flex items-center space-x-3 animate-fade-in">
                {showSkipIndicator === 'back' ? (
                  <>
                    <SkipBack size={32} className="text-white" />
                    <span className="text-white text-xl font-semibold">-10s</span>
                  </>
                ) : (
                  <>
                    <SkipForward size={32} className="text-white" />
                    <span className="text-white text-xl font-semibold">+10s</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Controls Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            {!playing && (
              <button
                onClick={togglePlay}
                className="p-6 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
              >
                <Play size={48} className="text-white fill-white" />
              </button>
            )}
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => skip(-10)}
                  className="p-2 hover:bg-white/20 rounded-full transition-all hover:scale-110 active:scale-95"
                  title="Rewind 10s (←)"
                >
                  <SkipBack size={20} className="text-white" />
                </button>
                <button
                  onClick={togglePlay}
                  className="p-2 hover:bg-white/20 rounded-full transition-all hover:scale-110 active:scale-95"
                  title="Play/Pause (Space)"
                >
                  {playing ? (
                    <div className="w-0 h-0 border-l-[12px] border-l-white border-y-[8px] border-y-transparent" />
                  ) : (
                    <Play size={20} className="text-white fill-white" />
                  )}
                </button>
                <button
                  onClick={() => skip(10)}
                  className="p-2 hover:bg-white/20 rounded-full transition-all hover:scale-110 active:scale-95"
                  title="Forward 10s (→)"
                >
                  <SkipForward size={20} className="text-white" />
                </button>
                <button
                  onClick={toggleMute}
                  className="p-2 hover:bg-white/20 rounded-full transition-all hover:scale-110 active:scale-95"
                  title="Mute (M)"
                >
                  {muted ? (
                    <VolumeX size={20} className="text-white" />
                  ) : (
                    <Volume2 size={20} className="text-white" />
                  )}
                </button>
                <span className="text-white text-sm font-medium">{title}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-white/20 rounded-full transition-all hover:scale-110 active:scale-95"
                  title="Fullscreen (F)"
                >
                  <Maximize size={20} className="text-white" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-full transition-all hover:scale-110 active:scale-95"
                  title="Close (Esc)"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



