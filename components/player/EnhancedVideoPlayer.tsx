'use client'

import React, { useEffect, useRef, useState } from 'react'
import { usePlayer } from '@/hooks/usePlayer'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  X,
  SkipForward,
  SkipBack,
  Subtitles,
  Monitor,
  RotateCcw,
  PictureInPicture,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatDuration } from '@/lib/utils'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { WatchPartyControls } from './WatchPartyControls'

interface EnhancedVideoPlayerProps {
  videoUrl: string
  videoUrl360p?: string
  videoUrl720p?: string
  videoUrl1080p?: string
  subtitleUrlNepali?: string
  subtitleUrlEnglish?: string
  title: string
  description?: string
  posterUrl?: string
  contentId?: string
  contentType?: 'movie' | 'series'
  episodeId?: string
  onTimeUpdate?: (time: number, duration: number) => void
  onEnded?: () => void
  onSkipBack?: () => void
  onSkipForward?: () => void
}

export function EnhancedVideoPlayer({
  videoUrl,
  videoUrl360p,
  videoUrl720p,
  videoUrl1080p,
  subtitleUrlNepali,
  subtitleUrlEnglish,
  title,
  description,
  posterUrl,
  contentId,
  contentType,
  episodeId,
  onTimeUpdate,
  onEnded,
  onSkipBack,
  onSkipForward,
}: EnhancedVideoPlayerProps) {
  const {
    videoRef,
    state,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    setQuality,
    setSubtitle,
    toggleFullscreen,
  } = usePlayer(videoUrl, {
    '360p': videoUrl360p,
    '720p': videoUrl720p,
    '1080p': videoUrl1080p,
  })

  const [showControls, setShowControls] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isPictureInPicture, setIsPictureInPicture] = useState(false)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: ' ',
      action: togglePlay,
      description: 'Play/Pause',
    },
    {
      key: 'f',
      action: toggleFullscreen,
      description: 'Fullscreen',
    },
    {
      key: 'm',
      action: toggleMute,
      description: 'Mute',
    },
    {
      key: 'ArrowLeft',
      action: () => seek(Math.max(0, state.currentTime - 10)),
      description: 'Rewind 10s',
    },
    {
      key: 'ArrowRight',
      action: () => seek(Math.min(state.duration, state.currentTime + 10)),
      description: 'Forward 10s',
    },
  ])

  // Handle video errors
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleError = (e: Event) => {
      if (videoRef.current && state.playing) {
        togglePlay()
      }
    }

    const handleEnded = () => {
      if (videoRef.current && state.playing) {
        togglePlay()
      }
      onEnded?.()
    }

    video.addEventListener('error', handleError)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('error', handleError)
      video.removeEventListener('ended', handleEnded)
    }
  }, [onEnded])

  useEffect(() => {
    if (onTimeUpdate && state.duration > 0) {
      onTimeUpdate(state.currentTime, state.duration)
    }
  }, [state.currentTime, state.duration, onTimeUpdate])

  useEffect(() => {
    if (state.playing) {
      const timeout = setTimeout(() => setShowControls(false), 3000)
      controlsTimeoutRef.current = timeout
    } else {
      setShowControls(true)
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [state.playing])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate
    }
  }, [playbackRate, videoRef])

  const togglePictureInPicture = async () => {
    if (!videoRef.current) return
    
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
        setIsPictureInPicture(false)
      } else {
        await videoRef.current.requestPictureInPicture()
        setIsPictureInPicture(true)
      }
    } catch (error) {
      // Picture-in-picture not supported or failed
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleEnterPictureInPicture = () => setIsPictureInPicture(true)
    const handleLeavePictureInPicture = () => setIsPictureInPicture(false)

    video.addEventListener('enterpictureinpicture', handleEnterPictureInPicture)
    video.addEventListener('leavepictureinpicture', handleLeavePictureInPicture)

    return () => {
      video.removeEventListener('enterpictureinpicture', handleEnterPictureInPicture)
      video.removeEventListener('leavepictureinpicture', handleLeavePictureInPicture)
    }
  }, [])

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    if (state.playing) {
      const timeout = setTimeout(() => setShowControls(false), 3000)
      controlsTimeoutRef.current = timeout
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newTime = percent * state.duration
    seek(newTime)
  }

  const skip = (seconds: number) => {
    seek(Math.max(0, Math.min(state.duration, state.currentTime + seconds)))
  }

  const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

  return (
    <div
      className="relative w-full h-screen bg-black cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (state.playing) setShowControls(false)
      }}
      onClick={(e) => {
        // Handle clicks on the container/video area
        const target = e.target as HTMLElement
        // Only toggle if clicking on video, container, or overlay background (not on controls)
        if (
          target.tagName === 'VIDEO' ||
          target === e.currentTarget ||
          (target.classList.contains('bg-gradient-to-t') && target === e.currentTarget)
        ) {
          togglePlay()
        }
      }}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        onError={() => {
          // Video error - handled by event listeners
        }}
      />

      {/* Controls Overlay - Visual only, doesn't block clicks */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/50 transition-opacity pointer-events-none ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top Bar */}
        <div 
          className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <h1 className="text-white text-lg font-semibold truncate flex-1">{title}</h1>
          <div className="flex items-center space-x-2 ml-4">
            {contentId && contentType && (
              <div onClick={(e) => e.stopPropagation()}>
                <WatchPartyControls
                  contentId={contentId}
                  contentType={contentType}
                  episodeId={episodeId}
                  onSync={(currentTime, isPlaying) => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = currentTime
                      if (isPlaying) {
                        videoRef.current.play()
                      } else {
                        videoRef.current.pause()
                      }
                    }
                  }}
                  onPlay={() => togglePlay()}
                  onPause={() => togglePlay()}
                  onSeek={(currentTime) => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = currentTime
                    }
                  }}
                />
              </div>
            )}
            <div onClick={(e) => e.stopPropagation()}>
            </div>
          </div>
        </div>

        {/* Center Play Button */}
        {showControls && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                togglePlay()
              }}
              className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-all transform hover:scale-110 active:scale-95 border-2 border-white/20 focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label={state.playing ? 'Pause' : 'Play'}
              type="button"
            >
              {state.playing ? (
                <Pause size={32} fill="currentColor" />
              ) : (
                <Play size={32} fill="currentColor" className="ml-1" />
              )}
            </button>
          </div>
        )}

        {/* Bottom Controls */}
        <div 
          className="absolute bottom-0 left-0 right-0 p-4 space-y-2 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress Bar */}
          <div
            className="w-full h-1.5 bg-gray-700/50 rounded-full cursor-pointer group hover:h-2 transition-all"
            onClick={(e) => {
              e.stopPropagation()
              handleProgressClick(e)
            }}
          >
            <div
              className="h-full bg-primary rounded-full transition-all group-hover:bg-primary-light relative"
              style={{ width: `${(state.currentTime / state.duration) * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  skip(-10)
                }}
                className="group relative text-white hover:text-primary transition-all hover:scale-125 active:scale-100 p-2 rounded-full bg-black/20 backdrop-blur-sm hover:bg-primary/20 transform-gpu"
                title="Rewind 10s"
                aria-label="Rewind 10 seconds"
              >
                <SkipBack size={22} className="group-hover:scale-110 transition-transform duration-300" />
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  togglePlay()
                }}
                className="text-white hover:text-primary transition-all hover:scale-125 active:scale-100 p-3 focus:outline-none focus:ring-2 focus:ring-primary rounded-full bg-black/40 backdrop-blur-sm hover:bg-primary/20 transform-gpu group relative overflow-hidden shadow-lg hover:shadow-primary/50"
                aria-label={state.playing ? 'Pause' : 'Play'}
                type="button"
              >
                <span className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-150 transition-transform duration-500 opacity-0 group-hover:opacity-100" />
                <span className="relative z-10">
                  {state.playing ? (
                    <Pause size={28} fill="currentColor" className="group-hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <Play size={28} fill="currentColor" className="ml-0.5 group-hover:scale-110 transition-transform duration-300" />
                  )}
                </span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  skip(10)
                }}
                className="group relative text-white hover:text-primary transition-all hover:scale-125 active:scale-100 p-2 rounded-full bg-black/20 backdrop-blur-sm hover:bg-primary/20 transform-gpu"
                title="Forward 10s"
                aria-label="Forward 10 seconds"
              >
                <SkipForward size={22} className="group-hover:scale-110 transition-transform duration-300" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleMute()
                }}
                className="text-white hover:text-primary transition-all hover:scale-110 active:scale-95 p-2"
                aria-label={state.muted ? 'Unmute' : 'Mute'}
              >
                {state.muted ? <VolumeX size={24} fill="currentColor" /> : <Volume2 size={24} fill="currentColor" />}
              </button>

              <div className="flex items-center space-x-2 w-32">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={state.volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-white text-sm w-12 text-right">
                  {Math.round(state.volume * 100)}%
                </span>
              </div>

              <div className="text-white text-sm px-3">
                {formatDuration(state.currentTime)} / {formatDuration(state.duration)}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Playback Speed */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowSpeedMenu(!showSpeedMenu)
                  }}
                  className="text-white hover:text-primary transition-all hover:scale-110 active:scale-95 px-3 py-1 text-sm"
                  aria-label="Playback speed"
                >
                  {playbackRate}x
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 w-32 bg-card rounded-lg shadow-lg p-2 space-y-1">
                    {playbackRates.map((rate) => (
                      <button
                        key={rate}
                        onClick={() => {
                          setPlaybackRate(rate)
                          setShowSpeedMenu(false)
                        }}
                        className={`w-full text-left px-3 py-1.5 text-sm rounded hover:bg-gray-800 transition-colors ${
                          playbackRate === rate ? 'text-primary bg-primary/10' : 'text-white'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Settings */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowSettings(!showSettings)
                    setShowSpeedMenu(false)
                  }}
                  className="text-white hover:text-primary transition-all hover:scale-110 active:scale-95 p-2"
                  aria-label="Settings"
                >
                  <Settings size={24} />
                </button>

                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-2 w-64 bg-card rounded-lg shadow-lg p-4 space-y-4">
                    <div>
                      <label className="block text-white text-sm mb-2 flex items-center space-x-2">
                        <Monitor size={16} />
                        <span>Quality</span>
                      </label>
                      <select
                        value={state.quality}
                        onChange={(e) => {
                          const value = e.target.value as '360p' | '720p' | '1080p' | 'auto'
                          setQuality(value)
                        }}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="auto">Auto</option>
                        {videoUrl1080p && <option value="1080p">1080p</option>}
                        {videoUrl720p && <option value="720p">720p</option>}
                        {videoUrl360p && <option value="360p">360p</option>}
                      </select>
                    </div>

                    <div>
                      <label className="block text-white text-sm mb-2 flex items-center space-x-2">
                        <Subtitles size={16} />
                        <span>Subtitles</span>
                      </label>
                      <select
                        value={state.subtitle}
                        onChange={(e) => {
                          const value = e.target.value as 'nepali' | 'english' | 'off'
                          setSubtitle(value)
                        }}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="off">Off</option>
                        {subtitleUrlNepali && <option value="nepali">Nepali</option>}
                        {subtitleUrlEnglish && <option value="english">English</option>}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {document.pictureInPictureEnabled && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    togglePictureInPicture()
                  }}
                  className="text-white hover:text-primary transition-all hover:scale-110 active:scale-95 p-2"
                  title="Picture-in-Picture"
                  aria-label="Picture-in-Picture"
                >
                  <PictureInPicture size={24} className={isPictureInPicture ? 'text-primary fill-primary' : ''} fill={isPictureInPicture ? 'currentColor' : 'none'} />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFullscreen()
                }}
                className="text-white hover:text-primary transition-all hover:scale-110 active:scale-95 p-2"
                title="Fullscreen (F)"
                aria-label="Toggle fullscreen"
              >
                {state.fullscreen ? <Minimize size={24} fill="currentColor" /> : <Maximize size={24} fill="currentColor" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



