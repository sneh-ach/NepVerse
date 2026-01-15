import { useState, useRef, useEffect } from 'react'
import Hls from 'hls.js'

export interface PlayerState {
  playing: boolean
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  quality: '360p' | '720p' | '1080p' | 'auto'
  subtitle: 'nepali' | 'english' | 'off'
  fullscreen: boolean
}

export function usePlayer(videoUrl: string, qualities?: {
  '360p'?: string
  '720p'?: string
  '1080p'?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [state, setState] = useState<PlayerState>({
    playing: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    muted: false,
    quality: 'auto',
    subtitle: 'off',
    fullscreen: false,
  })

  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoUrl) return

    // Use a fallback video URL if HLS fails
    const fallbackVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'

    // Initialize HLS
    if (Hls.isSupported() && videoUrl.endsWith('.m3u8')) {
      try {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          maxLoadingDelay: 4,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
        })

        hls.loadSource(videoUrl)
        hls.attachMedia(video)

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          // Don't auto-play, let user control
          setState((s) => ({ ...s, playing: false }))
        })

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS Error:', data)
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log('Network error, trying to recover...')
                hls.startLoad()
                break
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('Media error, trying to recover...')
                hls.recoverMediaError()
                break
              default:
                console.log('Fatal error, switching to fallback...')
                hls.destroy()
                // Fallback to MP4
                video.src = fallbackVideoUrl
                video.load()
                break
            }
          }
        })

        hlsRef.current = hls

        return () => {
          if (hlsRef.current) {
            hlsRef.current.destroy()
            hlsRef.current = null
          }
        }
      } catch (error) {
        console.error('HLS initialization error:', error)
        // Fallback to MP4
        video.src = fallbackVideoUrl
        video.load()
      }
    } else if (video.canPlayType('application/vnd.apple.mpegurl') && videoUrl.endsWith('.m3u8')) {
      // Native HLS support (Safari)
      video.src = videoUrl
      video.addEventListener('error', () => {
        console.error('Video load error, using fallback')
        video.src = fallbackVideoUrl
        video.load()
      })
    } else {
      // Direct MP4 or fallback
      video.src = videoUrl.endsWith('.m3u8') ? fallbackVideoUrl : videoUrl
      video.addEventListener('error', () => {
        console.error('Video load error, using fallback')
        video.src = fallbackVideoUrl
        video.load()
      })
    }
  }, [videoUrl])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => setState((s) => ({ ...s, currentTime: video.currentTime }))
    const updateDuration = () => setState((s) => ({ ...s, duration: video.duration }))
    
    // Sync playing state with actual video events
    const handlePlay = () => setState((s) => ({ ...s, playing: true }))
    const handlePause = () => setState((s) => ({ ...s, playing: false }))
    const handlePlaying = () => setState((s) => ({ ...s, playing: true }))

    video.addEventListener('timeupdate', updateTime)
    video.addEventListener('loadedmetadata', updateDuration)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('playing', handlePlaying)

    return () => {
      video.removeEventListener('timeupdate', updateTime)
      video.removeEventListener('loadedmetadata', updateDuration)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('playing', handlePlaying)
    }
  }, [])

  const play = async () => {
    const video = videoRef.current
    if (!video) {
      console.error('📺 Cannot play: video element not found')
      return
    }
    
    console.log('📺 Attempting to play video:', {
      src: video.src,
      readyState: video.readyState,
      duration: video.duration,
      currentTime: video.currentTime,
      paused: video.paused
    })
    
    try {
      await video.play()
      console.log('📺 Video play() succeeded')
      // State will be updated by the 'play' event listener
    } catch (error) {
      console.error('📺 Error playing video:', error)
      setState((s) => ({ ...s, playing: false }))
    }
  }

  const pause = () => {
    const video = videoRef.current
    if (!video) return
    
    video.pause()
    // State will be updated by the 'pause' event listener
  }

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    
    if (state.playing) {
      pause()
    } else {
      play()
    }
  }

  const seek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setState((s) => ({ ...s, currentTime: time }))
    }
  }

  const setVolume = (volume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = volume
      setState((s) => ({ ...s, volume }))
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !state.muted
      setState((s) => ({ ...s, muted: !s.muted }))
    }
  }

  const setQuality = (quality: PlayerState['quality']) => {
    setState((s) => ({ ...s, quality }))
    // HLS quality switching would be implemented here
  }

  const setSubtitle = (subtitle: PlayerState['subtitle']) => {
    setState((s) => ({ ...s, subtitle }))
    // Subtitle track switching would be implemented here
  }

  const toggleFullscreen = () => {
    const video = videoRef.current
    if (!video) return

    if (!state.fullscreen) {
      if (video.requestFullscreen) {
        video.requestFullscreen().catch((err) => {
          console.error('Error entering fullscreen:', err)
        })
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.error('Error exiting fullscreen:', err)
        })
      }
    }
  }

  // Listen to fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      // Type-safe fullscreen detection with proper browser compatibility
      const doc = document as Document & {
        webkitFullscreenElement?: Element | null
        mozFullScreenElement?: Element | null
        msFullscreenElement?: Element | null
      }
      const isFullscreen = !!(
        document.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      )
      setState((s) => ({ ...s, fullscreen: isFullscreen }))
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [])

  return {
    videoRef,
    state,
    play,
    pause,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    setQuality,
    setSubtitle,
    toggleFullscreen,
  }
}



