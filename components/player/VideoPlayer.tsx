'use client'

import React, { useEffect, useRef, useState } from 'react'
import { usePlayer } from '@/hooks/usePlayer'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, X, SkipForward, SkipBack } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatDuration, getImageUrl } from '@/lib/utils'
import { WatchPartyControls } from './WatchPartyControls'
import { watchPartyService } from '@/lib/watchParty'

interface VideoPlayerProps {
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
  initialTime?: number | null
  onTimeUpdate?: (time: number, duration: number) => void
  onEnded?: () => void
}

export function VideoPlayer({
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
  initialTime,
  onTimeUpdate,
  onEnded,
}: VideoPlayerProps) {
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
  const [showSkipIndicator, setShowSkipIndicator] = useState<'forward' | 'back' | null>(null)
  const [showTopBar, setShowTopBar] = useState(true) // Always show top bar with cast/watch party
  const [isHoveringTopBar, setIsHoveringTopBar] = useState(false)
  const [previewTime, setPreviewTime] = useState<number | null>(null)
  const [previewPosition, setPreviewPosition] = useState(0)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()
  const skipTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSyncSentRef = useRef<{ time: number; playing: boolean } | null>(null)
  const hasResumedRef = useRef(false) // Track if we've already resumed from saved position
  const lastInitialTimeRef = useRef<number | null>(null) // Track the last initialTime to detect changes

  // Watch party sync integration
  useEffect(() => {
    const party = watchPartyService.getCurrentParty()
    const isHost = watchPartyService.getIsHost()

    if (!party) return

    // Set up sync handler (for guests)
    if (!isHost) {
      watchPartyService.onSync = (currentTime, isPlaying) => {
        if (videoRef.current) {
          const timeDiff = Math.abs(videoRef.current.currentTime - currentTime)
          // Only sync if difference is significant (>1 second)
          if (timeDiff > 1) {
            videoRef.current.currentTime = currentTime
          }
          
          if (isPlaying && videoRef.current.paused) {
            videoRef.current.play().catch(() => {})
          } else if (!isPlaying && !videoRef.current.paused) {
            videoRef.current.pause()
          }
        }
      }

      watchPartyService.onPlay = () => {
        if (videoRef.current && videoRef.current.paused) {
          videoRef.current.play().catch(() => {})
        }
      }

      watchPartyService.onPause = () => {
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause()
        }
      }

      watchPartyService.onSeek = (currentTime) => {
        if (videoRef.current) {
          videoRef.current.currentTime = currentTime
        }
      }
    }

    return () => {
      watchPartyService.onSync = undefined
      watchPartyService.onPlay = undefined
      watchPartyService.onPause = undefined
      watchPartyService.onSeek = undefined
    }
  }, [contentId, contentType])

  // Send sync updates (host only)
  useEffect(() => {
    const party = watchPartyService.getCurrentParty()
    const isHost = watchPartyService.getIsHost()

    if (!party || !isHost) return

    // Send sync on play/pause state change
    const shouldSync = 
      !lastSyncSentRef.current ||
      lastSyncSentRef.current.playing !== state.playing ||
      Math.abs(lastSyncSentRef.current.time - state.currentTime) > 1

    if (shouldSync && state.duration > 0) {
      watchPartyService.sendSync(state.currentTime, state.playing)
      lastSyncSentRef.current = { time: state.currentTime, playing: state.playing }
    }

    // Periodic sync during playback (every 2 seconds)
    if (state.playing && state.duration > 0) {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
      syncTimeoutRef.current = setTimeout(() => {
        watchPartyService.sendSync(state.currentTime, state.playing)
        lastSyncSentRef.current = { time: state.currentTime, playing: state.playing }
      }, 2000)
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [state.currentTime, state.playing, state.duration])

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
      if (skipTimeoutRef.current) {
        clearTimeout(skipTimeoutRef.current)
      }
    }
  }, [state.playing])

  const handleMouseMove = () => {
    setShowControls(true)
    setShowTopBar(true) // Always show top bar on mouse move
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    if (state.playing) {
      const timeout = setTimeout(() => {
        setShowControls(false)
        // Keep top bar visible if hovering or if not playing
        if (!isHoveringTopBar && state.playing) {
          setShowTopBar(false)
        }
      }, 3000)
      controlsTimeoutRef.current = timeout
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newTime = percent * state.duration
    seek(newTime)
    
    // Send sync if host
    if (watchPartyService.getIsHost() && watchPartyService.getCurrentParty()) {
      watchPartyService.sendSync(newTime, state.playing)
      lastSyncSentRef.current = { time: newTime, playing: state.playing }
    }
  }
  
  const skip = (seconds: number) => {
    const newTime = Math.max(0, Math.min(state.duration, state.currentTime + seconds))
    seek(newTime)
    
    // Send sync if host
    if (watchPartyService.getIsHost() && watchPartyService.getCurrentParty()) {
      watchPartyService.sendSync(newTime, state.playing)
      lastSyncSentRef.current = { time: newTime, playing: state.playing }
    }
    
    // Clear previous timeout
    if (skipTimeoutRef.current) {
      clearTimeout(skipTimeoutRef.current)
    }
    
    // Show skip indicator
    setShowSkipIndicator(seconds > 0 ? 'forward' : 'back')
    skipTimeoutRef.current = setTimeout(() => {
      setShowSkipIndicator(null)
      skipTimeoutRef.current = null
    }, 1000)
  }

  // Cleanup skip timeout on unmount
  useEffect(() => {
    return () => {
      if (skipTimeoutRef.current) {
        clearTimeout(skipTimeoutRef.current)
      }
    }
  }, [])

  // Keyboard shortcuts - Enhanced with more controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('[contenteditable="true"]')
      ) {
        return
      }

      // Prevent default for all video controls
      const videoControls = [
        ' ', 'k', 'K', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'm', 'M', 'f', 'F', 'Escape', 'j', 'J', 'l', 'L',
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
      ]
      
      if (videoControls.includes(e.key)) {
        e.preventDefault()
        e.stopPropagation()
      }

      switch (e.key) {
        case ' ': // Spacebar - Play/Pause
        case 'k': // K key - Play/Pause (YouTube style)
        case 'K':
          togglePlay()
          // Send sync if host
          if (watchPartyService.getIsHost() && watchPartyService.getCurrentParty()) {
            watchPartyService.sendSync(state.currentTime, !state.playing)
            lastSyncSentRef.current = { time: state.currentTime, playing: !state.playing }
          }
          break
          
        case 'ArrowLeft':
          // Left arrow - Rewind 10 seconds (or 5 if Shift is held)
          if (e.shiftKey) {
            skip(-5)
          } else {
            skip(-10)
          }
          break
          
        case 'ArrowRight':
          // Right arrow - Forward 10 seconds (or 5 if Shift is held)
          if (e.shiftKey) {
            skip(5)
          } else {
            skip(10)
          }
          break
          
        case 'j': // J key - Rewind 10 seconds (YouTube style)
        case 'J':
          skip(-10)
          break
          
        case 'l': // L key - Forward 10 seconds (YouTube style)
        case 'L':
          skip(10)
          break
          
        case 'm': // M key - Mute/Unmute
        case 'M':
          toggleMute()
          break
          
        case 'f': // F key - Fullscreen
        case 'F':
          toggleFullscreen()
          break
          
        case 'Escape': // Escape - Exit fullscreen
          if (state.fullscreen) {
            toggleFullscreen()
          }
          break
          
        case 'ArrowUp': // Up arrow - Increase volume
          setVolume(Math.min(1, state.volume + 0.05))
          break
          
        case 'ArrowDown': // Down arrow - Decrease volume
          setVolume(Math.max(0, state.volume - 0.05))
          break
          
        // Number keys (0-9) - Seek to percentage of video
        case '0':
          if (state.duration > 0) {
            const newTime = 0
            seek(newTime)
            if (watchPartyService.getIsHost() && watchPartyService.getCurrentParty()) {
              watchPartyService.sendSync(newTime, state.playing)
              lastSyncSentRef.current = { time: newTime, playing: state.playing }
            }
          }
          break
        case '1':
          if (state.duration > 0) {
            const newTime = state.duration * 0.1
            seek(newTime)
            if (watchPartyService.getIsHost() && watchPartyService.getCurrentParty()) {
              watchPartyService.sendSync(newTime, state.playing)
              lastSyncSentRef.current = { time: newTime, playing: state.playing }
            }
          }
          break
        case '2':
          if (state.duration > 0) {
            const newTime = state.duration * 0.2
            seek(newTime)
            if (watchPartyService.getIsHost() && watchPartyService.getCurrentParty()) {
              watchPartyService.sendSync(newTime, state.playing)
              lastSyncSentRef.current = { time: newTime, playing: state.playing }
            }
          }
          break
        case '3':
          if (state.duration > 0) {
            const newTime = state.duration * 0.3
            seek(newTime)
            if (watchPartyService.getIsHost() && watchPartyService.getCurrentParty()) {
              watchPartyService.sendSync(newTime, state.playing)
              lastSyncSentRef.current = { time: newTime, playing: state.playing }
            }
          }
          break
        case '4':
          if (state.duration > 0) {
            const newTime = state.duration * 0.4
            seek(newTime)
            if (watchPartyService.getIsHost() && watchPartyService.getCurrentParty()) {
              watchPartyService.sendSync(newTime, state.playing)
              lastSyncSentRef.current = { time: newTime, playing: state.playing }
            }
          }
          break
        case '5':
          if (state.duration > 0) {
            const newTime = state.duration * 0.5
            seek(newTime)
            if (watchPartyService.getIsHost() && watchPartyService.getCurrentParty()) {
              watchPartyService.sendSync(newTime, state.playing)
              lastSyncSentRef.current = { time: newTime, playing: state.playing }
            }
          }
          break
        case '6':
          if (state.duration > 0) {
            const newTime = state.duration * 0.6
            seek(newTime)
            if (watchPartyService.getIsHost() && watchPartyService.getCurrentParty()) {
              watchPartyService.sendSync(newTime, state.playing)
              lastSyncSentRef.current = { time: newTime, playing: state.playing }
            }
          }
          break
        case '7':
          if (state.duration > 0) {
            const newTime = state.duration * 0.7
            seek(newTime)
            if (watchPartyService.getIsHost() && watchPartyService.getCurrentParty()) {
              watchPartyService.sendSync(newTime, state.playing)
              lastSyncSentRef.current = { time: newTime, playing: state.playing }
            }
          }
          break
        case '8':
          if (state.duration > 0) {
            const newTime = state.duration * 0.8
            seek(newTime)
            if (watchPartyService.getIsHost() && watchPartyService.getCurrentParty()) {
              watchPartyService.sendSync(newTime, state.playing)
              lastSyncSentRef.current = { time: newTime, playing: state.playing }
            }
          }
          break
        case '9':
          if (state.duration > 0) {
            const newTime = state.duration * 0.9
            seek(newTime)
            if (watchPartyService.getIsHost() && watchPartyService.getCurrentParty()) {
              watchPartyService.sendSync(newTime, state.playing)
              lastSyncSentRef.current = { time: newTime, playing: state.playing }
            }
          }
          break
      }
    }

    // Add event listener to window to catch all keyboard events
    window.addEventListener('keydown', handleKeyDown, true) // Use capture phase
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [togglePlay, toggleMute, toggleFullscreen, setVolume, seek, skip, state.volume, state.playing, state.duration, state.fullscreen, state.currentTime])

  // Resume from saved position - only seek once when video loads
  useEffect(() => {
    const video = videoRef.current
    // Only resume if we have a valid initialTime (> 0)
    if (!video || initialTime === null || initialTime === undefined || initialTime <= 0) {
      hasResumedRef.current = false
      return
    }

    // Reset resume flag if initialTime changed (new video)
    if (lastInitialTimeRef.current !== initialTime) {
      hasResumedRef.current = false
      lastInitialTimeRef.current = initialTime
    }

    // If we've already resumed for this initialTime, don't do it again
    if (hasResumedRef.current) {
      return
    }

    let seekTimeout: NodeJS.Timeout | null = null

    const performSeek = () => {
      // Only seek once
      if (hasResumedRef.current) return
      
      // Wait for duration to be available and ensure video is ready
      // Use readyState >= 3 (HAVE_FUTURE_DATA) to ensure video can seek
      if (video.duration && video.duration > 0 && initialTime! > 0 && initialTime! < video.duration && video.readyState >= 3) {
        console.log('📺 Resuming playback from saved position (ONE TIME):', initialTime, 'seconds (duration:', video.duration, ', readyState:', video.readyState, ')')
        try {
          // Use the seek function from usePlayer hook to properly update state
          seek(initialTime!)
          hasResumedRef.current = true // Mark as resumed so we don't do it again
          console.log('📺 Seek completed, video at:', video.currentTime, '- will not seek again')
        } catch (error) {
          console.error('📺 Error seeking to saved position:', error)
        }
      } else if (video.duration && video.duration > 0) {
        // Only log once to avoid spam
        if (!hasResumedRef.current) {
          console.log('📺 Waiting for video to be ready:', { 
            initialTime, 
            duration: video.duration, 
            readyState: video.readyState,
            needReadyState: 3
          })
        }
      }
    }

    const handleCanPlayThrough = () => {
      // Video is ready to play through without buffering
      if (seekTimeout) clearTimeout(seekTimeout)
      if (!hasResumedRef.current) {
        seekTimeout = setTimeout(performSeek, 100)
      }
    }

    const handleLoadedData = () => {
      // Some data is loaded
      if (seekTimeout) clearTimeout(seekTimeout)
      if (!hasResumedRef.current) {
        seekTimeout = setTimeout(performSeek, 300)
      }
    }

    video.addEventListener('canplaythrough', handleCanPlayThrough)
    video.addEventListener('loadeddata', handleLoadedData)

    // If video is already loaded enough, try to seek
    if (video.readyState >= 3 && video.duration > 0 && !hasResumedRef.current) {
      seekTimeout = setTimeout(performSeek, 100)
    }

    return () => {
      if (seekTimeout) clearTimeout(seekTimeout)
      video.removeEventListener('canplaythrough', handleCanPlayThrough)
      video.removeEventListener('loadeddata', handleLoadedData)
    }
  }, [initialTime, seek])

  // Handle video errors
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleError = (e: Event) => {
      // Pause the video - state will update via event listeners
      if (!video.paused) {
        video.pause()
      }
    }

    const handleEnded = () => {
      // Pause the video - state will update via event listeners
      if (!video.paused) {
        video.pause()
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

  return (
    <div
      className="fixed bg-black cursor-pointer"
      style={{ 
        position: 'fixed',
        top: '64px', // Account for header height (h-16 = 64px)
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: 'calc(100vh - 64px)', // Full height minus header
        maxWidth: '100vw',
        maxHeight: 'calc(100vh - 64px)',
        overflow: 'hidden',
        zIndex: 10
      }}
      tabIndex={0}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (state.playing) setShowControls(false)
      }}
      onFocus={() => {
        // Ensure controls are visible when focused
        setShowControls(true)
      }}
      onClick={(e) => {
        // Handle clicks on the container/video area
        const target = e.target as HTMLElement
        
        // Don't toggle if clicking directly on interactive elements
        if (
          target.tagName === 'BUTTON' ||
          target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          // Only check closest if we're actually inside a button/input (not just if one exists in DOM)
          (target.closest('button') && target.closest('button') !== target) ||
          (target.closest('input') && target.closest('input') !== target) ||
          (target.closest('select') && target.closest('select') !== target) ||
          // Don't toggle if clicking on progress bar itself
          (target.closest('.cursor-pointer') && target.closest('.cursor-pointer')?.classList.contains('cursor-pointer'))
        ) {
          return
        }
        
        // Check if we're clicking on the bottom controls area specifically
        const bottomControls = target.closest('[style*="zIndex: 60"]')
        if (bottomControls && bottomControls !== e.currentTarget) {
          // Only prevent if clicking on actual control buttons, not the container
          const isControlButton = target.tagName === 'BUTTON' || target.closest('button')
          if (isControlButton) {
            return
          }
        }
        
        // Toggle play/pause on any click on the screen (video, container, or overlay background)
        togglePlay()
      }}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          maxWidth: '100%',
          maxHeight: '100%'
        }}
        onError={(e) => {
          // Pause the video - state will update via event listeners
          if (videoRef.current && !videoRef.current.paused) {
            videoRef.current.pause()
          }
        }}
      />

      {/* Skip Indicator */}
      {showSkipIndicator && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-black/80 backdrop-blur-sm rounded-lg px-8 py-6 flex items-center space-x-4 animate-fade-in shadow-2xl">
            {showSkipIndicator === 'back' ? (
              <>
                <SkipBack size={40} className="text-white" />
                <span className="text-white text-2xl font-bold">-10s</span>
              </>
            ) : (
              <>
                <SkipForward size={40} className="text-white" />
                <span className="text-white text-2xl font-bold">+10s</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Controls Overlay - Visual only, doesn't block clicks */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity pointer-events-none ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ zIndex: 50 }}
      >
        {/* Top Bar - Always visible for Cast & Watch Party */}
        <div 
          className="absolute top-0 left-0 right-0 px-6 sm:px-8 py-3 pointer-events-auto opacity-100"
          onClick={(e) => e.stopPropagation()}
          style={{ pointerEvents: 'auto', maxWidth: '100%', overflow: 'hidden', zIndex: 60 }}
          onMouseEnter={() => {
            setShowTopBar(true)
            setIsHoveringTopBar(true)
          }}
          onMouseLeave={() => {
            setIsHoveringTopBar(false)
          }}
        >
          <div className="flex items-center justify-between gap-2 min-w-0 w-full" style={{ maxWidth: '100%' }}>
            <div className="flex-1"></div>
            <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0" style={{ minWidth: 0 }}>
              {contentId && contentType && (
                <div 
                  onClick={(e) => {
                    e.stopPropagation()
                    e.nativeEvent?.stopImmediatePropagation()
                  }}
                  className="relative flex-shrink-0"
                  style={{ pointerEvents: 'auto', display: 'block', maxWidth: '100%', zIndex: 70 }}
                >
                  <WatchPartyControls
                    contentId={contentId}
                    contentType={contentType}
                    episodeId={episodeId}
                  />
                </div>
              )}
              <div 
                onClick={(e) => {
                  e.stopPropagation()
                  e.nativeEvent?.stopImmediatePropagation()
                }}
                className="relative flex-shrink-0"
                style={{ pointerEvents: 'auto', display: 'block', maxWidth: '100%', zIndex: 70 }}
              >
              </div>
            </div>
          </div>
        </div>

        {/* Center Play Button - Visual Only */}
        {showControls && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="group relative w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white transition-all transform border-2 border-white/20 shadow-lg transform-gpu overflow-hidden"
              >
              <span className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-150 transition-transform duration-500 opacity-0 group-hover:opacity-100" />
              <span className="relative z-10">
                {state.playing ? (
                  <Pause size={36} fill="currentColor" className="transition-transform duration-300" />
                ) : (
                  <Play size={36} fill="currentColor" className="ml-1 transition-transform duration-300" />
                )}
              </span>
            </div>
          </div>
        )}

        {/* Bottom Controls */}
        <div 
          className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 space-y-2 pointer-events-auto"
          onClick={(e) => {
            // Only stop propagation if clicking on actual control elements
            const target = e.target as HTMLElement
            if (
              target.tagName === 'BUTTON' ||
              target.tagName === 'INPUT' ||
              target.closest('button') ||
              target.closest('input') ||
              target.closest('.cursor-pointer')
            ) {
              e.stopPropagation()
            }
          }}
          style={{ zIndex: 60 }}
        >
          {/* Progress Bar with Preview */}
          <div className="relative">
            {/* Preview Thumbnail */}
            {previewTime !== null && showControls && (
              <div
                className="absolute bottom-full left-0 mb-2 transform -translate-x-1/2 pointer-events-none z-50"
                style={{ left: `${previewPosition}%` }}
              >
                <div className="bg-black/90 rounded-lg p-2 shadow-2xl">
                  <div className="w-32 h-18 bg-gray-800 rounded overflow-hidden mb-1">
                    {posterUrl ? (
                      <img
                        src={getImageUrl(posterUrl)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                        Preview
                      </div>
                    )}
                  </div>
                  <div className="text-white text-xs text-center font-semibold">
                    {formatDuration(previewTime)}
                  </div>
                </div>
              </div>
            )}
            
            <div
              className="w-full h-1 bg-gray-700 rounded-full cursor-pointer group relative"
              onClick={(e) => {
                e.stopPropagation()
                handleProgressClick(e)
              }}
              onMouseMove={(e) => {
                if (!videoRef.current || !state.duration) return
                const rect = e.currentTarget.getBoundingClientRect()
                const percent = (e.clientX - rect.left) / rect.width
                const hoverTime = percent * state.duration
                setPreviewTime(hoverTime)
                setPreviewPosition(percent * 100)
              }}
              onMouseLeave={() => {
                setPreviewTime(null)
              }}
            >
              <div
                className="h-full bg-primary rounded-full transition-all group-hover:bg-primary-light"
                style={{ width: `${(state.currentTime / state.duration) * 100}%` }}
              />
            </div>
          </div>
          
          {/* Control Buttons */}
          <div 
            className="flex items-center justify-between relative z-50"
            onClick={(e) => {
              e.stopPropagation()
              e.nativeEvent.stopImmediatePropagation()
            }}
            style={{ pointerEvents: 'auto', zIndex: 50 }}
          >
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  skip(-10)
                }}
                className="text-white hover:text-primary transition-all hover:scale-110 active:scale-95 p-1.5 sm:p-2"
                title="Rewind 10s (←)"
                aria-label="Rewind 10 seconds"
                type="button"
              >
                <SkipBack size={16} className="sm:w-5 sm:h-5" />
              </button>
              <button
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (e.nativeEvent) {
                    e.nativeEvent.stopImmediatePropagation()
                  }
                  // Toggle play/pause
                  
                  // Direct video control as primary method
                  const video = videoRef.current
                  if (video) {
                    if (state.playing) {
                      video.pause()
                    } else {
                      video.play().catch(() => {
                        // Play failed - state will update via event listeners
                      })
                    }
                  }
                  
                  // Send sync if host
                  if (watchPartyService.getIsHost() && watchPartyService.getCurrentParty()) {
                    watchPartyService.sendSync(state.currentTime, !state.playing)
                    lastSyncSentRef.current = { time: state.currentTime, playing: !state.playing }
                  }
                  
                  // Also call togglePlay to update state
                  setTimeout(() => {
                    togglePlay()
                  }, 0)
                }}
                onMouseUp={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                className="text-white hover:text-primary transition-all hover:scale-110 active:scale-95 p-2 focus:outline-none focus:ring-2 focus:ring-primary rounded relative z-50"
                title="Play/Pause (Space)"
                aria-label={state.playing ? 'Pause' : 'Play'}
                type="button"
                style={{ pointerEvents: 'auto', zIndex: 50, position: 'relative' }}
              >
                {state.playing ? (
                  <Pause size={18} className="sm:w-6 sm:h-6" fill="currentColor" />
                ) : (
                  <Play size={18} className="sm:w-6 sm:h-6 ml-0.5" fill="currentColor" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  skip(10)
                }}
                className="text-white hover:text-primary transition-all hover:scale-110 active:scale-95 p-1.5 sm:p-2"
                title="Forward 10s (→)"
                aria-label="Forward 10 seconds"
                type="button"
              >
                <SkipForward size={16} className="sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleMute()
                }}
                className="text-white hover:text-primary transition-all hover:scale-110 active:scale-95 p-1.5 sm:p-2"
                title="Mute (M)"
                aria-label={state.muted ? 'Unmute' : 'Mute'}
                type="button"
              >
                {state.muted ? <VolumeX size={18} className="sm:w-6 sm:h-6" fill="currentColor" /> : <Volume2 size={18} className="sm:w-6 sm:h-6" fill="currentColor" />}
              </button>

              <div className="hidden sm:flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={state.volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-20 sm:w-24"
                />
                <span className="text-white text-xs sm:text-sm w-10 sm:w-12">{Math.round(state.volume * 100)}%</span>
              </div>

              <div className="text-white text-xs sm:text-sm">
                {formatDuration(state.currentTime)} / {formatDuration(state.duration)}
              </div>
            </div>

            {/* Title - Center */}
            <div className="absolute left-1/2 transform -translate-x-1/2 hidden sm:block">
              <span className="text-white text-sm sm:text-base font-bold">{title}</span>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Settings */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowSettings(!showSettings)
                  }}
                  className="text-white hover:text-primary transition-all hover:scale-110 active:scale-95 p-2"
                  aria-label="Settings"
                  type="button"
                >
                  <Settings size={24} />
                </button>

                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-2 w-48 bg-card rounded-lg shadow-lg p-4 space-y-2">
                    <div>
                      <label className="block text-white text-sm mb-2">Quality</label>
                      <select
                        value={state.quality}
                        onChange={(e) => {
                          const value = e.target.value as '360p' | '720p' | '1080p' | 'auto'
                          setQuality(value)
                        }}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                      >
                        <option value="auto">Auto</option>
                        {videoUrl1080p && <option value="1080p">1080p</option>}
                        {videoUrl720p && <option value="720p">720p</option>}
                        {videoUrl360p && <option value="360p">360p</option>}
                      </select>
                    </div>

                    <div>
                      <label className="block text-white text-sm mb-2">Subtitles</label>
                      <select
                        value={state.subtitle}
                        onChange={(e) => {
                          const value = e.target.value as 'nepali' | 'english' | 'off'
                          setSubtitle(value)
                        }}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                      >
                        <option value="off">Off</option>
                        {subtitleUrlNepali && <option value="nepali">Nepali</option>}
                        {subtitleUrlEnglish && <option value="english">English</option>}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFullscreen()
                }}
                className="text-white hover:text-primary transition-all hover:scale-110 active:scale-95 p-2"
                title="Fullscreen (F)"
                aria-label="Toggle fullscreen"
                type="button"
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



